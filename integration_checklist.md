# StreakChaser Integration Checklist

This document serves as the master checklist to ensure all components of the StreakChaser application (Frontend, Backend, Smart Contracts, Bot, and DreamDEX SDK) are fully integrated and functional. It is based on the architecture detailed in `integration.md` and the `CopyTradeVault.sol` contract.

---

## 1. Smart Contract Integration (`CopyTradeVault.sol`)

The `CopyTradeVault` acts as the user's non-custodial session-key vault. 

- [*] **Export Contract ABI & Address**: Extract the ABI for `CopyTradeVault` and configure it in the frontend and backend environments.
- [*] **Deploy & Verify**: Ensure `deploy.sol` successfully deploys on Somnia Shannon Testnet and that testnet USDC is properly linked.
- [ ] **Frontend Write Hooks (User Transactions)**:
  - [ ] Implement `deposit(uint256 amount)` (Requires prior USDC `approve`).
  - [ ] Implement `withdraw(uint256 amount)`.
  - [ ] Implement `authorizeBot(address _bot, uint256 _allowance)` to grant the AI Agent allowance.
  - [ ] Implement `revokeBot()` for emergency permission removal.
- [ ] **Backend Bot Write Hooks (Agent Transactions)**:
  - [ ] Implement `executeCopyTrade(address marketPool, uint8 kind, uint256 amount, uint256 limitPrice)` restricted via the `onlyBot` modifier.
- [ ] **Event Listeners (Viem / Backend)**:
  - [ ] Index `Deposited`, `Withdrawn`, `BotAuthorized`, `BotRevoked`.
  - [ ] Index `TradeExecuted` to track successful copy-trades.

---

## 2. DreamDEX SDK Integration (`@somnia-chain/markets-sdk`)

The DreamDEX SDK is used to pull live prediction market data and execute binary options trades.

- [ ] **Market Discovery (`/dashboard/events`)**:
  - [ ] Implement `client.listBinaryMarkets()` or `client.listMarkets()` to display available events.
  - [ ] Map order book prices to implied odds ($P_{\text{YES}} = \text{Price}$, $P_{\text{NO}} = 1 - P_{\text{YES}}$).
- [ ] **Live Price Streaming**:
  - [ ] Utilize the `useLiveOrderBook(poolAddress)` hook for real-time order book updates on the selected event.
- [ ] **Manual Execution (Frontend Override)**:
  - [ ] Wire up "Bet YES" / "Bet NO" buttons to `client.placeBinaryOrder(...)` directly from the user's wallet.
- [ ] **Active Position Tracking**:
  - [ ] Fetch open position balances (YES/NO tokens) held by the user's `CopyTradeVault` address using SDK or subgraph queries.

---

## 3. Frontend Views Integration

Integrate UI components with Backend APIs and Smart Contracts across the dashboard.

### 3.1 Overview Dashboard (`/dashboard`)
- [ ] **Top Metric Cards**:
  - [ ] Fetch Vault Balance from contract: `vault.tradingToken.balanceOf(vaultAddress)`.
  - [ ] Fetch PnL/Win Rate from backend API: `GET /api/user/stats`.
- [ ] **Live Radar**:
  - [ ] Fetch Top Performers: `GET /api/leaderboard?filter=top_performers`.
  - [ ] Fetch Serial Losers: `GET /api/leaderboard?filter=serial_losers`.
  - [ ] Wire up "Follow" / "Rebel" action modals to POST to `/api/subscribe`.
- [ ] **Recent Activity Feed**:
  - [ ] Fetch recent trades: `GET /api/user/executions?limit=5`.
- [ ] **Market Heatmap**:
  - [ ] Display live volume data using the DreamDEX SDK.

### 3.2 My Vault Page (`/dashboard/vault`)
- [ ] **Balances Panel**:
  - [ ] Read `Total` and `Available` balances via contract reads.
  - [ ] Calculate `In Active Positions` from held ERC20 outcome tokens.
