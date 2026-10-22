const gconfig = require('../config');
const config = require('./config');

const SorobanClient = require('../SorobanClient');

const {
    Keypair,
    Contract,
    SorobanRpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    XdrLargeInt,
    scValToBigInt,
    scValToNative,xdr, ScInt
} = require("@stellar/stellar-sdk");

const getEvents = async  () => {
    const s_client = new SorobanClient();
    let ret = await s_client.getEvents(69894,config.eventSc,["DISPATCH_", "dispatch"] );
    console.log('ret : ', ret);
    console.log('ret.result: ', ret.result.events);
    let value = ret.result.events[0].value;
    console.log('value: ', value);
    let tmpBuff = Buffer.from(value,'base64');
    console.log('tmp: ', tmpBuff.toString('hex'));
    console.log('tmp2: ',tmpBuff.readUint32LE());

    //console.log(scValToNative(value));

    const v = xdr.ScVal.fromXDR(value, 'base64');
    const bigi = scValToBigInt(v);
    let sci =new ScInt(bigi);
    console.log('sci: ', sci.toNumber());

    console.log(scValToNative(v));

}


getEvents();
