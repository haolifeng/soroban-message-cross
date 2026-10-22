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

const ethers = require('ethers');

const run = async ()=>{
    let wallet = ethers.Wallet.createRandom();
    console.log('wallet.prikey: ', wallet.privateKey);

    let ke = Keypair.fromRawEd25519Seed(new Buffer.from(wallet.privateKey.slice(2), 'hex'));
    console.log(ke);
}
run();