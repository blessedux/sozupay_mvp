# Soroban Disbursement Wallet Contract

Contract at `contracts/disbursement_wallet/`: holds a token (e.g. USDC) and allows authorized signers to disburse to recipients.

## ABI (for backend invocation)

- **initialize**(env, token: Address, signers: Vec<Address>) — one-time setup: token contract address and list of authorized signer addresses (e.g. super-admin public keys as Address).
- **payout**(env, caller: Address, recipient: Address, amount: i128) — transfer `amount` to `recipient`. The transaction must be signed by `caller` (require_auth), and `caller` must be in the stored signers list. Backend builds the invoke with source account = admin key and passes admin address as `caller`.
- **add_signer**(env, caller: Address, new_signer: Address) — add an authorized signer; `caller` must be existing signer and sign the tx.
- **token**(env) → Address — return the token contract address.
- **is_signer**(env, address: Address) → bool — return whether the address is an authorized signer.

## Build and deploy (testnet)

```bash
# From repo root
cd contracts/disbursement_wallet
cargo build --target wasm32-unknown-unknown --release
# Optimized WASM is in target/wasm32-unknown-unknown/release/disbursement_wallet.wasm

# Deploy with Soroban CLI (install: https://soroban.stellar.org/docs/getting-started/setup)
# soroban contract deploy --wasm target/wasm32-unknown-unknown/release/disbursement_wallet.wasm --source <admin-key> --network testnet
# Then initialize( token_address, [admin_address] ) so the deployer is the first signer.
```

## Address format

- Contract address: **C...** (Soroban contract ID).
- Token: Stellar Asset Contract address for USDC (testnet/mainnet issuer).
- Signers: Stellar account addresses **Address** (G... as Address or C...).

## Backend usage

When org has `soroban_contract_id` set, the payouts route builds a Soroban invocation: `payout(caller: admin_address, recipient: destination_address, amount)`. The transaction source (and signer) is the super-admin’s key (unlocked). The contract checks `caller.require_auth()` and that `caller` is in signers, then transfers token from the contract to `recipient`.
