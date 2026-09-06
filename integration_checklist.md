# StreakChaser Integration Checklist

This document serves as the master checklist to ensure all components of the StreakChaser application (Frontend, Backend, Smart Contracts, Bot, and DreamDEX SDK) are fully integrated and functional. It is based on the architecture detailed in `integration.md` and the `CopyTradeVault.sol` contract.

---

## 1. Smart Contract Integration (`CopyTradeVault.sol`)

The `CopyTradeVault` acts as the user's non-custodial session-key vault. 

- [*] **Export Contract ABI & Address**: Extract the ABI for `CopyTradeVault` and configure it in the frontend and backend environments.
- [*] **Deploy & Verify**: Ensure `deploy.sol` successfully deploys on Somnia Shannon Testnet and that testnet USDC is properly linked.
- [x] **Frontend Write Hooks (User Transactions)**:
  - [x] Implement `deposit(uint256 amount)` (Requires prior USDC `approve`).
  - [x] Implement `withdraw(uint256 amount)`.
  - [x] Implement `authorizeBot(address _bot, uint256 _allowance)` to grant the AI Agent allowance.
  - [x] Implement `revokeBot()` for emergency permission removal.
- [x] **Backend Bot Write Hooks (Agent Transactions)**:
  - [x] Implement `executeCopyTrade(address marketPool, uint8 kind, uint256 amount, uint256 limitPrice)` restricted via the `onlyBot` modifier.
- [x] **Event Listeners (Viem / Backend)**:
  - [x] Index `Deposited`, `Withdrawn`, `BotAuthorized`, `BotRevoked`.
  - [x] Index `TradeExecuted` to track successful copy-trades.

---

## 2. DreamDEX SDK Integration (`@somnia-chain/markets-sdk`)

The DreamDEX SDK is used to pull live prediction market data and execute binary options trades.

- [x] **Market Discovery (`/dashboard/events`)**:
  - [x] Implement `client.listBinaryMarkets()` or `client.listMarkets()` to display available events.
  - [x] Map order book prices to implied odds ($P_{\text{YES}} = \text{Price}$, $P_{\text{NO}} = 1 - P_{\text{YES}}$).
- [x] **Live Price Streaming**:
  - [x] Utilize the `useLiveOrderBook(poolAddress)` hook for real-time order book updates on the selected event.
- [x] **Manual Execution (Frontend Override)**:
  - [x] Wire up "Bet YES" / "Bet NO" buttons to `client.placeBinaryOrder(...)` directly from the user's wallet.
- [x] **Active Position Tracking**:
  - [x] Fetch open position balances (YES/NO tokens) held by the user's `CopyTradeVault` address using SDK or subgraph queries.

---

## 3. Frontend Views Integration

Integrate UI components with Backend APIs and Smart Contracts across the dashboard.

### 3.1 Overview Dashboard (`/dashboard`)
- [x] **Top Metric Cards**:
  - [x] Fetch Vault Balance from contract: `vault.tradingToken.balanceOf(vaultAddress)`.
  - [x] Fetch PnL/Win Rate from backend API: `GET /api/user/stats`.
- [x] **Live Radar**:
  - [x] Fetch Top Performers: `GET /api/leaderboard?filter=top_performers`.
  - [x] Fetch Serial Losers: `GET /api/leaderboard?filter=serial_losers`.
  - [x] Wire up "Follow" / "Rebel" action modals to POST to `/api/subscribe`.
- [x] **Recent Activity Feed**:
  - [x] Fetch recent trades: `GET /api/user/executions?limit=5`.
- [x] **Market Heatmap**:
  - [x] Display live volume data using the DreamDEX SDK.

### 3.2 My Vault Page (`/dashboard/vault`)
- [x] **Balances Panel**:
  - [x] Read `Total` and `Available` balances via contract reads.
  - [x] Calculate `In Active Positions` from held ERC20 outcome tokens.
- [x] **Agent Permissions Card**:
  - [x] Read `vault.authorizedBot()` and `vault.botAllowance()`.
  - [x] Wire up "Adjust Allowance" slider/button to `authorizeBot`.
  - [x] Wire up "Emergency Revoke" button to `revokeBot`.
- [x] **Deposit/Withdraw UI**:
  - [x] Connect deposit and withdraw modals to contract functions.

### 3.3 AI Agent View (`/dashboard/ai-agent`)
- [x] **Strategy Toggles**:
  - [x] Implement Follow vs. Rebel toggle calling `PATCH /api/subscribe/mode`.
- [x] **Active Strategy Profile**:
  - [x] Fetch currently subscribed leader profile from backend `copy_subscriptions`.
