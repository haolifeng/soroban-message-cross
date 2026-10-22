#![no_std]
use soroban_sdk::{auth::{Context, CustomAccountInterface}, crypto::Crypto,
                  contract, contracterror, contractimpl, contracttype,
                  symbol_short, Address, BytesN, Env, Map, String,
                  Symbol, TryIntoVal,vec,Error,Val,
                  Vec, Bytes, U256, IntoVal, assert_with_error};
use soroban_sdk::crypto::Hash;
use soroban_sdk::xdr::{FromXdr, PublicKey, ToXdr};

use soroban_sdk::xdr::TypeVariant::Uint256;
use crate::admin::{has_administrator, read_administrator, write_administrator};
use crate::chain_id::{has_chain_id,read_chain_id,write_chain_id};
use crate::nonce::{write_nonce,has_nonce,read_nonce};
use crate::verifier::{has_verifier, read_verifier, write_verifier};
use crate::MessageExecuted::{has_task_key,write_task_key};
use crate::IEEA::{EncodedInfo};
use crate::ICrosschainVerifier::VerifierClient;
use crate::cross_chain_verifier::{ decode_and_verify, Secep256k1Signature};
use crate::storage_types::{DataKey, PeerData};
use crate::threshold::{has_threshold, write_threshold,read_threshold};
use crate::Secp256k1Pubkey::{has_pubkey_count,has_pubkey_no, add_pubkey, delete_pubkey, read_pubkey_count};



#[contract]
pub struct MessageContract;

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
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
struct ReceiveMsgData {
    target_contract :Address,
    function_call_data :Bytes,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EncodeInfo {
    pub task_id: Bytes,
    pub network_id: U256,
    pub contract_addr: Address,
    pub wmb_receive: Symbol,
    pub message_type: String,
    pub nft_contract: Address,
    pub nft_id: i128,
    pub price_token: Bytes,
    pub price:i128,
    pub recipent: Bytes,
    pub buyer:Address,
    pub evm_source_chain_id: U256,
    pub evm_source_contract: Bytes

}



#[contractimpl]
impl MessageContract {
    /// One-time initialization.
    ///
    /// IMPORTANT: deployment and this call must happen atomically (factory
    /// contract or a single deployment transaction). See SECURITY.md.
    pub fn init(env: Env, admin: Address, chain_id: U256, owner: Vec<BytesN<65>>, threshold: u128) {
        assert!(!has_administrator(&env), "already initialized");
        assert!(!has_chain_id(&env), "already initialized");
        admin.require_auth();

        assert!(!owner.is_empty(), "at least one owner is required");
        assert!(threshold > 0, "threshold must be greater than zero");
        assert!(
            threshold <= owner.len() as u128,
            "threshold exceeds owner count"
        );

        write_administrator(&env, &admin);
        write_chain_id(&env, &chain_id);
        write_threshold(&env, threshold);

        for i in 0..owner.len() {
            let pubkey = owner.get_unchecked(i);
            assert!(
                crate::Secp256k1Pubkey::find_pubkey(&env, pubkey.clone()) == 0,
                "duplicate owner"
            );
            add_pubkey(&env, pubkey);
        }
    }

    pub fn admin(env: Env) -> Address {
        read_administrator(&env)
    }

    /// Configures the verifier contract used to authenticate inbound messages.
    /// Only the bridge admin may change it.
    pub fn set_verifier(env: Env, verifier: Address) {
        let admin = read_administrator(&env);
        admin.require_auth();
        write_verifier(&env, &verifier);
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        let admin = read_administrator(&env);
        admin.require_auth();
        write_administrator(&env, &new_admin);
    }

    /// Adds a validator key. Key rotation must be possible without redeploying
    /// the bridge (e.g. when a validator is compromised).
    pub fn add_owner(env: Env, owner: BytesN<65>) {
        let admin = read_administrator(&env);
        admin.require_auth();
        assert!(
            crate::Secp256k1Pubkey::find_pubkey(&env, owner.clone()) == 0,
            "owner already exists"
        );
        add_pubkey(&env, owner);
    }

    pub fn remove_owner(env: Env, owner: BytesN<65>) {
        let admin = read_administrator(&env);
        admin.require_auth();
        let count = read_pubkey_count(&env);
        assert!(
            count > read_threshold(&env),
            "cannot remove owner at or below threshold"
        );
        delete_pubkey(&env, owner);
    }

    pub fn set_threshold(env: Env, threshold: u128) {
        let admin = read_administrator(&env);
        admin.require_auth();
        let count = read_pubkey_count(&env);
        assert!(threshold > 0, "threshold must be greater than zero");
        assert!(threshold <= count, "threshold exceeds owner count");
        write_threshold(&env, threshold);
    }

    pub fn get_threshold(env: Env) -> u128 {
        read_threshold(&env)
    }

    /// Restricts the bridge to a single trusted source chain/contract. A
    /// message signed by the validators for any other peer is rejected.
    pub fn set_peer(env: Env, chain_id: U256, contract: Bytes) {
        let admin = read_administrator(&env);
        admin.require_auth();
        assert!(!contract.is_empty(), "peer contract must not be empty");
        env.storage()
            .instance()
            .set(&DataKey::Peer, &PeerData { chain_id, contract });
    }

    pub fn get_peer(env: Env) -> PeerData {
        env.storage()
            .instance()
            .get(&DataKey::Peer)
            .expect("peer not configured")
    }

    pub fn inbound_bytes(env: Env, network_id: U256, encoded_info: Bytes, encoded_proof: Bytes) {
        // Fail closed: an uninitialized bridge or a bridge without a verifier
        // must never accept a message.
        assert!(has_chain_id(&env), "bridge is not initialized");
        let chain_id = read_chain_id(&env);
        assert!(network_id == chain_id, "invalid destination network id");
        assert!(has_verifier(&env), "verifier is not configured");

        // The verifier must authenticate (threshold signature check) and
        // return exactly the payload it verified.
        let verifier = read_verifier(&env);
        let verified_info = VerifierClient::new(&env, &verifier).decode_and_verify(
            &network_id,
            &encoded_info,
            &encoded_proof,
        );
        assert!(
            verified_info == encoded_info,
            "verifier returned a different payload"
        );

        let encode_info = EncodeInfo::from_xdr(&env, &verified_info).unwrap();
        assert!(
            encode_info.network_id == chain_id,
            "payload network id mismatch"
        );

        // Only accept messages from the configured peer chain/contract.
        let peer: PeerData = env
            .storage()
            .instance()
            .get(&DataKey::Peer)
            .expect("peer not configured");
        assert!(
            encode_info.evm_source_chain_id == peer.chain_id,
            "unexpected source chain"
        );
        assert!(
            encode_info.evm_source_contract == peer.contract,
            "unexpected source contract"
        );
        assert!(!encode_info.task_id.is_empty(), "empty task id");
        assert!(
            !has_task_key(&env, encode_info.task_id.clone()),
            "message already executed"
        );

        // Mark the task before dispatching so a message can never execute
        // twice (replay protection).
        write_task_key(&env, encode_info.task_id.clone());

        env.events()
            .publish(("inbound_bytes", "encodeInfo"), encode_info)
    }

    /// Backwards-compatible alias used by the deployment scripts.
    pub fn inbound_call(env: Env, network_id: U256, encoded_info: Bytes, encoded_proof: Bytes) {
        Self::inbound_bytes(env, network_id, encoded_info, encoded_proof)
    }
}


