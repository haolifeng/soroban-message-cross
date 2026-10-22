// Secrets are NEVER stored in this file. Provide them via environment
// variables or an untracked config.local.js file (see config.example.js).
//
// The keys that were previously committed here must be considered
// compromised and rotated, even if they were only used on testnet.
let local = {};
try {
    local = require('./config.local.js');
} catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND' || !/config\.local\.js/.test(err.message)) {
        throw err;
    }
}

function secretFromEnv(envName, localValue) {
    const value = process.env[envName] || localValue;
    if (!value) {
        throw new Error(
            `Missing secret ${envName}. Export it or create config.local.js ` +
                `in this directory (see config.example.js). ` +
                `Refusing to use a hard-coded key.`
        );
    }
    return value;
}

let config = {
    user1:{
        PublicKey:"GDDCPCUQVR3SOCQO24FDLG3OQKT3DZRBFTQB7CS7ZP2PN4RUG6EKXODP",
        get secret() {
            return secretFromEnv("STELLAR_USER1_SECRET", local.user1 && local.user1.secret);
        }
    },
    user2: {
        PublicKey: 	"GAZ7L2FXGOK5QZS3S2ZJUJMIEMFIZH4ZBDIZY6LEFHZ3HDEFCE6NBKQK",
        get secret() {
            return secretFromEnv("STELLAR_USER2_SECRET", local.user2 && local.user2.secret);
        }
    },
    user3: {
        PublicKey:  "GDH2EJSEBJNTIDYACUSZ3GIAQOTIMPZFXDR64S43FABLA2NOVJSA33H4",
        get secret() {
            return secretFromEnv("STELLAR_USER3_SECRET", local.user3 && local.user3.secret);
        }
    },
    horizon_testUrl:"https://horizon-testnet.stellar.org/",
    soroban_testUrl:"https://soroban-testnet.stellar.org:443",
    scAddr: {
        /*old
        nft:"CAK3YU4RRTL6BFHK6ES5N7346OVKZGTVO4XNPKVBWQMS4UT6NPXL4IEH",

        nft_market:"CC6ERILNZ6NA44A6YVBZLJPB7BA3335MKYSNJZOAPUOXATK6Z4746SHC",

        message_bridge:"CAKSFWYLRLODMAZWRSOR4BWOM6V5IY2ZTHVSHD7BGULNDM65ROY65UTM",
        */
        /* new*/
        nft:"CCFZO74QWNAHBAH4N7RW4YQWQZUPRZ7LFGJE63KVQTLPNRDIMCFW2ZXL",

        nft_market:"CD4M7URGNOKO5V5CDBLSBJKUJUW5XBXEG2E5OQU3C325FSIMJZMM7UFQ",

        message_bridge:"CB6IPBQO27IMYHQNDONI7XKHVM6CJ7LIVW4RY65ULFGD5AIT6CTSTRRV",


    },
    cur_nft_id:500111,
    secp256k1:{
        user1:{
            pubKey: [
                4, 166,  17, 110,  93, 128, 128,  83, 169,  72, 244,
                250, 172,  27, 134,   4, 157,   4, 131, 178,  34, 246,
                247, 214,  38, 157,  31, 191, 219,  59,  30, 108,  63,
                130, 208, 192, 188, 133, 114,  29, 102, 217, 216,  39,
                77, 108, 136, 122,  69, 164,  63,  64,  65, 108,  61,
                108, 150, 113,  71,  89,  58, 186, 132, 171,   4
            ],
            get privKey() {
                return secretFromEnv(
                    "SECP256K1_USER1_PRIVKEY",
                    local.secp256k1 && local.secp256k1.user1 && local.secp256k1.user1.privKey
                );
            }
        },
        user2:{
            pubKey:[
                4,  97, 241, 240,  68,  40, 184, 162, 123, 147,  41,
                229,  71,   3, 155, 253,  59, 122,  99,   6,  61,  43,
                64, 209,  54,   5, 239, 155,  14,  15, 191,  81, 153,
                15, 239, 117, 246, 247,   5, 248,  12, 168,   0, 103,
                200, 143, 150,  88, 208,  87, 232, 205, 106,  90, 152,
                108, 103, 205,   5,  67,  38,  72, 249, 118,  16
            ],
            get privKey() {
                return secretFromEnv(
                    "SECP256K1_USER2_PRIVKEY",
                    local.secp256k1 && local.secp256k1.user2 && local.secp256k1.user2.privKey
                );
            }
        },
        user3:{
            pubKey:[
                4,  16,  91, 137,  20, 139, 241, 189, 252, 101, 104,
                177, 128, 146,  11,  19, 223, 170, 210,  49, 171, 153,
                157,  10, 228,  14,  64,  74, 184, 242, 169, 244, 114,
                153, 230, 236, 108, 139, 210, 198, 222,  63, 108, 119,
                43, 153, 131, 152, 102,  94,  64, 192, 217,   8, 115,
                136,  97, 203,  56, 150, 210, 107, 176,  64, 190
            ],
            get privKey() {
                return secretFromEnv(
                    "SECP256K1_USER3_PRIVKEY",
                    local.secp256k1 && local.secp256k1.user3 && local.secp256k1.user3.privKey
                );
            }
        },
        user4:{
            pubKey:[
                4, 202,  89,  49,  84, 221,  54,   9, 176,  20,  55,
                23,  91, 233,  10,  90, 218, 129, 186,  58, 221, 188,
                129, 145, 110,  18,  95, 194,  86, 128, 249,  12,  75,
                102,  41, 220, 208,  61,   5, 122, 144, 133,  37,  57,
                67,  56,   1, 196, 176, 221, 154,  24,  43, 119, 137,
                127, 152, 182,  20,   6,  81,  74,  85, 245, 124
            ],
            get privKey() {
                return secretFromEnv(
                    "SECP256K1_USER4_PRIVKEY",
                    local.secp256k1 && local.secp256k1.user4 && local.secp256k1.user4.privKey
                );
            }
        },
        user5:{
            pubKey: [
                4, 162,  59,  62,  11,  98, 215, 195, 161,  20,  34,
                184, 187,  41,  58, 232, 253,   2,  57, 194,  82, 115,
                25,   1, 203, 116, 237, 213, 165, 167, 132, 245,  81,
                118, 133,  20,  39,  11,  70,  76, 231, 142, 237,  23,
                148,  19,  81,  71, 204,   2, 164, 204, 198,   4, 104,
                252, 125,  52,  53, 167, 205, 242,  66, 203,  54
            ],
            get privKey() {
                return secretFromEnv(
                    "SECP256K1_USER5_PRIVKEY",
                    local.secp256k1 && local.secp256k1.user5 && local.secp256k1.user5.privKey
                );
            }
        }

    },
    testPubKey : [
        "0421b1bf4c5b958d8158862f263b192555b0e1dae5d39a636b61229d91540cd985d55cd3bf01555e1279ae6332eb3955607a883b8e8a433b4095b499c1e25805d8",
        "048a41dc3fa60b5dfd51e48bb2dd1cfb9147ce1ff714ec63c087ad918a97ce899106dd6e07702c0dada75942511b8a85713b1a7d19ce1b6829237e45af9239c7c3",
        "0469b7ee76b47c183a2d5e037ae72c8d24aa3c6d7d947ed382a096eb0436dd35c6ca4dae84d40295b6b016547a8e68ce2bb5db1b7340c90ec1ac14b3b4434b450d",
        "0458df19eb21ef1094b13427b22a1e004938f2403c49c52afdfd40652d3d5a42b76eced960de50b7296e36ef18299a374c0d2ba456f6c2fad8c1b341ff0d47b6a5",
        "042a68dd4fe1ee12ceb4acb7b5e4e529ec360afcec874f9cf4e29525d315fd13b1b45128a0b0dfd5654a3eb2eead6adef5978ed4325ae184aeefef66f26346dffc",
        "042702bb39a300cc1578fcedd95ca10416cbee7abc813dd8b0487634f5841a05761886548252172710a8ef6862b2a2835d5f1737fe076ebde3a1bfd502345a944b",
        "045df940bf466334b6d2f6e903dc5ff195ae850fc2aba344b2b4ac5bb07f375f88688610108c6b8cba6b1c20faef3350df5b47e16a3f5c055a631522b557467772"
    ]
}
module.exports = config;
