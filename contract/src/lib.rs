use near_sdk::{env, near, AccountId, PanicOnDefault};
use near_sdk::collections::LookupMap;
use near_sdk::json_types::U128;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};

#[derive(BorshDeserialize, BorshSerialize)]
#[borsh(crate = "near_sdk::borsh")]
pub struct Merchant {
    pub owner: AccountId,
    pub treasury: u128,
    pub inventory: LookupMap<String, u64>,
    pub active: bool,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct MerchantView {
    pub owner: AccountId,
    pub treasury: U128,
    pub active: bool,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    owner: AccountId,
    merchants: LookupMap<AccountId, Merchant>,
}

#[near]
impl Contract {
    #[init]
    pub fn new() -> Self {
        Self { owner: env::predecessor_account_id(), merchants: LookupMap::new(b"m".to_vec()) }
    }

    /// Register a merchant account. The caller controls its merchant inventory.
    pub fn register_merchant(&mut self) {
        let account = env::predecessor_account_id();
        near_sdk::require!(!self.merchants.contains_key(&account), "Merchant already registered");
        self.merchants.insert(&account, &Merchant {
            owner: account.clone(), treasury: 0,
            inventory: LookupMap::new(format!("i:{}", account).as_bytes().to_vec()),
            active: true,
        });
    }

    /// Deposit native NEAR into the caller's merchant treasury.
    #[payable]
    pub fn deposit_treasury(&mut self) {
        let account = env::predecessor_account_id();
        let mut merchant = self.merchants.get(&account).expect("Register merchant first");
        merchant.treasury = merchant.treasury.checked_add(env::attached_deposit().as_yoctonear()).expect("Treasury overflow");
        self.merchants.insert(&account, &merchant);
    }

    /// Owner credits inventory units to a registered merchant for the testnet demo.
    pub fn owner_set_inventory(&mut self, merchant_id: AccountId, item_id: String, amount: u64) {
        self.assert_owner();
        let mut merchant = self.merchants.get(&merchant_id).expect("Unknown merchant");
        merchant.inventory.insert(&item_id, &amount);
        self.merchants.insert(&merchant_id, &merchant);
    }

    /// Transfer a listed item unit count between two registered merchant inventories.
    /// This is an inventory ledger operation, not an FT transfer.
    pub fn transfer_item(&mut self, seller_id: AccountId, buyer_id: AccountId, item_id: String, amount: u64) {
        near_sdk::require!(amount > 0, "Amount must be positive");
        let caller = env::predecessor_account_id();
        near_sdk::require!(caller == seller_id || caller == self.owner, "Seller or contract owner only");
        let mut seller = self.merchants.get(&seller_id).expect("Unknown seller");
        let mut buyer = self.merchants.get(&buyer_id).expect("Unknown buyer");
        let seller_amount = seller.inventory.get(&item_id).unwrap_or(0);
        near_sdk::require!(seller_amount >= amount, "Insufficient inventory");
        seller.inventory.insert(&item_id, &(seller_amount - amount));
        let buyer_amount = buyer.inventory.get(&item_id).unwrap_or(0);
        buyer.inventory.insert(&item_id, &buyer_amount.checked_add(amount).expect("Inventory overflow"));
        self.merchants.insert(&seller_id, &seller);
        self.merchants.insert(&buyer_id, &buyer);
    }

    pub fn get_merchant(&self, account_id: AccountId) -> Option<MerchantView> {
        self.merchants.get(&account_id).map(|m| MerchantView { owner: m.owner, treasury: U128(m.treasury), active: m.active })
    }

    pub fn get_inventory(&self, account_id: AccountId, item_id: String) -> u64 {
        self.merchants.get(&account_id).and_then(|m| m.inventory.get(&item_id)).unwrap_or(0)
    }

    fn assert_owner(&self) { near_sdk::require!(env::predecessor_account_id() == self.owner, "Owner only"); }
}
