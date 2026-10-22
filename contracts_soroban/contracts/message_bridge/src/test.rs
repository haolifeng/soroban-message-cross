#![cfg(test)]

use crate::contract::EncodeInfo;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::xdr::{FromXdr, ToXdr};
use soroban_sdk::{symbol_short, Address, Bytes, Env, String, U256};

#[test]
fn encode_info_xdr_round_trip() {
    let env = Env::default();
    let address = Address::generate(&env);

    let info = EncodeInfo {
        task_id: Bytes::from_slice(&env, b"task-1"),
        network_id: U256::from_u32(&env, 90001),
        contract_addr: address.clone(),
        wmb_receive: symbol_short!("wmbRecv"),
        message_type: String::from_str(&env, "CancelOrder"),
        nft_contract: address.clone(),
        nft_id: 500111,
        price_token: Bytes::from_slice(&env, b"token"),
        price: 123456,
        recipent: Bytes::from_slice(&env, b"recipient"),
        buyer: address,
        evm_source_chain_id: U256::from_u32(&env, 80001),
        evm_source_contract: Bytes::from_slice(&env, b"0x77ad"),
    };

    let encoded = info.clone().to_xdr(&env);
    let decoded = EncodeInfo::from_xdr(&env, &encoded).unwrap();
    assert_eq!(decoded, info);
}
