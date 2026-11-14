# NEAR contract scaffold

This contract is an initial testnet inventory-ledger scaffold, not a production marketplace.

## Build

Install the Rust target and NEAR CLI/build tooling, then compile the library to Wasm using your chosen NEAR build workflow. Pin the exact near-sdk and toolchain versions before deployment.

## Methods

- `new()`: initialize; caller becomes contract owner.
- `register_merchant()`: register the caller.
- `deposit_treasury()`: attach native NEAR to the caller's merchant treasury.
- `owner_set_inventory(merchant_id, item_id, amount)`: owner seeds demo inventory.
- `transfer_item(seller_id, buyer_id, item_id, amount)`: authorized ledger transfer.
- `get_merchant(account_id)` / `get_inventory(account_id, item_id)`: read state.

## Safety notes

- Inventory units are internal ledger entries, not NEP-245 tokens.
- The current transfer method does not settle a price or transfer NEAR/FTs between buyer and seller.
- The owner can seed inventory. This is suitable only for a controlled testnet prototype.
- Do not deploy to mainnet or represent this scaffold as an audited marketplace.
