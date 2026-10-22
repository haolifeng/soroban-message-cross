let robt_address = "0xde1abacb89265b165e32076ce23bc879d1168eba";

const ethers = require("ethers");

let url = "https://polygon-amoy.blockpi.network/v1/rpc/public"

let provider = new ethers.providers.JsonRpcProvider(url);

const getbalane = async ()=>{
    let balance = await provider.getBalance(robt_address);
    console.log(robt_address, " balance is: ", balance.toString())
}

const get_tx = async()=>{
    let ret = await provider.getTransaction("0xd5aa99f0b0cd8faf171c25f7e2785229e8775afeba7ea1ce5a2e89ae42db2f08");
    console.log('ret: ', ret);
}
//get_tx();
getbalane();