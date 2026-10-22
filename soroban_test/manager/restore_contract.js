const {
    BASE_FEE,
    Contract,
    Keypair,
    Networks,
    TransactionBuilder,
    SorobanDataBuilder,
    Operation,
    SorobanRpc,xdr,
} = require('@stellar/stellar-sdk');

const RPC_SERVER = "https://soroban-testnet.stellar.org/";
const server = new SorobanRpc.Server(RPC_SERVER);
const config = require('../config');

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

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const getWasmLedgerKey = async(entry) => {
    return xdr.LedgerKey.contractCode(
        new xdr.LedgerKeyContractCode({
            hash: entry.val().instance().wasmHash()
        })
    );
}
const restoreContract = async (signer, c)=> {
    const instance = c.getFootprint();

    const account = await server.getAccount(signer.publicKey());

    const wasmEntry = await server.getLedgerEntries(
        getWasmLedgerKey(instance)
    );

    const restoreTx = new TransactionBuilder(account, { fee: BASE_FEE })
        .setNetworkPassphrase(Networks.TESTNET)
        .setSorobanData(
            // Set the restoration footprint (remember, it should be in the
            // read-write part!)
            new SorobanDataBuilder().setReadWrite([
                instance,
                wasmEntry
            ]).build(),
        )
        .addOperation(Operation.restoreFootprint({}))
        .build();

    const preppedTx = await server.prepareTransaction(restoreTx);
   // preppedTx.sign(signer);

   // let status = await yeetTx(preppedTx);
   // console.log('status: ', status);
}

const main= async()=> {
    const sourceKeypair = Keypair.fromSecret(config.user1.secret);

    let market_contract_address = config.scAddr.nft_market;
    let market_contract = new Contract(market_contract_address);
    await restoreContract(sourceKeypair, market_contract);
}
main();