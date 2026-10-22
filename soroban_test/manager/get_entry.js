const config = require('../config');
const {
    Keypair,
    Contract,
    SorobanRpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    XdrLargeInt,
    Address,
    nativeToScVal, xdr,
} = require('@stellar/stellar-sdk');
const server = new SorobanRpc.Server(config.soroban_testUrl);
const getLedgerKeySymbol = (contractId, symbolText) => {
    const ledgerKey = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
            contract: new Address(contractId).toScAddress(),
            key: xdr.ScVal.scvSymbol(symbolText),
            durability: xdr.ContractDataDurability.persistent(),
        }),
    );
    return ledgerKey//.toXDR("base64");
};

function getLedgerKeyContractCode(contractId) {
    const instance = new Contract(contractId).getFootprint();
    return instance//.toXDR("base64");
}

const run = async ()=> {
    let symbolText = "Admin";
    let  contractDatKey = getLedgerKeySymbol(config.scAddr.nft, symbolText);

    let ret = await server.getLedgerEntries(contractDatKey);

    console.log('ret: ', ret)

    let codeKey = getLedgerKeyContractCode(config.scAddr.nft);

    ret = await server.getLedgerEntries(codeKey);

    console.log('contract code: ', ret)


}
run();