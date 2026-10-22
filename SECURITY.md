# Security Review

This document records the security issues found in this repository and what
was changed to fix them. It is not a substitute for an independent audit.

Date: 2026-10-22

## Executive summary

The most serious issue was in the example account contract: authorization was
completely disabled (`__check_auth` returned `Ok(())`). Any caller could act as
that account without a signature.

The second critical issue was that real Stellar secret seeds and secp256k1
private keys were committed in multiple `config.js` files. Those keys include
the cross-chain validator keys, so anyone with the repository could sign
bridge messages and drain the associated accounts.

The bridge entry point also accepted arbitrary inbound payloads without
verifying the proof, the destination network, the source peer, or replay.

All of these are fixed in the working tree, but **the committed keys must be
treated as compromised and rotated**.

## Findings

### 1. CRITICAL - Account contract accepted any authorization

- Location: `account/src/lib.rs`
- Issue: `__check_auth` returned `Ok(())` and `authenticate` was a no-op.
- Impact: anyone could authorize calls on behalf of the account contract,
  including token transfers from the account and changing its spend limits.
  No signature was required.
- Fix: implemented ed25519 signature verification, signer membership checks,
  strict signature ordering (rejects duplicates), a minimum of one signature,
  and the per-token spend policy. `add_limit` now actually persists the limit.
  The policy also fails closed: a subset of signers can only spend tokens with
  an explicit limit; without a limit, every signer must sign.
- Regression tests: `test_rejects_missing_signatures`,
  `test_rejects_unknown_signer`, `test_cannot_reinitialize`.

### 2. CRITICAL - Secret keys committed to the repository

- Locations:
  - `soroban_test/config.js`
  - `soroban_dev/config.js`
  - `contracts_soroban/dev_script/config.js`
  - `study_sdk/config.js`
  - `study_sdk/account_dev_test/config.js`
  - `study_sdk/dev_test/2_events_increment.js`
- Issue: Stellar secret seeds (`S...`) and secp256k1 private keys were stored in
  plain text. The secp256k1 keys are used by the bridge validators.
- Impact: an attacker could take over the accounts and forge valid bridge
  messages (up to the threshold) without exploiting any contract bug.
- Fix: secrets were removed. Configs now read them from environment variables
  or from an untracked `config.local.js` (see `config.example.js` in each
  directory). Missing secrets fail with a clear error instead of silently
  falling back to a committed key. `.gitignore` now excludes local secret files.
- Required action: **rotate every key that was ever committed**. Removing them
  from the working tree does not undo the leak. Also purge them from the Git
  history before publishing the repository.

### 3. HIGH - Bridge accepted unauthenticated inbound messages

- Location: `contracts_soroban/contracts/message_bridge/src/contract.rs`
- Issue: `inbound_bytes` decoded an arbitrary XDR payload and emitted it as an
  event. It did not check initialization, the network id, the proof, the
  source peer, or replay.
- Impact: anyone could emit a fake `inbound_bytes` event. Any off-chain
  relayer, indexer, or contract that trusts these events could be tricked into
  releasing NFTs or funds.
- Fix: `inbound_bytes` now fails closed and:
  - requires an initialized bridge and a configured verifier;
  - checks the destination network id against the stored chain id;
  - calls the configured verifier and requires it to return exactly the
    payload it verified;
  - validates the destination network inside the payload;
  - validates the source chain id and source contract against a configured
    peer;
  - rejects empty task ids and already-executed task ids (replay protection);
  - marks the task executed before emitting the event.
- `inbound_call` is kept as an alias for the existing scripts.

### 4. HIGH - Threshold verification could be bypassed or truncated

- Location:
  - `contracts_soroban/contracts/message_bridge/src/cross_chain_verifier.rs`
  - `contracts_soroban/contracts/message_bridge/src/contract.rs`
- Issue: a threshold of `0` was accepted, so a payload with zero signatures
  could pass. Separately, `threshold as u32` truncated large thresholds.
- Fix: initialization requires `0 < threshold <= owner_count`; the verifier
  rejects a zero threshold and compares in `u128` instead of casting to `u32`.

### 5. HIGH - Initialization front-running

- Locations:
  - `contracts_soroban/contracts/nft/src/contract.rs`
  - `contracts_soroban/contracts/message_bridge/src/contract.rs`
  - `account/src/lib.rs`
- Issue: `initialize`/`init` is a normal contract call. If deployment and
  initialization are separate transactions, an attacker can call `initialize`
  first and become the admin (NFT/bridge) or install their own signers
  (account).
- Mitigation applied:
  - initialization can only run once (guards);
  - the NFT initializer requires the `admin` to authorize the call;
  - the bridge initializer requires the `admin` to authorize the call;
  - the account initializer rejects re-initialization, empty signer sets, and
    duplicate signers.
- **Residual risk:** requiring the supplied admin's authorization does not
  prevent an attacker from initializing with *themselves* as admin. Soroban
  SDK 21 has no constructor and no deployer-address API. Deployment and
  initialization MUST therefore be atomic, for example through a factory
  contract that deploys and calls `initialize` in the same invocation, or by
  moving to SDK 22+ and using `__constructor`. Do not deploy this code with a
  separate "deploy, then initialize" transaction.

