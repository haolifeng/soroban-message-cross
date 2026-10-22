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
        nft:"CCSEGT2TNKLAKSCUF7TIUPQIJN7POLNGWPKMMVD2NPV234MH52Z4ROJW",
        nft_market:"CCMTL24EVBUVEF4V4HLRCTA7T6PWZT42YEQ4OHGL4CS3PQWTSDME7VE5",
        message_bridge:"CDPOXLEV4XBWU6WX5MGI4GFHLMB4ONXDAXLAL34C7DHS4YXPY5FZI7O6",
    },
    cur_nft_id:20005,
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
        }
    },

}
module.exports = config;
