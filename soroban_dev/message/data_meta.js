let config = require('../config');
let meta_data = {
    stellar:{
        chainId: 90001,
        scAddr: config.scAddr.nft_market // nft_market地址
    },

    evm:{
        chainId: 80001,   //假的
        scAddr:'BB4E992daA6a51872C15Bf9db8f072624b91D37B'   // 这是一个假的，占位
    },
    messageType:{
        OrderSuccess:"OrderSuccess",
        UnlockNFT:"UnlockNFT",
        CancelOrder:"CancelOrder",
    },
    wmbReceive:"wmbReceive"
};
module.exports = meta_data;
