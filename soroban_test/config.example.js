// Copy this file to config.local.js (git-ignored) and fill in your own
// credentials. You can also export the equivalent environment variables:
//   STELLAR_USER1_SECRET, STELLAR_USER2_SECRET, STELLAR_USER3_SECRET,
//   SECP256K1_USER1_PRIVKEY ... SECP256K1_USER5_PRIVKEY
//
// Never commit real secrets, and never reuse production keys here.
module.exports = {
    user1: { secret: "S..." },
    user2: { secret: "S..." },
    user3: { secret: "S..." },
    secp256k1: {
        user1: { privKey: "..." },
        user2: { privKey: "..." },
        user3: { privKey: "..." },
        user4: { privKey: "..." },
        user5: { privKey: "..." }
    }
};
