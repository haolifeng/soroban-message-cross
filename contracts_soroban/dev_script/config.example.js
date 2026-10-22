// Copy this file to config.local.js (git-ignored) and fill in your own
// credentials. You can also export the equivalent environment variables:
//   STELLAR_ADMIN_SECRET, STELLAR_USER1_SECRET, STELLAR_USER2_SECRET
//
// Never commit real secrets, and never reuse production keys here.
module.exports = {
    adminKeyPair: { secret: "S..." },
    user1KeyPair: { secret: "S..." },
    user2KeyPair: { secret: "S..." }
};
