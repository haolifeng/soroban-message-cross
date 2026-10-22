
use soroban_sdk::{symbol_short, Env, Address};

pub(crate) fn transfer(e: &Env, from: Address, to: Address, id: i128) {
    let topics = (symbol_short!("transfer"), from, to);
    e.events().publish(topics, id);
}

pub(crate) fn set_admin(e: &Env, admin: Address, new_admin: Address) {
    let topics = (symbol_short!("set_admin"), admin);
    e.events().publish(topics, new_admin);
}

pub(crate) fn mint(e: &Env, admin:Address, to: Address, id: i128) {
    let topics = (symbol_short!("mint"), admin, to);
    e.events().publish(topics, id);
}

pub(crate) fn burn(e: &Env, from: Address, id: i128) {
    let topics = (symbol_short!("burn"), from);
    e.events().publish(topics, id);
}

pub(crate) fn approve(e: &Env, from: Address, to: Address, id: i128) {
    let topics = (symbol_short!("approve"), from, to);
    e.events().publish(topics, id);
}

pub(crate) fn approve_all(e: &Env, to: Address, from: Address) {
    let topics = (symbol_short!("appro_all"), to);
    e.events().publish(topics, from);
}
