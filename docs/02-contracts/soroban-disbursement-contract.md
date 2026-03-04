# Soroban Disbursement Wallet Contract

Contract at `contracts/disbursement_wallet/`: holds a token (e.g. USDC) and allows authorized signers to disburse to recipients.

## ABI (for backend invocation)

- **initialize**(env, token: Address, signers: Vec<Address>) — one-time setup: token contract address and list of authorized signer addresses (e.g. super-admin public keys as Address).
- **payout**(env, caller: Address, recipient: Address, amount: i128) — transfer `amount` to `recipient`. The transaction must be signed by `caller` (require_auth), and `caller` must be in the stored signers list. Backend builds the invoke with source account = admin key and passes admin address as `caller`.
- **add_signer**(env, caller: Address, new_signer: Address) — add an authorized signer; `caller` must be existing signer and sign the tx.
- **token**(env) → Address — return the token contract address.
- **is_signer**(env, address: Address) → bool — return whether the address is an authorized signer.

## Build and deploy (testnet)

### Prerequisites

- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup) installed.
- A keypair with testnet XLM (e.g. create with Stellar Laboratory and fund via [Friendbot](https://laboratory.stellar.org/#explorer?resource=friendbot&endpoint=create)). Set as `--source` or in your default identity.
- **USDC token contract address (testnet):** The disbursement wallet needs the Soroban contract ID for USDC. On testnet this is the Stellar Asset Contract (SAC) for USDC (issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`). Resolve it via Stellar docs or deploy/wrap the asset; then record it in [testnet-contracts.md](./testnet-contracts.md).

### 1. Build the WASM

```bash
# From repo root
cd contracts/disbursement_wallet
cargo build --target wasm32-unknown-unknown --release
```

Output: `target/wasm32-unknown-unknown/release/disbursement_wallet.wasm`

### 2. Deploy the contract

```bash
# Replace <ADMIN_KEY_NAME> with your Soroban identity (e.g. default or a named key)
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/disbursement_wallet.wasm \
  --source <ADMIN_KEY_NAME> \
  --network testnet
```

Copy the returned **contract ID** (starts with `C...`). Record it in [testnet-contracts.md](./testnet-contracts.md) and (for the org) in the database as `soroban_contract_id`.

### 3. Initialize the contract

You must call `initialize(token_address, signers)` once. The deployer (admin) should be the first signer.

```bash
# Set variables (replace with your values)
CONTRACT_ID=<CONTRACT_ID_FROM_STEP_2>
USDC_TOKEN_ADDRESS=<SOROBAN_USDC_TOKEN_CONTRACT_ID>
ADMIN_ADDRESS=<YOUR_G_PUBLIC_KEY_OR_ADDRESS>

# Invoke initialize(token, signers)
# Signers is a vec of one address: the admin. Use Soroban CLI's format for Address and Vec.
soroban contract invoke \
  --id $CONTRACT_ID \
  --source <ADMIN_KEY_NAME> \
  --network testnet \
  -- \
  initialize \
  --token "$USDC_TOKEN_ADDRESS" \
  --signers "[$ADMIN_ADDRESS]"
```

(Exact CLI syntax for `--signers` may vary by Soroban CLI version; use `soroban contract invoke --help` and the contract’s ABI. Alternative: use a small script or the Stellar Laboratory to encode and submit the `initialize` invocation.)

### 4. Fund the contract with USDC

Transfer test USDC from your admin account to the **contract ID** (the contract holds the token balance). Use Stellar Laboratory (classic transfer to the contract’s address if it accepts, or use a Soroban token transfer). The contract must hold a positive USDC balance before `payout` can succeed.

### 5. Set the contract on the organization

In your database, set the organization’s `soroban_contract_id` to the contract ID from step 2. The dashboard payouts flow will then use this contract when the org is selected and the super-admin (or authorized signer) unlocks their key.

## Address format

- Contract address: **C...** (Soroban contract ID).
- Token: Stellar Asset Contract address for USDC (testnet/mainnet issuer).
- Signers: Stellar account addresses **Address** (G... as Address or C...).

## Backend usage

When org has `soroban_contract_id` set, the payouts route builds a Soroban invocation: `payout(caller: admin_address, recipient: destination_address, amount)`. The transaction source (and signer) is the super-admin’s key (unlocked). The contract checks `caller.require_auth()` and that `caller` is in signers, then transfers token from the contract to `recipient`.
