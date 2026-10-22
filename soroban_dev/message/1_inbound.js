
const config = require('../config.js');
const {
    Keypair,
    Contract,
    SorobanRpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    XdrLargeInt,
    Address,ScInt,
    nativeToScVal, xdr, scValToNative
} = require("@stellar/stellar-sdk");


const data = require('./data_cancle_order_template');

let { tx_send } = require('../common');
const {Buffer} = require('node:buffer');
const crypto = require('node:crypto');
const secp256k1 = require('secp256k1');

let message_sc = config.scAddr.message_bridge;
let contract = new Contract(message_sc);

const server = new SorobanRpc.Server(config.soroban_testUrl);

const sourceKeypair = Keypair.fromSecret(config.user1.secret);

const getEncodeInfo =  ()=> {
    // taskId bytes32,
    // networkId uint256, 32
    // contractAddr address, stellar-sc nft-market,40
    // functionCallData , Bytes,

    /*
    * functionCallData
    * wmbReceive
    * message_type
    * nft_contract
    * nft_id,
    * price,
    * price_token,
    * receipt,
    * buyer
    * */

    let call_data = {
        task_id: Buffer.from('hello'),
        network_id:data.networkId,
        contract_addr:new Address(data.contractAddr),

        wmb_receive:data.wmbReceive,

        message_type:data.messageData,
        nft_contract:new Address(data.messageData.nft_contract),
        nft_id:data.messageData.nft_id,
        price_token:new Buffer.from(data.messageData.price_token,'hex'),
        price:data.messageData.price,
        recipent:new Buffer.from(data.messageData.recipent,'hex'),
        buyer: new Address(data.messageData.buyer),

        evm_source_chain_id:data.evmChainId,
        evm_source_contract:new Buffer.from(data.evmScAddr,'hex')
    }

    let call_data_scVal = nativeToScVal(call_data, {type: {
            'task_id':['symbol'],
            'network_id':['symbol'],
            'contract_addr':['symbol'],
            'wmb_receive':['symbol'],
            'message_type':['symbol'],
            'nft_contract':['symbol'],
            'nft_id':['symbol'],
           'price_token':['symbol'],
          'price':['symbol'],
           'recipent':['symbol'],
          'buyer':['symbol'],
         'evm_source_chain_id':['symbol'],
        'evm_source_contract':['symbol'],
        }

    });

    return call_data_scVal.toXDR();





}

