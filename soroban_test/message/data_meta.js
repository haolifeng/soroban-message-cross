let config = require('../config');
let meta_data = {
    stellar:{
        chainId: 2147483796,
        scAddr: config.scAddr.nft_market // nft_market地址
    },

    evm:{
        chainId: 2147484614,   //matic
        scAddr:'77ad6b15a224FeeB5805C4b9E3Af9948b8B907C1'   // NftMarket address: 0x77ad6b15a224FeeB5805C4b9E3Af9948b8B907C1
    },
    messageType:{
        OrderSuccess:"OrderSuccess",
        UnlockNFT:"UnlockNFT",
        CancelOrder:"CancelOrder",
    },
    wmbReceive:"wmbReceive"
};
module.exports = meta_data;
