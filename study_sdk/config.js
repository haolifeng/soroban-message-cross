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
    adminKeyPair:{
        publicKey:  'GDZPMKDOT4QUN5OZEQMOEKDUQ7HZ6RAI7ONFZZGQBSZZIBTCVRK63KHX',
        get secret() {
            return secretFromEnv(
                "STELLAR_ADMIN_SECRET",
                local.adminKeyPair && local.adminKeyPair.secret
            );
        }
    },
    user1KeyPair:{
        publicKey:  'GAM45Y67SWGTUHC6TPGSEGXC2WMQZ6MZHJWHWC54RWTFJXTM5YVJO5R7',
        get secret() {
            return secretFromEnv(
                "STELLAR_USER1_SECRET",
                local.user1KeyPair && local.user1KeyPair.secret
            );
        }
    },
    horizon_testUrl:"https://horizon-testnet.stellar.org/",
    soroban_testUrl:"https://soroban-testnet.stellar.org:443",
    msgCrossScAddr:'CCW5HZP25WFNBPSV7HPFYLFU5XOUAIKFV3LJ6N7YOEKFRXVN7KW3JZTN',
}
module.exports = config;
