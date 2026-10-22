use core::ptr::hash;
use soroban_sdk::{Env, BytesN, Vec, contracttype, contracterror, U256, Bytes, Map, map};
use soroban_sdk::xdr::ToXdr;
use crate::ICrosschainVerifier::{Signagture,Proof};
use crate::Secp256k1Pubkey::{find_pubkey};
use crate::threshold::{read_threshold};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub struct Secep256k1Signature {
    pub signature:BytesN<64>,
    pub recid: u32,
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

pub fn decode_and_verify(env: &Env,  encoded_info: Bytes,
                         signatures:&Vec<Secep256k1Signature>) -> Bytes{

    let data_hash_v = env.crypto().sha256(&encoded_info);

    let l = signatures.len();
    let threshold = read_threshold(&env);
    if threshold == 0 {
        panic!("threshold must be greater than zero");
    }
    // Compare in u128 to avoid truncating a large threshold into u32 and
    // accidentally accepting fewer signatures than configured.
    if (l as u128) < threshold {
        panic!("not enough signatures");
    }

    let mut count_map: Map<BytesN<65>,u128> = map![&env,];
    for i in 0..l {
        let signature = signatures.get_unchecked(i);
        env.events().publish(("signatures", ), signature.clone());
        let pubkey = env.crypto().secp256k1_recover(&data_hash_v, &signature.signature, signature.recid);
        let j = find_pubkey(&env, pubkey.clone());
        if j == 0 {
            panic!("no find public key");
        }
        if count_map.contains_key(pubkey.clone()) == false {
            count_map.set(pubkey.clone(), 1);
        }else {
            let mut count = count_map.get_unchecked(pubkey.clone());
            count += 1;
            count_map.set(pubkey.clone(), count);
        }
    }
    for(pubkey, count) in count_map {
        if count != 1 {
            panic!("signatures is duplicate");
        }
    }
    encoded_info
}



