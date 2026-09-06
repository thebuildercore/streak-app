# ⚡ Streak: Social Copy & Counter-Trading Agent on DreamDEX

> **Autonomous on-chain copy-trading, fade radar, and reputation indexer built for DreamDEX Event Contracts on the Somnia Network.**

---

## 📌 Overview

**Streak** transforms DreamDEX Event Contracts into a frictionless, social trading ecosystem on Somnia. 

Instead of requiring traders to manually monitor prediction markets and sign MetaMask approvals for every fluctuating probability, Streak introduces:

1. **Global On-Chain Radar:** Permissionlessly indexes *all* trades occurring across DreamDEX Event Contracts on the Somnia testnet to rank top performers ("Alpha") and bottom performers ("Fade Targets").
2. **Follow or Rebel (Counter-Trading):** Users can follow hot win streaks or take the inverse position against serial losers (e.g., if a losing trader buys `YES`, your agent automatically buys `NO`).
3. **Session-Key Vaults (`CopyTradeVault`):** Non-custodial delegated smart contract vaults where users set a budget allowance, enabling automated background execution with **zero MetaMask popups per trade**.

---

## ✨ Key Features

- **Permissionless Trader Intelligence:** Traders don't need to sign up for Streak. The platform indexes native DreamDEX event contracts globally across Somnia.
- **Follow & Rebel Modes:**
  - *Follow:* Mirror high-conviction trades from wallets on active winning streaks.
  - *Rebel:* Take the counter-trade against chronic losers (the ultimate "fade" mechanism).
- **Session-Key Execution Model:** Users approve an allocation once. The AI agent executes copy-trades in milliseconds directly on Somnia's high-throughput network without friction.
- **Dynamic Reputation Scoring:** Ranks traders by:
  $$\text{Score} = (\text{WinRate} \times 70\%) + \text{Volume Factor} + \text{Streak Consistency}$$

---

## 🛠️ System Architecture

```text
               +-------------------------------------------------------------+
               |                    Somnia Shannon Testnet                   |
               +-------------------------------------------------------------+
                                       |
                     Any Trader places an order on DreamDEX
                                       |
                                       v
               +-------------------------------------------------------------+
               |                 DreamDEX Event Contract                     |
               |                (BinaryPool Contract Trade)                  |
               +-------------------------------------------------------------+
                                       |
                       On-Chain Event (OrderPlaced / Fill)
                                       |
                                       v
+-----------------------------------------------------------------------------------------+
|                                    STREAK BACKEND                                       |
|                                                                                         |
|  1. Indexer (viem):                                                                     |
|     - Captures trader address, pool, direction (YES/NO), price, and volume              |
|     - Calculates Streaks, Win Rates, and Reputation Scores into Supabase                |
|                                                                                         |
|  2. Agent Execution Service:                                                            |
|     - Detects if traded wallet is a subscribed Leader                                   |
|     - Resolves strategy:                                                                |
|         * FOLLOW: Mirror outcome (BUY_YES -> BUY_YES)                                   |
|         * REBEL:  Invert outcome (BUY_YES -> BUY_NO)                                    |
|     - Triggers user's personal CopyTradeVault using the Bot Session Key                 |
+-----------------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------------+
|                                  SMART CONTRACTS                                        |
|                                                                                         |
|  CopyTradeVault.sol:                                                                    |
|     - User deposits collateral (Testnet USDC)                                           |
|     - User grants bot allowance (Session Key)                                           |
|     - Bot calls `executeCopyTrade(...)` -> executes `placeBinaryOrder` on DreamDEX      |
|     - User can withdraw funds or revoke bot permissions anytime                         |
+-----------------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------------+
|                                  NEXT.JS FRONTEND                                       |
|  - Live DreamDEX Market Tickers (via @somnia-chain/markets-sdk)                         |
|  - Alpha Leaderboard (Top Streaks) vs. Fade Radar (Serial Losers)                       |
|  - 1-Click "Follow" / "Rebel" Subscriptions & Vault Allowance Management               |
+-----------------------------------------------------------------------------------------+
```

---

## 📦 Tech Stack

