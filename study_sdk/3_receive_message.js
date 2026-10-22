const config = require('./config');
const {
    Keypair,
    Contract,
    SorobanRpc,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    XdrLargeInt,
    Address,
    nativeToScVal
} = require("@stellar/stellar-sdk");

const run = async () => {
    let contract = new Contract(config.msgCrossScAddr);
    const server = new SorobanRpc.Server(config.soroban_testUrl);

    let keypair = config.adminKeyPair;
    const sourceKeypair = Keypair.fromSecret(
        keypair.secret
    );

    let adminAddr = new Address(config.adminKeyPair.publicKey);


    const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(contract.call("receive_message",adminAddr.toScVal())).setTimeout(30).build();

    let preparedTransaction = await server.prepareTransaction(builtTransaction);

    // Let's see the base64-encoded XDR of the transaction we just built.
    console.log(
        `Signed prepared transaction XDR: ${preparedTransaction
            .toEnvelope()
            .toXDR("base64")}`,
    );

    let admin = sourceKeypair;
    let user1 = Keypair.fromSecret(config.user1KeyPair.secret);



    let signers;
    if(admin.publicKey() > user1.publicKey()) {
        signers = [user1, admin]
    } else{
        signers = [admin, user1]
    }
    console.log('admin: ', admin);
    console.log('user1: ', user1);
    preparedTransaction.sign(admin);


    try {
        let sendResponse = await server.sendTransaction(preparedTransaction);
        console.log(`Sent transaction: ${JSON.stringify(sendResponse)}`);

        if (sendResponse.status === "PENDING") {
            let getResponse = await server.getTransaction(sendResponse.hash);
            // Poll `getTransaction` until the status is not "NOT_FOUND"
            while (getResponse.status === "NOT_FOUND") {
                console.log("Waiting for transaction confirmation...");
                // See if the transaction is complete
                getResponse = await server.getTransaction(sendResponse.hash);
                // Wait one second
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            console.log(`getTransaction response: ${JSON.stringify(getResponse)}`);

            if (getResponse.status === "SUCCESS") {
                // Make sure the transaction's resultMetaXDR is not empty
                if (!getResponse.resultMetaXdr) {
                    throw "Empty resultMetaXDR in getTransaction response";
                }
                // Find the return value from the contract and return it
                let transactionMeta = getResponse.resultMetaXdr;
                let returnValue = transactionMeta.v3().sorobanMeta().returnValue();
                console.log(`Transaction result: ${returnValue.value()}`);
            } else {
                throw `Transaction failed: ${getResponse.resultXdr}`;
            }
        } else {
            throw sendResponse.errorResultXdr;
        }
    } catch (err) {
        // Catch and report any errors we've thrown
        console.log("Sending transaction failed");
        console.log(JSON.stringify(err));
    }

}
run();