### 6. MEDIUM - Removing a validator did not actually remove the key

- Location: `contracts_soroban/contracts/message_bridge/src/Secp256k1Pubkey.rs`
- Issue: when deleting a non-last validator, the last entry was copied into the
  deleted slot but never removed, and the count was not decremented.
- Impact: a compromised validator key could remain valid after an attempted
  rotation.
- Fix: the last entry is copied, the last slot is removed, and the count is
  decremented. The same bug was fixed in
  `contracts_soroban/contracts/nft_market/src/order_count.rs`.

### 7. MEDIUM - Invalid "zero address" sentinel

- Location: `contracts_soroban/contracts/nft/src/owner.rs`
- Issue: `Address::from_string_bytes(&[0u8; 32])` is not a valid StrKey account
  and can trap. `owner()` for a non-existent token, and therefore
  `check_owner`, could fail unexpectedly.
- Fix: use the canonical null account
  `GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF`.

### 8. MEDIUM - Centralized burn and admin powers

- Location: `contracts_soroban/contracts/nft/src/contract.rs`
- Issue: `burn` is admin-only and can burn any token; `set_admin` can transfer
  control unilaterally.
- Impact: a compromised admin key can destroy user assets.
- Recommendation: require owner authorization for burns, or use a
  timelocked/multisig admin. This is a design decision and was not changed.

### 9. MEDIUM - All NFT state is stored in instance storage

- Location: `contracts_soroban/contracts/nft/src/{owner,balance,approval}.rs`
- Issue: owners, balances, and approvals use `env.storage().instance()`. The
  instance footprint is loaded for every invocation and grows with the number
  of holders/tokens. TTL expiry can also make the contract unavailable.
- Recommendation: move per-token/per-holder data to persistent storage and
  extend TTLs. This is a behavioral refactor and was not performed.

### 10. LOW - Signed transaction envelopes are logged

- Location: `soroban_test/common.js` and many test scripts
- Issue: scripts print the base64 XDR of already-signed transactions.
- Impact: low (the envelope is short-lived and performs the intended action),
  but it should not be copied into shared logs or issue reports.
- Recommendation: remove the `Signed prepared transaction XDR` logging.

### 11. LOW - Unauthenticated TTL extension

- Location: `contracts_soroban/contracts/nft_market/src/contract.rs`
- Issue: `extend_ttl_for_storage_instance` can be called by anyone.
- Impact: the caller pays the fee and can only extend the contract's own TTL,
  so there is no direct theft. It can still be used to alter operational costs.
- Recommendation: restrict to the admin if the contract is production-facing.

### 12. LOW - Stale dependencies and missing lock files

- Issue: the contracts use `soroban-sdk` 21.x while 29.x is available;
  `@stellar/stellar-sdk` is pinned to 12.x. Lock files were ignored.
- Fix applied: `Cargo.lock` is now committed. `soroban-env-host` 21.x accepts
  `ed25519-dalek >=2.0.0` but is incompatible with 3.x, so the lock pins 2.2.0;
  without the lock, tests fail to compile on current toolchains.
- Recommendation: run `npm audit` in each JS package, upgrade dependencies, and
  commit the npm lock files.

### 13. INFO - The bridge and market contracts are incomplete / mismatched

- The Rust bridge exposes `inbound_bytes` and a `sha256`-based verifier, while
  the newer scripts call `inbound_call` with a different XDR schema and
  `keccak256`. The market contract is mostly a stub.
- Impact: this is primarily a correctness/interoperability problem, not an
  exploitable vulnerability in the current code. However, the two sides must
  agree on the exact signed bytes and schema before deployment.
- Recommendation: define a single canonical message schema and hash function
  (EVM-compatible bridges normally use `keccak256`), add cross-language test
  vectors, and remove the unused/stub entry points.

## Deployment checklist

1. Rotate every Stellar and secp256k1 key that appeared in this repository.
2. Purge secrets from Git history (for example with `git filter-repo`) before
   making the repository public.
3. Deploy and initialize atomically (factory contract or single transaction),
   or migrate to SDK 22+ constructors.
4. Configure the verifier and the peer chain/contract immediately after
   initialization; inbound messages fail closed until both are set.
5. Use a threshold greater than one and keep validator keys in separate
   HSMs/secure signers.
6. Keep the bridge admin in a cold wallet or multisig.
7. Run an independent security audit and add fuzz/invariant tests for the
   message parser and signature verification.
8. Monitor `inbound_bytes` events and reject unexpected source chains or
   contracts off-chain as defense in depth.

## Verification

- `account`: `cargo test` -> 4 tests pass, including the new authorization
  regression tests.
- `contracts_soroban`: `cargo check --workspace` -> clean.
- `contracts_soroban`: `cargo test --workspace` -> message bridge XDR round-trip
  test passes.
- JS configs: all load; secret getters throw a clear error when no environment
  variable or `config.local.js` is present.
