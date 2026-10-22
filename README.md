# soroban-message-cross

[English](README.md) | [简体中文](README.zh-CN.md)

Cross-chain message bridge and NFT experiments on Stellar Soroban.

> [!WARNING]
> This code is experimental and has not been independently audited. Read
> [SECURITY.md](SECURITY.md) before deploying anything.
>
> Every Stellar secret seed and secp256k1 private key that was ever committed
> to this repository must be considered **compromised**. Rotate them and purge
> them from the Git history, even if they were only used on testnet.

## Contents

| Path | Description |
| --- | --- |
| `contracts_soroban/` | Rust workspace: `message_bridge`, `nft`, `nft_market`, and their interface crates |
| `account/` | Custom multi-signature account contract (`CustomAccountInterface`) with per-token spend limits |
| `soroban_test/` | End-to-end scripts for the NFT, market, and bridge contracts, plus Polygon helpers |
| `soroban_dev/` | Minimal deployment and invocation scripts |
| `study_sdk/` | Stellar SDK experiments, including account-contract usage |
| `SECURITY.md` | Security review, fixed vulnerabilities, residual risks, deployment checklist |

## How it works

### Bridge

1. Off-chain validators sign an XDR-encoded `EncodeInfo` payload.
2. A relayer calls `inbound_bytes(network_id, encoded_info, encoded_proof)`.
3. The bridge:
   - requires one-time initialization and a configured verifier;
   - checks that `network_id` matches its stored chain id;
   - calls the verifier, which recovers the secp256k1 public keys, enforces the
     signature threshold, and rejects unknown or duplicated signers;
   - requires the verifier to return exactly the bytes it verified;
   - decodes `EncodeInfo` and checks the destination network;
   - checks the source chain id and source contract against the configured peer;
   - rejects empty task ids and replayed task ids;
   - marks the task as executed before emitting the `inbound_bytes` event.
4. Off-chain services consume the event and release the NFT or funds.

`inbound_bytes` **fails closed**: until `set_verifier` and `set_peer` have been
called, all inbound messages are rejected. `inbound_call` is kept as a
backwards-compatible alias.

The verifier is a separate contract configured with `set_verifier`; it must
implement `decode_and_verify(network_id, encoded_info, encoded_proof)`. The
threshold-recovery helpers used by this repository live in
`contracts/message_bridge/src/cross_chain_verifier.rs`.

> The Rust bridge hashes with SHA-256 and uses the `EncodeInfo` XDR schema,
> while some newer scripts build a different payload with `keccak256`. Unify
> the schema and hash function before any real deployment (see
> [SECURITY.md](SECURITY.md), finding 13).

### Account contract

`account/` implements a smart account with ed25519 signers and a per-token
spend policy:

- `init(signers)` sets the signer set once; empty or duplicated signer sets are
  rejected.
- `add_limit(token, limit)` stores a spend limit for a token.
- `__check_auth` requires at least one valid signature, rejects unknown and
  duplicated signers, and enforces the spend policy:
  - a transfer signed by only a subset of signers is allowed only when the
    token has an explicit limit;
  - without a limit, every signer must sign.

### NFT

The `nft` contract supports `initialize`, `admin`, `set_admin`, `name`,
`symbol`, `token_uri`, `approve`, `approve_all`, `get_approve`, `is_approve`,
`balance`, `owner`, `transfer`, `transfer_from`, `mint`, and `burn`.

## Requirements

- Rust (stable) with the `wasm32-unknown-unknown` target
- Stellar CLI (`stellar` / `soroban`) for building and deploying contracts
- Node.js 18+ and npm for the scripts

## Build and test

Contracts workspace:

```bash
cd contracts_soroban
cargo check --workspace
cargo test --workspace
cargo build --target wasm32-unknown-unknown --release
```

Account contract:

```bash
cd account
cargo test
cargo build --target wasm32-unknown-unknown --release
```

You can also build a single contract with `stellar contract build` inside its
directory.

## Configuration

No secrets are stored in the repository. Each JavaScript directory contains a
`config.example.js`; copy it to `config.local.js` (git-ignored) or export the
environment variables.

```bash
cd soroban_test
cp config.example.js config.local.js
```

Recognized environment variables:

| Variable | Purpose |
| --- | --- |
| `STELLAR_USER1_SECRET` ... `STELLAR_USER3_SECRET` | Stellar account secret seeds |
| `SECP256K1_USER1_PRIVKEY` ... `SECP256K1_USER5_PRIVKEY` | Bridge validator private keys |

`config.js` keeps only public keys, endpoints, and the testnet contract ids in
`scAddr`. Update `scAddr` after deploying your own contracts.

**Never commit `config.local.js`, `.env`, or any key material.**

## Running the scripts

```bash
cd soroban_test
npm install
cp config.example.js config.local.js   # then fill it in
node nft/1_init.js
```

Scripts are numbered in execution order:

- `soroban_test/nft/` - deploy/initialize, metadata, mint, transfer, burn
- `soroban_test/market/` - market initialization, orders, proofs, inbound calls
- `soroban_test/message/` - bridge initialization, owners, threshold, peer, admin
- `soroban_test/polygon/` - Polygon balance helper
- `soroban_dev/` and `study_sdk/` - smaller standalone examples

The scripts print signed transaction envelopes for debugging. Do not paste
those logs into issues or shared channels.

## Deployment checklist

1. Rotate every key that appeared in this repository and purge it from Git
   history.
2. Deploy and initialize atomically (factory contract or a single transaction);
   a separate "deploy, then initialize" transaction can be front-run. Soroban
   SDK 21 has no constructor, so a factory is the practical option.
3. Set the verifier and the peer immediately after initialization; inbound
   messages fail closed until both exist.
4. Use a threshold greater than one and keep validator keys in separate secure
   signers.
5. Keep the bridge admin in a cold wallet or multisig.
6. Run an independent audit and add fuzz/invariant tests for the message parser
   and signature verification.

See [SECURITY.md](SECURITY.md) for the full list.

## License

Apache License 2.0, see [LICENSE](LICENSE).
