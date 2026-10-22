const {
    BASE_FEE,
    Networks,
    Keypair,
    TransactionBuilder,
    SorobanDataBuilder,
    SorobanRpc,
    xdr,
} = require('@stellar/stellar-sdk');

const { Api, assembleTransaction } = SorobanRpc;

async function yeetTx(tx){
    return server.sendTransaction(tx).then(async (reply) => {
        if (reply.status !== "PENDING") {
            throw reply;
        }

        let status;
        let attempts = 0;
        while (attempts++ < 5) {
            const tmpStatus = await server.getTransaction(reply.hash);
            switch (tmpStatus.status) {
                case "FAILED":
                    throw tmpStatus;
                case "NOT_FOUND":
                    await sleep(500);
                    continue;
                case "SUCCESS":
                    status = tmpStatus;
                    break;
            }
        }

        if (attempts >= 5 || !status) {
            throw new Error(`Failed to find transaction ${reply.hash} in time.`);
        }

        return status;
    });
}
async function submitOrRestoreAndRetry(signer, tx){
    const sim = await server.simulateTransaction(tx);
    if (!Api.isSimulationSuccess(sim)) {
        throw sim;
    }
    if(!Api.isSimulationRestore(sim)) {
        const preTx = assembleTransaction(tx,sim);
        preTx.sing(signer);
        return yeetTx(preTx);
    }

    const account = await server.getAccount(signer.publicKey());

    let fee = parseInt(BASE_FEE);
    fee += parseInt(sim.restorePreamble.minResourceFee);
    const restoreTx = new TransactionBuilder(account, {fee: fee.toString()})
        .setNetworkPassphrase(Networks.TESTNET)
        .setSorobanData(sim.restorePreamble.transactionData.build())
        .addOperation(Operation.restoreFootprint({}))
        .build();
    restoreTx.sign(signer);

    const resp = await yeetTx(restoreTx);
    if(resp.status !== Api.GetTransactionStatus.SUCCESS) {
        throw resp;
    }
    const retryTxBuilder = TransactionBuilder.cloneFrom(Tx, {
        fee: (parseInt(tx.fee) + parseInt(sim.minResourceFee)).toString(),
        sorobanData: sim.transactionData.build(),
    });

    retryTxBuilder.source.incrementSequenceNumber();
    const retryTx = retryTxBuilder.build();
    retryTx.sign(signer);

    return yeetTx(retryTx);
}