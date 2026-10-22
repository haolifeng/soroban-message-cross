use crate::storage_types::DataKey;

use soroban_sdk::{Address, Env, String};

/// Canonical Stellar "null" account.
///
/// The previous implementation passed 32 zero bytes to
/// `Address::from_string_bytes`, which is not a valid StrKey string and can
/// trap, making `owner()` (and therefore `check_owner`) unusable for tokens
/// that do not exist yet.
pub fn zero_address(_env: &Env) -> Address {
    Address::from_string(&String::from_str(
        _env,
        "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    ))
}

pub fn read_owner(env: &Env, id: i128) -> Address {
    let key = DataKey::Owner(id);
    match env.storage().instance().get::<DataKey, Address>(&key) {
        Some(addr) => addr,
        None => zero_address(&env),
    }
}
pub fn has_owner(env: &Env, id: i128) -> bool {
    let key = DataKey::Owner(id);
    env.storage().instance().has(&key)
}

pub fn write_owner(env: &Env, id: i128, owner: Address) {
    let key = DataKey::Owner(id);
    env.storage().instance().set(&key, &owner);
}
pub fn remove_owner(env: &Env, id: i128) {
    let key = DataKey::Owner(id);
    env.storage().instance().remove(&key)
}

pub fn check_owner(env: &Env, auth: &Address, id: i128) {
    assert!(
        auth == &read_owner(env, id),
        "not the owner for token {}",
        id
    );
}
