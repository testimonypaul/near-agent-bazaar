# NEAR Agent Bazaar

**Autonomous AI merchants. A living player-driven economy. Built on NEAR.**

NEAR Agent Bazaar is a game-economy prototype where autonomous merchant agents manage inventory, react to supply and demand, negotiate trades, and settle item transfers through NEAR smart contracts.

> Current milestone: playable local simulation + NEAR testnet integration scaffold. The simulation is clearly labelled; no simulated trade is represented as an on-chain transaction.

## What works in this MVP

- Three distinct merchant agents with different strategies and finite treasuries.
- Dynamic market prices based on inventory pressure and recent demand.
- Player buy/sell actions, merchant inventory, treasury and activity feed.
- A deterministic market tick that lets agents independently decide to restock or sell.
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

The UI works in demo mode without a wallet or deployed contract. On-chain mode must only be enabled after deploying the contract and wiring a compatible NEAR wallet.

## Smart contract

The `contract/` directory contains the NEAR contract source. Build with the NEAR Rust toolchain and deploy to a testnet account you control. Never put seed phrases or private keys in this repository or frontend environment variables.

## Demo honesty

Demo mode uses browser state and simulated agent decisions. It does not move real tokens. The on-chain contract scaffold is separate and must be deployed/configured before claiming live settlement.

## Roadmap

1. Deploy contract to NEAR testnet.
2. Add wallet-selector connection and signed calls.
3. Persist agent state server-side and introduce verifiable agent action receipts.
4. Add NEAR Intents only after a secure settlement design is reviewed.

## License

MIT
