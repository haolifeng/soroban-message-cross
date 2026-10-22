const {
    nativeToScVal,
    scValToNative,
    ScInt,
    xdr,ScVal, StrKey,
} = require('@stellar/stellar-base');
const {Keypair, Address} = require("@stellar/stellar-sdk");
const config = require("../config");


/*
* var txHandler = function (txResponse) {
    console.log(
      JSON.stringify(StellarSdk.xdr.TransactionEnvelope.fromXDR(txResponse.envelope_xdr, 'base64'))
    );
    console.log(
      JSON.stringify(StellarSdk.xdr.TransactionResult.fromXDR(txResponse.result_xdr, 'base64'))
    );
    console.log(
      JSON.stringify(StellarSdk.xdr.TransactionMeta.fromXDR(txResponse.result_meta_xdr, 'base64'))
    );
};

* */


let data = [25,206,227,223,149,141,58,28,94,155,205,34,26,226,213,153,12,249,153,58,108,123,11,188,141,166,84,222,108,238,42,151];



console.log(StrKey.encodeEd25519PublicKey(data))