- **Blockchain:** Somnia Shannon Testnet (Chain ID: 50312)
- **DEX & Prediction Layer:** DreamDEX Event Contracts (`@somnia-chain/markets-sdk`, `BinaryPool`)
- **Smart Contracts:** Solidity ^0.8.20, Foundry
- **Backend:** Node.js, TypeScript, Express, viem, Supabase (PostgreSQL)
- **Frontend:** Next.js (App Router), Tailwind CSS, Wagmi / RainbowKit

---

## 📂 Repository Structure

```text
streak/
├── contracts/               # Foundry smart contracts
│   ├── src/
│   │   └── CopyTradeVault.sol
│   ├── script/
│   │   └── DeployVault.s.sol
│   └── foundry.toml
├── backend/                 # Indexer, API, and Agent execution service
│   ├── src/
│   │   ├── db/              # Supabase connection
│   │   ├── listeners/       # On-chain Somnia event listener
│   │   ├── routes/          # Leaderboard & subscription APIs
│   │   ├── services/        # Bot copy/counter trade dispatcher
│   │   └── index.ts
│   ├── database.sql         # Supabase schema definition
│   └── package.json
└── frontend/                # Next.js web application
    ├── src/
    │   ├── components/      # Leaderboard, Vault, and Strategy modals
    │   └── hooks/           # Web3 hooks & Markets SDK queries
    └── package.json
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18+
- **Foundry:** Installed on your system
- **Wallet:** A Somnia Shannon testnet wallet funded with STT (gas) and testnet USDC.
- **RPC URL:** `https://dream-rpc.somnia.network`
- **Chain ID:** `50312`
- **Testnet USDC Address:** `0xE9CC37904875B459Fa5D0FE37680d36F1ED55e38`

### 2. Smart Contract Deployment
```bash
cd contracts

# Install OpenZeppelin dependencies
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Compile
forge build

# Configure your .env
cp .env.example .env
# Set PRIVATE_KEY and RPC_URL=https://dream-rpc.somnia.network

# Deploy to Somnia Shannon Testnet
forge script script/DeployVault.s.sol:DeployVault --rpc-url "$RPC_URL" --broadcast
```

### 3. Backend Setup & Indexer
1. **Database Setup:**
   - Create a project in Supabase.
   - Run the contents of `backend/database.sql` in the Supabase SQL Editor.
2. **Environment Variables (`backend/.env`):**
   ```env
   PORT=3000
   RPC_URL=https://dream-rpc.somnia.network
   BOT_PRIVATE_KEY=your_bot_account_private_key_without_0x
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
3. **Install & Run:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *The backend will boot up, serve `/api/leaderboard`, and start listening for DreamDEX events on Somnia.*

### 4. Frontend Setup
1. **Configure Environment (`frontend/.env.local`):**
   ```env
   NEXT_PUBLIC_RPC_URL=https://dream-rpc.somnia.network
   NEXT_PUBLIC_CHAIN_ID=50312
   NEXT_PUBLIC_TESTNET_USDC=0xE9CC37904875B459Fa5D0FE37680d36F1ED55e38
   NEXT_PUBLIC_BOT_ADDRESS=your_bot_public_address
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```
2. **Install & Run:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Open `http://localhost:3000` in your browser.*

---

## 🔒 Security & Risk Mitigations

- **Non-Custodial Architecture:** Users never deposit funds into a centralized platform pool. Each user interacts with their personal `CopyTradeVault`.
- **Allowance Cap:** The AI agent can never trade beyond the allowance explicitly granted by the user.
- **Immediate Revocation:** A one-click `revokeBot()` function cuts the bot's allowance to `0` instantly on-chain.
- **Withdrawal Guarantee:** The vault owner can withdraw 100% of unallocated USDC back to their wallet at any time.

---

## 🛣️ Future Roadmap

- `[ ]` **Automated Factory Contract (`VaultFactory.sol`):** One-click deterministic deployment of personal vaults using CREATE2.
- `[ ]` **Native EIP-7702 Delegation:** Transitioning from individual vaults to native Smart Account delegation on Somnia.
- `[ ]` **Dynamic Slippage & Liquidity Protection:** Advanced bot algorithms to avoid low-liquidity DreamDEX pools.
- `[ ]` **Telegram & Discord Signal Bots:** Instant push notifications when followed alpha traders take positions.