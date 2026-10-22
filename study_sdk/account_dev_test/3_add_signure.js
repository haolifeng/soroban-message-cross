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
    nativeToScVal,
    Operation,
    Horizon

} = require("@stellar/stellar-sdk");


const run = async () => {
    let contract = new Contract(config.scAddr);
    const server = new Horizon.Server(config.horizon_testUrl);

    let keypair = config.adminKeyPair;
    const sourceKeypair = Keypair.fromSecret(
        keypair.secret
    );
    let admin = new Address(config.adminKeyPair.publicKey);
    let user1 = new Address(config.user1KeyPair.publicKey);

    let signers;
    if(admin > user1) {
        signers = [user1.toBuffer(), admin.toBuffer()]
    } else{
        signers = [admin.toBuffer(), user1.toBuffer()]
    }
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
    let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(Operation.setOptions({
        signer:{
            ed25519PublicKey: config.user1KeyPair.publicKey,
            weight:1
        }
    })).setTimeout(30).build();

    console.log(`builtTransaction=${builtTransaction.toXDR()}`);



    // Sign the transaction with the source account's keypair.
    builtTransaction.sign(sourceKeypair);

    // Let's see the base64-encoded XDR of the transaction we just built.
    console.log(
        `Signed prepared transaction XDR: ${builtTransaction
            .toEnvelope()
            .toXDR("base64")}`,
    );

    try {
        let sendResponse = await server.sendTransaction(builtTransaction);
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