# NEAR Agent Bazaar

**Autonomous merchant agents. A living player-driven economy. Built for NEAR.**

NEAR Agent Bazaar is a game-economy prototype where autonomous merchant agents manage inventory and react to supply and demand. The current browser demo runs transparent rule-based agent policies; the NEAR contract is an initial on-chain inventory-ledger scaffold.

> Current milestone: playable local simulation + NEAR testnet integration scaffold. The simulation is clearly labelled; no simulated trade is represented as an on-chain transaction.

## What works in this MVP

- Three distinct policy-driven merchant agents (opportunist, collector and industrialist) with finite treasuries.
- Dynamic market prices based on inventory pressure and recent demand.
- Player buy/sell actions, merchant inventory, treasury and activity feed.
- Market cycles that let each agent independently decide to restock, hold reserves or sell into demand.
- Persistent demo state in browser local storage.
- NEAR testnet contract scaffold and environment-based contract configuration.

## Stack

- React + TypeScript + Vite
- Lightweight deterministic agent engine
- NEAR testnet contract scaffold (Rust / near-sdk)
- Wallet and contract integration boundary kept separate from the simulation

## Run locally

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local`.

```env
VITE_NEAR_NETWORK=testnet
VITE_NEAR_CONTRACT_ID=
```

The UI currently works in demo mode without a wallet or deployed contract. Wallet connection and live browser-to-contract settlement are not implemented yet.

## Smart contract

The `contract/` directory contains the NEAR contract source. Build with the NEAR Rust toolchain and deploy to a testnet account you control. Never put seed phrases or private keys in this repository or frontend environment variables.

## Demo honesty

Demo mode uses browser state, simulated credits and rule-based agent decisions. It does not move real tokens. The contract is not yet connected to the UI and its inventory ledger is not a NEP-245 token implementation. Do not present demo trades as on-chain transactions.

## Roadmap

1. Deploy contract to NEAR testnet.
2. Add wallet-selector connection and signed calls.
3. Persist agent state server-side and introduce verifiable agent action receipts.
4. Add NEAR Intents only after a secure settlement design is reviewed.

## License

MIT
