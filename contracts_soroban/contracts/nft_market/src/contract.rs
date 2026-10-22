#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, vec, Env, Symbol, Vec, Address, U256, contracttype, Bytes, crypto::Crypto, token, String, bytes};


use soroban_sdk::xdr::{ToXdr,FromXdr };


#[contract]
pub struct NftMarketContract;

#[contractimpl]
impl NftMarketContract {
    pub fn get_storage_max_ttl(env: Env) -> u32 {
        env.storage().max_ttl()
    }

    pub fn extend_ttl_for_storage_instance (env: Env, threshold: u32, extend_to: u32) {
        env.storage().instance().extend_ttl(threshold, extend_to);
    }

}
