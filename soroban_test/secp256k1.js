const { randomBytes , sha256} = require('crypto')
const secp256k1 = require('secp256k1')
const config = require('./config');
// generate message to sign
// message should have 32-byte length, if you have some other length you can hash message
// for example `msg = sha256(rawMessage)`
const msg = randomBytes(32);
console.log('msg: ', msg);

// generate privKey
let privKey
let count = 0;
do {
    privKey = randomBytes(32)
    console.log(count++);

} while (!secp256k1.privateKeyVerify(privKey))

console.log('privKey: ', privKey)
console.log('privKey_str: ', privKey.toString('hex'))

// get the public key in a compressed format
const pubKey = secp256k1.publicKeyCreate(privKey,false)
console.log('pubKey: ', pubKey);


// sign the message
//const sigObj = secp256k1.ecdsaSign(msg, privKey)
//console.log('sigObj: ', sigObj);

// verify the signature
//console.log(secp256k1.ecdsaVerify(sigObj.signature, msg, pubKey))

//console.log(secp256k1.ecdsaRecover(sigObj.signature,sigObj.recid,msg))

//let userPriv = new Buffer.from(config.user1.secret);
//console.log("userPriv", secp256k1.privateKeyVerify(userPriv));