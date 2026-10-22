
const config = require('../config.js');
const {
    Keypair,
    Contract,
    SorobanRpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    XdrLargeInt,
    Address,
    nativeToScVal, xdr
} = require("@stellar/stellar-sdk");



let contract = new Contract(config.scAddr.nft);
const server = new SorobanRpc.Server(config.soroban_testUrl);



const sourceKeypair = Keypair.fromSecret(config.user1.secret);



const {tx_send }= require("../common")
let user = sourceKeypair.publicKey();
//user = "GC5NSIEGIFEBG2PB6UJQT6F23PICEI7IMJCSVLYCFEZ5SYZOAWYSP2IE" // zhangwei 5001xx
 //user = "GDHCHFZVUMOFWTL4S6P4T62BRW3YECJU2Y2XGAMJUAQO5GEPQGWBHIFE";  //jiang   502xx
//user = "GB3GNKKXPOWFFCRNK6JOW3ESJU52VZWXVZGDRE7GUQIQ3GMPPCPFRE47"; //haolifeng-web-test 503xx
//user = "GCJX26JVI3BUUQICUP7I6HAAHPZUEUYABBGUFJKM4DBBMZUXSSLYOHGL";// wangyouhua  504xx
//user = "GDHZBGZWIYQMA2YML7YVCVT54RUBUV37PXNNTHLL4OP4BTCZLP77JS3G"; //stellar companay 4000xx

//user = "GAME6SSAHTEVX4XPZAVKV4ELIR6ADCWNEYZA267DOOITMRRNNPOQTIGP";
const mint = async (nft_id)=> {
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(
        contract.call(
            "mint",
            nativeToScVal(new Address(user), {type:'Address'}),
            nativeToScVal(nft_id, {type:'i128'})

        )
    ).setTimeout(30).build();

    console.log(`builtTransaction=${builtTransaction.toXDR()}`);


    let ret = await server.simulateTransaction(builtTransaction);
   // console.log('ret: ', ret);
    console.log("cost:", ret.cost);
    console.log("result:", ret.result);
    console.log("error:", ret.error);
    console.log("latestLedger:", ret.latestLedger);

    let preparedTransaction = await server.prepareTransaction(builtTransaction);

    console.log('preparedTransaction is: ', preparedTransaction);
    console.log('preparedTransaction.fee', preparedTransaction.fee);



    // Sign the transaction with the source account's keypair.
    preparedTransaction.sign(sourceKeypair);

    // Let's see the base64-encoded XDR of the transaction we just built.
    console.log(
        `Signed prepared transaction XDR: ${preparedTransaction
            .toEnvelope()
            .toXDR("base64")}`,
    );
    await tx_send(server, preparedTransaction);


}
let nft_id = config.cur_nft_id;
mint(nft_id);