- [x] **Risk Sizing**:
  - [x] Connect "Allocation %" slider to backend/local config for trade sizing.
- [x] **Agent Status Metrics**:
  - [x] Display real-time execution success rate and PnL.

### 3.4 Events Page (`/dashboard/events`)
- [x] **Leaderboard on Event**:
  - [x] Fetch event-specific top traders: `GET /api/leaderboard?market_pool=0x...`.

### 3.5 Settings Page (`/dashboard/settings`)
- [x] **Automated Risk Controls**:
  - [x] Form for Max Drawdown, Max Allocation, and Slippage guardrails.
  - [x] Connect form to `POST /api/settings` to save `user_settings`.
- [x] **Vault Verification Badge**:
  - [x] Display security status based on `vault.authorizedBot() != address(0)`.

---

## 4. Backend API & Indexer Integration

The Node.js backend handles data indexing and serves data to the frontend.

- [x] **Database Setup (Supabase)**:
  - [x] Ensure schema is deployed for `copy_executions`, `copy_subscriptions`, `user_settings`.
- [x] **On-Chain Indexer (Viem)**:
  - [x] Listen to DreamDEX Event Contracts for global order placements.
  - [x] Calculate user Streaks, Win Rates, and Reputation Scores dynamically.
- [x] **API Endpoints Setup**:
  - [x] `GET /api/leaderboard` (Global & Pool-specific filters).
  - [x] `GET /api/user/stats` (PnL aggregations).
  - [x] `GET /api/user/executions` (Trade history).
  - [x] `POST /api/subscribe` (Follow/Rebel).
  - [x] `PATCH /api/subscribe/mode` (Strategy toggling).
  - [x] `POST /api/settings` (Guardrails).

---

## 5. Bot & Automated Execution Layer

The core autonomous service signing background transactions using the session key.

- [x] **Event Detection**:
  - [x] Backend detects a trade from a followed/rebelled wallet.
- [x] **Strategy Resolution**:
  - [x] Determine action based on `FOLLOW` (mirror) or `REBEL` (invert).
- [x] **Guardrail Checks**:
  - [x] Verify trade meets Max Drawdown, Slippage, and Allocation constraints.
- [x] **Contract Execution**:
  - [x] Bot calls `CopyTradeVault.executeCopyTrade` with the calculated payload.
  - [x] Wait for `TradeExecuted` event to mark status as `SUCCESS` in the database.



## Current status

### ✅ What is Already Integrated

**Smart Contracts**
- The `CopyTradeVault.sol` contract has been deployed and the ABI has been exported to your environments, as noted in your checklist.

**Backend API & Bot Execution**
- **On-Chain Indexer:** `backend/src/listeners/somnia.ts` is fully set up to listen to DreamDEX `OrderPlaced` events in real-time via `viem`.
- **Automated Copy-Trader (Agent):** `backend/src/services/copyTrader.ts` has been implemented! It successfully queries `copy_subscriptions` in Supabase, calculates whether to mirror (Follow) or invert (Rebel) the trade, and signs the `executeCopyTrade` transaction using the Bot's session key.
- **API Routes:** The scaffolding for `/api/leaderboard` and `/api/subscribe` is mounted in `backend/src/index.ts`.

**Frontend UI Shell**
- The Next.js dashboard layout (`/dashboard/page.tsx`) and the overarching structural components (`StatCards`, `LiveRadar`, `AIVaultSection`) have been built visually with your design system.

**DreamDEX SDK Setup**
- `@somnia-chain/markets-sdk` is installed and initialized in `frontend/lib/somnia.ts`.

### ⏳ What Still Needs Integration (The Gaps)

While the backend bot is ready to execute trades and the frontend looks great, the frontend is currently displaying hardcoded static data.

Here is what you still need to integrate to make it fully functional:

- [x] **Frontend Data Binding:** Wire up the mocked components (like the `AIVaultSection`) to actually fetch real balances from your `CopyTradeVault` via Wagmi/Viem.
- [x] **Web3 Write Transactions:** The "Deposit", "Adjust Allowance", and "Emergency Revoke" buttons in the UI need to be connected to trigger MetaMask signatures.
- [x] **Markets SDK Live Feeds:** Replace static heatmap/event data with the `client.listBinaryMarkets()` and `useLiveOrderBook()` hooks from the DreamDEX SDK to stream real implied odds.
- [x] **Strategy Modals:** The "Follow Mode" and "Rebel Mode" toggles need to send real `POST` requests to `/api/subscribe` to activate the backend bot.