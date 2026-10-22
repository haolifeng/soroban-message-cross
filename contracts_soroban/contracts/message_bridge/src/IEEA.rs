use soroban_sdk::{BytesN, U256, Bytes};
pub struct EncodedInfo {
    task_id: BytesN<32>,
    network_id: U256,
    contract_adddress: Bytes,
    function_call_data: Bytes,
}

trait ICrosschainFunctionCall {
     fn out_bound_call(network_id: U256, contract_address: Bytes, function_call_data: Bytes);
    fn in_bound_call(network_id: U256, encoded_info: Bytes, encoded_proof:Bytes);
}