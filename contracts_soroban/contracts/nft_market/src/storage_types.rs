use soroban_sdk::{contracttype, Address, U256, Vec, String, Bytes, BytesN};
use soroban_sdk::crypto::Hash;


#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MessageData {
    pub message_type: String,
    pub nft_contract:Address,  //32
    pub nft_id: i128,         //16
    pub price_token: Bytes, //20
    pub price: i128,         //16
    pub recipent: Bytes,  //evm address 20
    pub buyer:Address,    // stellar address 32
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PeerChainData {
    pub evm_chain_id: U256,
    pub evm_chain_sc: Bytes
}



#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    GateWay,
    OrderKey(BytesN<32>),
    OrderCount,
    OrderNo(u128),
    PeerChain
}
