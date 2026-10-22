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
const rpc = process.argv[2];
const num = process.argv[3];
const logfile = process.argv[4];

const Logger = require('./logger');
const axios = require('axios');
console.log('rpc, num, logfile', rpc, num, logfile);
const logger = new Logger("press", logfile, logfile, "info");

const tunnel =require('tunnel');

const hlf_agent = tunnel.httpsOverHttp({
    proxy:{ host:'127.0.0.1', port: 7897 }
});
const run = async ()=> {

    let res = await axios({
        method:'post',
        url:'https://soroban-testnet.stellar.org',

        data:{
        "jsonrpc": "2.0",
        "id": 8675309,
        "method": "getTransactions",
        "params": {
            "startLedger": 700000,
            "pagination": {
                "limit": 50
            }
        }
    },

}
)

    console.log('res.data.result: ', res.data.result.transactions.length);
   /* let txs = res.data.result.transactions;

    for(let i=0; i < txs.length;i++){
        //console.log(i ,': ', txs[i]);
    }
*/
}
function idleSleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}


const main = async ()=> {
    let oldTime = new Date().getTime();
    logger.info("oldTime: ", oldTime);
    try{

        for(let i =0; i< num;i++){
                logger.info('i ======= ', i)
                await run();
        }

        let newTime = new Date().getTime();
        logger.info("newTime ", newTime);
        let spendTime = newTime - oldTime;

        logger.info('spendTime: ', spendTime);
        logger.info('spendTime / 1000: ', spendTime/ 1000)
        await idleSleep(3000)


    }catch (e){
        let newTime = new Date().getTime();
        logger.info("newTime ", newTime);
        let spendTime = newTime - oldTime;

        logger.info('spendTime: ', spendTime);
        logger.info('spendTime / 1000: ', spendTime/ 1000);
        logger.info('e: ', e);
    }

}
main();