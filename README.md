# NEAR Agent Bazaar

**A playable agent-driven game economy with three merchant policies and a shared, changing market.**

NEAR Agent Bazaar explores a simple question: what happens when a game-world market is run by merchants that make their own economic decisions instead of waiting for a developer to manually change every price?

The prototype gives players a small inventory and demo-credit balance. They can trade with Max, Luna and Rex, then advance the market to see how each merchant reacts to changes in supply and demand.

> **Current status:** the browser experience is a local simulation. The Rust contract is an un-deployed inventory-ledger scaffold. The app does not currently connect a NEAR wallet, call a deployed contract, or move real tokens. The merchant policies are rule-based, not LLM-powered.

## The problem

Many game economies rely on static shop inventories and developer-controlled price changes. That can make the world feel predictable and creates ongoing balancing work for game creators.

## What we built

A small playable economy in which:

- Players start with demo credits and a resource inventory.
- Three merchants have different goals, inventories and treasuries.
- Prices respond to supply and demand.
- Player trades change their balance, inventory, merchant treasury and market conditions.
- A market cycle lets each merchant evaluate the new market and act according to its policy.
- An activity feed explains the actions that happened.
- A first-visit guide explains the interface and can be replayed from **How to play**.

## Meet the merchants

| Merchant | Strategy | Typical behaviour |
| --- | --- | --- |
| Max — The Opportunist | Looks for attractive demand/supply imbalances. | Sells stock into stronger demand or buys resources when supply is tight. |
| Luna — The Collector | Protects a reserve of rare Aether Crystals. | Holds crystals, buys into a reserve when supply is low, or releases some at high demand. |
| Rex — The Industrialist | Focuses on construction materials. | Restocks scarce wood or iron and releases wood when builders need it. |

These are transparent rule-based policies. They do not call an LLM or act continuously in the background: they are evaluated when a market cycle runs, either manually or through the Auto control.

## Run it locally

Requirements: Node.js 24.12 or newer and npm. The regression tests use Node.js's built-in TypeScript support.

~~~bash
npm install
npm test
npm run build
npm run dev
~~~

Open the local URL printed by Vite, normally http://localhost:5173.

The build command runs TypeScript project compilation and creates the Vite production bundle in the dist directory.

## Judge walkthrough: do this, see this

The easiest way to evaluate the current prototype is to follow this short path:

1. **Open the app.** The Bazaar Field Guide appears on a first visit. Move through the six steps, or close it and use **How to play** to replay it later.
2. **Read the Market board.** Select Ancient Wood, Aether Crystal or Forged Iron. The row shows the simulated price, market supply, buyer demand and the player's owned quantity.
3. **Buy one resource.** In the Trade desk, select Max, keep quantity at 1, and choose **Buy from merchant**. The expected result is: player demo credits decrease, player inventory increases, Max's inventory decreases, Max's treasury increases, market supply decreases, demand increases, and a trade event appears.
4. **Sell one resource.** Select a resource already in the player's inventory, select a merchant, and choose **Sell to merchant**. The expected result is: player inventory decreases, demo credits increase by 88% of the displayed market-value total, merchant inventory increases, merchant treasury decreases, market supply increases, demand decreases, and a trade event appears.
5. **Run a market cycle.** Choose **Run next market cycle**. The cycle counter increases, the market receives a bounded random supply/demand movement, and the three merchant policies are evaluated. Agent actions appear in the activity feed when a policy chooses to act.
6. **Try Auto.** Turn Auto on to run another market cycle about every 6.5 seconds. Turn it off to stop the timer.

The initial player balance is 240 demo credits. The demo begins with 8 Ancient Wood, 2 Aether Crystals and 4 Forged Iron in the player's inventory. These are simulated starting values, not airdrops or on-chain balances.

## How to understand the numbers

- **CR (demo credits):** an in-browser play balance with no cash or token value.
- **Price / unit:** the current simulated quote for one resource.
- **Supply:** the market's available resource units in the simulation.
- **Demand:** a simulated buyer-interest indicator from 0% to 100%.
- **Owned:** the quantity in the player's local inventory.
- **Treasury:** a merchant's simulated credit reserve.
- **Trade volume:** the cumulative simulated value of player trades in this browser save.
- **Market cycle:** one update of background market conditions and merchant policies.

Buying from a merchant removes available market supply and increases demand. Selling to a merchant adds available market supply and reduces demand. The app stores its demo world in browser local storage; clearing site data resets the local demo.

## Technical implementation

### Frontend

- React 18, TypeScript and Vite.
- A small typed market engine in src/engine.ts.
- Browser local storage for the demo world.
- Responsive dashboard with market board, trade desk, merchant cards, activity feed and guided tour.
- GitHub Actions runs the frontend install and production build on pushes and pull requests to main.

### NEAR contract scaffold

The contract directory contains a Rust / near-sdk starting point for a merchant inventory ledger. It includes merchant registration, native NEAR treasury deposits, owner-seeded inventory, authorized inventory-ledger transfers and read methods.

The contract is not deployed by this repository and is not wired into the browser app. Its inventory entries are internal ledger records, not NEP-245 tokens. The transfer method does not settle a price or transfer NEAR / fungible tokens.

See [contract/README.md](contract/README.md) for the current contract scope and safety notes.

## NEAR relevance and current limitations

The project is aimed primarily at the **Agent Economy** idea: merchants have independent policies, treasuries and inventory, and they respond to a changing economy. It also explores the game-economy loop behind **Games With Real Economies**.

The current demo is deliberately honest about the gap between the concept and a real on-chain implementation:

- No NEAR wallet selector or account connection.
- No deployed contract address or browser-to-contract calls.
- No real NEAR or FT settlement.
- No LLM-powered agent reasoning, persistent agent memory or autonomous server runtime.
- No audited economic, custody or production security model.

The next meaningful NEAR milestone is not to label the simulation as on-chain. It is to deploy and test the contract on a controlled NEAR testnet account, add a wallet adapter and read-only contract state, then design and test secure signed trade settlement before representing any trade as real.

## Design, impact, originality and sustainability

- **Design:** the interface is built around a playable trade loop, plain-language labels, a first-visit guide, visible estimates and responsive navigation.
- **Impact potential:** the prototype is a small, inspectable sandbox for players and game developers exploring dynamic markets and merchant behaviour. No real-world impact has been measured yet.
- **Originality:** the market combines three merchants with different objectives, limited treasuries and inventory decisions in one shared supply/demand environment.
- **Sustainability:** the demo is lightweight and modular. Merchant policies can be extended separately from the UI, and the project is MIT-licensed. A sustainable live economy still requires a reviewed issuance, settlement, fee and abuse-prevention design.

## Repository map

- src/App.tsx — dashboard, trade interface, navigation and first-visit guide.
- src/engine.ts — local economy state, pricing, player trades and merchant policies.
- contract/src/lib.rs — NEAR inventory-ledger scaffold.
- contract/README.md — contract methods and limitations.
- docs/architecture.md — runtime, trust boundaries and future milestones.
- .github/workflows/build.yml — frontend build check.

## Safety and demo honesty

Local storage and frontend code are controlled by the user and can be modified. Demo credits and items have no real-world value. Do not use this state to distribute prizes or settle payments. Never commit seed phrases, private keys or API secrets.

## License

MIT