const getEncodeInfo2 = () => {
    let ScVal = xdr.ScVal;
    let jsOrig = ScVal.scvMap([
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('task_id'),
            val: ScVal.scvBytes(data.taskId)
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('network_id'),
            val: new ScInt(data.networkId).toU256(),
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('contract_addr'),
            val:new Address(data.contractAddr).toScVal()
        }),
        new xdr.ScMapEntry({
            key:ScVal.scvSymbol('wmb_receive'),
            val:ScVal.scvSymbol(data.wmbReceive)
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('message_type'),
            val:ScVal.scvString(data.messageData.message_type)
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('nft_contract'),
            val:new Address(data.messageData.nft_contract).toScVal()
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('nft_id'),
            val: new ScInt(data.messageData.nft_id).toI128()
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('price_token'),
            val: ScVal.scvBytes(data.messageData.price_token)
        }),
        new xdr.ScMapEntry({
            key:ScVal.scvSymbol('price'),
            val:new ScInt(data.messageData.price).toI128(),
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('recipent'),
            val: ScVal.scvBytes(data.messageData.recipent)
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('buyer'),
            val: new Address(data.messageData.buyer).toScVal()
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('evm_source_chain_id'),
            val: new ScInt(data.evmChainId).toU256(),
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('evm_source_contract'),
            val: ScVal.scvBytes(data.evmScAddr)
        }),

    ])

    return jsOrig.toXDR();
}
function test_encode3() {
    console.log('......');
    let sAddress = new Address('GB3KJPLFUYN5VL6R3GU3EGCGVCKFDSD7BEDX42HWG5BWFKB3KQGJJRMA');
    let scAddress = sAddress.toScVal();

    //let xdr = xdr;
    //let ScInt = StellarSdk.ScInt;
    let ScVal = xdr.ScVal;
    let jsOrig = ScVal.scvMap([
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('buyer'),
            val: scAddress
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('contract_addr'),
            val: scAddress
        }),

        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('evm_source_chain_id'),
            val: new ScInt(123).toU256(),
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('evm_source_contract'),
            val: ScVal.scvBytes('aaaa')
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('message_type'),
            val:ScVal.scvString('CreateOrder')
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('network_id'),
            val: new ScInt(111).toU256(),
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('nft_contract'),
            val: scAddress
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('nft_id'),
            val: new ScInt(123).toI128()
        }),
        new xdr.ScMapEntry({
            key:ScVal.scvSymbol('price'),
            val:new ScInt(111).toI128(),
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('price_token'),
            val: ScVal.scvBytes('MATIC')
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('recipent'),
            val: ScVal.scvBytes('abcd')
        }),
        new xdr.ScMapEntry({
            key: ScVal.scvSymbol('task_id'),
            val: ScVal.scvBytes('hello')
        }),

        new xdr.ScMapEntry({
            key:ScVal.scvSymbol('wmb_receive'),
            val:ScVal.scvSymbol('wmbreceive')
        }),





    ]);
    console.log(JSON.stringify(jsOrig));

    let x = jsOrig.toXDR();
   /* let m2 = x.toString('hex');
    console.log(m2);
    let y = ScVal.fromXDR(x);
    let z = StellarSdk.scValToNative(y);
    console.log(z);

    console.log('...finished...compatible scValType for XDR');*/
    return  x
}
const run = async ()=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());

    let encodeInfo = test_encode3();
    console.log('encodeInfo: ', encodeInfo);
   const sha256hash_str = await crypto.createHash('sha256').update(encodeInfo).digest('hex');
    const sha256hash =  Buffer.from(sha256hash_str,'hex');

    const user1_secp256k1_privKey = Buffer.from(config.secp256k1.user1.privKey,'hex');
    let user1_secp256k1_signagure = secp256k1.ecdsaSign(sha256hash,user1_secp256k1_privKey);
    console.log("user1_secp256k1_signagure.signature, ", user1_secp256k1_signagure.signature);
    console.log("user1_secp256k1_signagure.recid, ", user1_secp256k1_signagure.recid);

    const user2_secp256k1_privKey = Buffer.from(config.secp256k1.user2.privKey,'hex');
    let user2_secp256k1_signagure = secp256k1.ecdsaSign(sha256hash,user2_secp256k1_privKey);
    console.log("user2_secp256k1_signagure.signature, ", user2_secp256k1_signagure.signature);
    console.log("user2_secp256k1_signagure.recid, ", user2_secp256k1_signagure.recid);


    // console.log("secp256k1.public : ", secp256k1.ecdsaRecover(secp256k1_signagure.signature, secp256k1_signagure.recid, sha256hash,false));

    let user1_recid =  nativeToScVal(user1_secp256k1_signagure.recid, {type:'u32'});
    console.log(user1_recid.toXDR());
    console.log(user1_recid.toXDR().length);
    let user2_recid =  nativeToScVal(user2_secp256k1_signagure.recid, {type:'u32'});
    console.log(user2_recid.toXDR());
    console.log(user2_recid.toXDR().length);

    let byts = Buffer.concat([user1_secp256k1_signagure.signature, user1_recid.toXDR(),user2_secp256k1_signagure.signature, user2_recid.toXDR()]);

    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        contract.call("inbound_bytes",
            nativeToScVal('90001', {type:"u256"}),
            nativeToScVal(encodeInfo),
            nativeToScVal(byts)
        )
    ).setTimeout(30).build();

    console.log(`builtTransaction=${builtTransaction.toXDR()}`);

    let preparedTransaction = await server.prepareTransaction(builtTransaction);

    preparedTransaction.sign(sourceKeypair);


    console.log(
        `Signed prepared transaction XDR: ${preparedTransaction
            .toEnvelope()
            .toXDR("base64")}`,
    );
    tx_send(server, preparedTransaction);
}


const local_recover = async ()=> {
    let encodeInfo = getEncodeInfo();
    const sha256hash_str = await crypto.createHash('sha256').update(encodeInfo).digest('hex');
    const sha256hash =  Buffer.from(sha256hash_str,'hex');

    const secp256k1_privKey = Buffer.from(config.secp256k1.privKey,'hex');
    let secp256k1_signagure = secp256k1.ecdsaSign(sha256hash,secp256k1_privKey);
    console.log("secp256k1_signagure.signature, ", secp256k1_signagure.signature);
    console.log("secp256k1_signagure.recid, ", secp256k1_signagure.recid);

    console.log("secp256k1.public : ", secp256k1.ecdsaRecover(secp256k1_signagure.signature, secp256k1_signagure.recid, sha256hash,false));

    let recid =  nativeToScVal(secp256k1_signagure.recid, {type:'u32'});
    console.log(recid.toXDR());
    console.log(recid.toXDR().length);
}

run();
//4a50a01af23f057d0a891bd9254786d367cf55a76afc97cead573a1fb035c9c5





