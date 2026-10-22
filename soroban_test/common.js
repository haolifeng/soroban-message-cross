const {scValToNative, Address} = require("@stellar/stellar-sdk");

const send_operation = async (sourceKeypair, server, builtTransaction)=>{
    console.log(`builtTransaction=${builtTransaction.toXDR()}`);
    let preparedTransaction = await server.prepareTransaction(builtTransaction);
    console.log('preparedTransaction is: ', preparedTransaction);
    preparedTransaction.sign(sourceKeypair);
    console.log(`Signed prepared transaction XDR: ${preparedTransaction.toEnvelope().toXDR("base64")}`,);
    await tx_send(server, preparedTransaction);
}

const tx_send = async (server, preparedTransaction)=> {
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
                //console.log(`Transaction result: ${returnValue.value()}`);
                console.log('Transaction result is: ', scValToNative(returnValue));
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

module.exports  = {
    tx_send,send_operation

}