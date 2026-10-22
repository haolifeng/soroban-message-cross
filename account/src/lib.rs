//! This a basic multi-sig account contract that with a customizable per-token
//! authorization policy.
//!
//! This demonstrates how to build the account contracts and how to use the
//! authorization context in order to implement custom authorization policies
//! that would govern all the account contract interactions.
#![no_std]

use soroban_sdk::{
    auth::{Context, CustomAccountInterface},
    contract, contracterror, contractimpl, contracttype, crypto::Hash, symbol_short, Address,
    BytesN, Env, Map, Symbol, TryIntoVal, Vec,
};
#[contract]
struct AccountContract;

#[contracttype]
#[derive(Clone)]
pub struct AccSignature {
    pub public_key: BytesN<32>,
    pub signature: BytesN<64>,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    SignerCnt,
    Signer(BytesN<32>),
    SpendLimit(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum AccError {
    NotEnoughSigners = 1,
    NegativeAmount = 2,
    BadSignatureOrder = 3,
    UnknownSigner = 4,
    InvalidContext = 5,
}

const TRANSFER_FN: Symbol = symbol_short!("transfer");

#[contractimpl]
impl AccountContract {
    // Initialize the contract with a list of ed25519 public key ('signers').
    pub fn init(env: Env, signers: Vec<BytesN<32>>) {
        // Initialization must be atomic with deployment (see SECURITY.md).
        // At minimum, never allow an already initialized account to be
        // re-initialized and have its signer set replaced.
        assert!(
            !env.storage().instance().has(&DataKey::SignerCnt),
            "already initialized"
        );
        assert!(!signers.is_empty(), "at least one signer is required");

        for signer in signers.iter() {
            assert!(
                !env
                    .storage()
                    .instance()
                    .has(&DataKey::Signer(signer.clone())),
                "duplicate signer"
            );
            env.storage().instance().set(&DataKey::Signer(signer), &());
        }
        env.storage()
            .instance()
            .set(&DataKey::SignerCnt, &signers.len());
    }

    // Adds a limit on any token transfers that aren't signed by every signer.
    pub fn add_limit(env: Env, token: Address, limit: i128) {
        // The current contract address is the account contract address and has
        // the same semantics for `require_auth` call as any other account
        // contract address.
        // Note, that if a contract *invokes* another contract, then it would
        // authorize the call on its own behalf and that wouldn't require any
        // user-side verification.
        env.current_contract_address().require_auth();
        assert!(limit >= 0, "limit must not be negative");
        env.storage()
            .instance()
            .set(&DataKey::SpendLimit(token), &limit);
    }
}

#[contractimpl]
impl CustomAccountInterface for AccountContract {
    type Signature = Vec<AccSignature>;
    type Error = AccError;


    #[allow(non_snake_case)]
    fn __check_auth(
        env: Env,
        signature_payload: Hash<32>,
        signatures: Vec<AccSignature>,
        auth_context: Vec<Context>,
    ) -> Result<(), AccError> {
        // Perform authentication. This MUST run before any policy check,
        // otherwise arbitrary callers could authorize account operations
        // without providing a valid signature.
        authenticate(&env, &signature_payload, &signatures)?;

        let signer_cnt: u32 = env
            .storage()
            .instance()
            .get(&DataKey::SignerCnt)
            .unwrap_or(0);
        if signer_cnt == 0 {
            return Err(AccError::NotEnoughSigners);
        }

        let all_signed = signatures.len() == signer_cnt;
        let curr_contract = env.current_contract_address();
        let mut spend_left_per_token = Map::<Address, i128>::new(&env);
        for context in auth_context.iter() {
            verify_authorization_policy(
                &env,
                &context,
                &curr_contract,
                all_signed,
                &mut spend_left_per_token,
            )?;
        }
        Ok(())
    }
}

fn authenticate(
    env: &Env,
    signature_payload: &Hash<32>,
    signatures: &Vec<AccSignature>,
) -> Result<(), AccError> {
    // At least one valid signer is always required. The per-token spend
    // policy may allow a subset of signers, but never no signature at all.
    if signatures.is_empty() {
        return Err(AccError::NotEnoughSigners);
    }

    // Signatures must be strictly ordered by public key. This rejects both
    // duplicates and re-ordering attempts that could otherwise be used to
    // satisfy a "distinct signers" check with the same key.
    let mut prev_pk: Option<BytesN<32>> = None;
    for sig in signatures.iter() {
        if !env
            .storage()
            .instance()
            .has(&DataKey::Signer(sig.public_key.clone()))
        {
            return Err(AccError::UnknownSigner);
        }

        if let Some(prev) = prev_pk {
            if prev >= sig.public_key {
                return Err(AccError::BadSignatureOrder);
            }
        }

        // The host verifies the ed25519 signature and traps on failure.
        env.crypto().ed25519_verify(
            &sig.public_key,
            &signature_payload.clone().into(),
            &sig.signature,
        );

        prev_pk = Some(sig.public_key.clone());
    }

    Ok(())
}

fn verify_authorization_policy(
    env: &Env,
    context: &Context,
    curr_contract: &Address,
    all_signed: bool,
    spend_left_per_token: &mut Map<Address, i128>,
) -> Result<(), AccError> {
    let contract_context = match context {
        Context::Contract(c) => {
            if &c.contract == curr_contract {
                if !all_signed {
                    return Err(AccError::NotEnoughSigners);
                }
            }
            c
        }
        Context::CreateContractHostFn(_) => return Err(AccError::InvalidContext),
    };
    // For the account control every signer must sign the invocation.

    // Otherwise, we're only interested in functions that spend tokens.
    if contract_context.fn_name != TRANSFER_FN
        && contract_context.fn_name != Symbol::new(env, "approve")
    {
        return Ok(());
    }

    let spend_left: Option<i128> =
        if let Some(spend_left) = spend_left_per_token.get(contract_context.contract.clone()) {
            Some(spend_left)
        } else if let Some(limit_left) = env
            .storage()
            .instance()
            .get::<_, i128>(&DataKey::SpendLimit(contract_context.contract.clone()))
        {
            Some(limit_left)
        } else {
            None
        };

    // Fail closed: a subset of signers may only spend tokens that have an
    // explicit limit. If no limit is configured, every signer must sign.
    let Some(spend_left) = spend_left else {
        if !all_signed {
            return Err(AccError::NotEnoughSigners);
        }
        return Ok(());
    };

    // 'amount' is the third argument in both `approve` and `transfer`.
    // If the contract has a different signature, it's safer to panic
    // here, as it's expected to have the standard interface.
    let spent: i128 = contract_context
        .args
        .get(2)
        .unwrap()
        .try_into_val(env)
        .unwrap();
    if spent < 0 {
        return Err(AccError::NegativeAmount);
    }
    if !all_signed && spent > spend_left {
        return Err(AccError::NotEnoughSigners);
    }
    spend_left_per_token.set(contract_context.contract.clone(), spend_left - spent);
    Ok(())
}

mod test;