- [ ] **Agent Permissions Card**:
  - [ ] Read `vault.authorizedBot()` and `vault.botAllowance()`.
  - [ ] Wire up "Adjust Allowance" slider/button to `authorizeBot`.
  - [ ] Wire up "Emergency Revoke" button to `revokeBot`.
- [ ] **Deposit/Withdraw UI**:
  - [ ] Connect deposit and withdraw modals to contract functions.

### 3.3 AI Agent View (`/dashboard/ai-agent`)
- [ ] **Strategy Toggles**:
  - [ ] Implement Follow vs. Rebel toggle calling `PATCH /api/subscribe/mode`.
- [ ] **Active Strategy Profile**:
  - [ ] Fetch currently subscribed leader profile from backend `copy_subscriptions`.
- [ ] **Risk Sizing**:
  - [ ] Connect "Allocation %" slider to backend/local config for trade sizing.
- [ ] **Agent Status Metrics**:
  - [ ] Display real-time execution success rate and PnL.

### 3.4 Events Page (`/dashboard/events`)
- [ ] **Leaderboard on Event**:
  - [ ] Fetch event-specific top traders: `GET /api/leaderboard?market_pool=0x...`.

### 3.5 Settings Page (`/dashboard/settings`)
- [ ] **Automated Risk Controls**:
  - [ ] Form for Max Drawdown, Max Allocation, and Slippage guardrails.
  - [ ] Connect form to `POST /api/settings` to save `user_settings`.
- [ ] **Vault Verification Badge**:
  - [ ] Display security status based on `vault.authorizedBot() != address(0)`.

---

## 4. Backend API & Indexer Integration

The Node.js backend handles data indexing and serves data to the frontend.

- [ ] **Database Setup (Supabase)**:
  - [ ] Ensure schema is deployed for `copy_executions`, `copy_subscriptions`, `user_settings`.
- [ ] **On-Chain Indexer (Viem)**:
  - [ ] Listen to DreamDEX Event Contracts for global order placements.
  - [ ] Calculate user Streaks, Win Rates, and Reputation Scores dynamically.
- [ ] **API Endpoints Setup**:
  - [ ] `GET /api/leaderboard` (Global & Pool-specific filters).
  - [ ] `GET /api/user/stats` (PnL aggregations).
  - [ ] `GET /api/user/executions` (Trade history).
  - [ ] `POST /api/subscribe` (Follow/Rebel).
  - [ ] `PATCH /api/subscribe/mode` (Strategy toggling).
  - [ ] `POST /api/settings` (Guardrails).

---

## 5. Bot & Automated Execution Layer

The core autonomous service signing background transactions using the session key.

- [ ] **Event Detection**:
  - [ ] Backend detects a trade from a followed/rebelled wallet.
- [ ] **Strategy Resolution**:
  - [ ] Determine action based on `FOLLOW` (mirror) or `REBEL` (invert).
- [ ] **Guardrail Checks**:
  - [ ] Verify trade meets Max Drawdown, Slippage, and Allocation constraints.
- [ ] **Contract Execution**:
  - [ ] Bot calls `CopyTradeVault.executeCopyTrade` with the calculated payload.
  - [ ] Wait for `TradeExecuted` event to mark status as `SUCCESS` in the database.



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

- [ ] **Frontend Data Binding:** Wire up the mocked components (like the `AIVaultSection`) to actually fetch real balances from your `CopyTradeVault` via Wagmi/Viem.
- [ ] **Web3 Write Transactions:** The "Deposit", "Adjust Allowance", and "Emergency Revoke" buttons in the UI need to be connected to trigger MetaMask signatures.
- [ ] **Markets SDK Live Feeds:** Replace static heatmap/event data with the `client.listBinaryMarkets()` and `useLiveOrderBook()` hooks from the DreamDEX SDK to stream real implied odds.
- [ ] **Strategy Modals:** The "Follow Mode" and "Rebel Mode" toggles need to send real `POST` requests to `/api/subscribe` to activate the backend bot.