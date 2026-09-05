# StreakChaser Application Integration & Architecture Mapping

Every single card, widget, button, and data stream in the **StreakChaser** application maps directly to one of four architectural layers:

1. **Smart Contract Layer**: `CopyTradeVault.sol` & testnet USDC contract on Somnia Network.
2. **Backend API & Indexer**: Node.js microservice + Supabase database indexer.
3. **DreamDEX SDK Layer**: `@somnia-chain/markets-sdk` interacting with on-chain prediction order books.
4. **Backend AI Agent Executor**: Autonomous bot wallet signing background copy-trade executions.

---

## 1. Dashboard View (`/dashboard`)

### Top Metric Cards
* **Vault Balance**: Contract read call `vault.tradingToken.balanceOf(vaultAddress)`.
* **PnL / Win Rate**: Backend API query (`GET /api/user/stats`) calculating the profit/loss sum of all rows in `copy_executions`.

### Live Radar (Top Performers / Serial Losers)
* **Leaderboard Data**: Backend API `GET /api/leaderboard?filter=top_performers` or `?filter=serial_losers`.
* **Follow / Rebel Buttons**: Opens strategy modal and submits subscription to `POST /api/subscribe`.

### Your Vault & AI Agent Widget
* **Vault Balance & Available**: Contract read call to user's `CopyTradeVault`.
* **AI Agent Status & Mode Toggles**: Read from backend `copy_subscriptions` table to check active monitoring state for this user.

### Recent Activity Feed
* **Feed Data**: Backend API `GET /api/user/executions?limit=5` reading from `copy_executions`.

### Market Heatmap
* **Market Data**: DreamDEX SDK `client.listBinaryMarkets()` or `client.listMarkets()` fetching live volume and implied odds.

### Active Positions
* **Positions List**: DreamDEX SDK / Subgraph fetching open position balances (YES/NO outcome tokens) held by the user's `CopyTradeVault` contract address.

---

## 2. My Vault Page (`/dashboard/vault`)

### Balances (Total, Available, In Positions)
* **Total & Available Balance**: Contract read call to `CopyTradeVault` (`tradingToken.balanceOf(vault)`).
* **In Active Positions**: Sum of ERC20 outcome token balances held by the vault contract.

### Agent Permissions Card
* **Authorized Agent Address**: Contract read `vault.authorizedBot()`.
* **Allowance**: Contract read `vault.botAllowance()`.
* **Adjust Allowance Slider & Button**: Contract write call to `vault.authorizeBot(botAddress, newAllowance)` (requires 1 MetaMask signature).
* **Emergency Revoke Button**: Contract write call to `vault.revokeBot()` (requires 1 MetaMask signature).

### Deposit & Withdraw Panel
* **Deposit Button**: Standard ERC20 two-step flow:
  1. `USDC.approve(vaultAddress, amount)`
  2. `vault.deposit(amount)`
* **Withdraw Button**: Contract write call to `vault.withdraw(amount)`.

---

## 3. AI Agent View (`/dashboard/ai-agent`)

### Mode Selection (Follow vs. Rebel)
* **Mode Toggle**: Backend API `PATCH /api/subscribe/mode` with `{ mode: 'FOLLOW' | 'REBEL' }`. Updates execution rules instantly without gas fees.

### Active Strategy (AlphaWolf / Leader Profile)
* **Profile Info**: Backend API reading the leader profile linked to the user's active row in `copy_subscriptions`.

### Allocation Slider (% of Vault)
* **Risk Sizing**: Backend API / Local Config setting the `allocation_per_trade` ratio so the execution bot sizes orders relative to available vault balance.

### Agent Status & Live Metrics (Last Trade, Trades Today, PnL)
* **Performance Metrics**: Backend API aggregating data from `copy_executions` filtered by `user_vault_address` and `status = 'SUCCESS'`.

---

## 4. Events Page (`/dashboard/events`)

### Market Directory & Search (Left Panel)
* **Market Listings**: DreamDEX SDK calling `client.listBinaryMarkets()`.
* **Implied Odds**: Derived directly from order book prices ($P_{\text{YES}} = \text{Price}$, $P_{\text{NO}} = 1 - P_{\text{YES}}$).

### Selected Event Details (Right Panel)
* **Live Price Stream**: DreamDEX SDK `useLiveOrderBook(poolAddress)` hook updating order book prices in real time.
* **Bet YES / Bet NO Buttons**: Manual override trading calling `client.placeBinaryOrder(...)` directly from the user's wallet.
* **Top Traders on Event**: Backend API `GET /api/leaderboard?market_pool=0x...` querying historical trades filtered by market pool.

---

## 5. Settings Page (`/dashboard/settings`)

### Automated Risk & Sizing Controls
* **Guardrails (Max Drawdown, Max Allocation, Slippage)**: Saved to `user_settings` table via `POST /api/settings`. When `dispatchCopyTrades()` executes in the backend, the bot evaluates these guardrails before submitting any transaction on-chain.

### Vault Delegator Approval
* **Verification**: Contract read checking `vault.authorizedBot() != address(0)` to display the verified green security status.