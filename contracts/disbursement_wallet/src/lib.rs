//! Disbursement wallet: holds a token (e.g. USDC) and allows authorized signers
//! to call `payout(recipient, amount)`. The transaction signer (invoker) must
//! be in the authorized signers list; the contract then transfers token from
//! its own balance to the recipient.

#![no_std]

use soroban_sdk::{contract, contractimpl, token, Address, Env, Vec};

#[contract]
pub struct DisbursementWallet;

mod keys {
    use soroban_sdk::{symbol_short, Symbol};
    pub(crate) fn token_key() -> Symbol {
        symbol_short!("TOKEN")
    }
    pub(crate) fn signers_key() -> Symbol {
        symbol_short!("SIGNERS")
    }
}

#[contractimpl]
impl DisbursementWallet {
    /// Initialize the wallet with the token contract address and a list of
    /// authorized signer addresses (e.g. super-admin public keys as Address).
    /// Only the deployer needs to call this once.
    pub fn initialize(env: Env, token_addr: Address, signers: Vec<Address>) {
        env.storage().instance().set(&keys::token_key(), &token_addr);
        env.storage().instance().set(&keys::signers_key(), &signers);
    }

    /// Add an authorized signer. Callable only by an existing signer.
    /// `caller` must be in signers and must have signed the tx (require_auth).
    pub fn add_signer(env: Env, caller: Address, new_signer: Address) {
        caller.require_auth();
        let signers: Vec<Address> = env.storage().instance().get(&keys::signers_key()).unwrap();
        if !signers.contains(caller) {
            panic!("Unauthorized");
        }
        if signers.contains(new_signer.clone()) {
            panic!("Already signer");
        }
        let mut updated = signers;
        updated.push_back(new_signer);
        env.storage().instance().set(&keys::signers_key(), &updated);
    }

    /// Transfer `amount` of the wallet's token to `recipient`.
    /// `caller` must be in the authorized signers list and must have signed the tx (require_auth).
    pub fn payout(env: Env, caller: Address, recipient: Address, amount: i128) {
        caller.require_auth();
        let signers: Vec<Address> = env.storage().instance().get(&keys::signers_key()).unwrap();
        if !signers.contains(caller) {
            panic!("Unauthorized");
        }

        let token_addr: Address = env.storage().instance().get(&keys::token_key()).unwrap();
        let contract = env.current_contract_address();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&contract, &recipient, &amount);
    }

    /// Return the token address (for display / verification).
    pub fn token(env: Env) -> Address {
        env.storage().instance().get(&keys::token_key()).unwrap()
    }

    /// Return whether the given address is an authorized signer.
    pub fn is_signer(env: Env, address: Address) -> bool {
        let signers: Vec<Address> = env.storage().instance().get(&keys::signers_key()).unwrap();
        signers.contains(address)
    }
}
