# StreakHub Contract Architecture

The contract acts as the immutable trust and reputation engine bridging Somnia Agents and DreamDEX. It is responsible for four key jobs:

### 1. Requesting the Verifiable AI Signal (The Dispatcher)
Before a DreamDEX 15-minute or 1-hour round locks, your contract accepts the market context (e.g., `roundId`, `asset pair`, `line to beat`, `expiry timestamp`). It forwards this data with an STT gas deposit to Somnia’s on-chain Agent interface by calling `inferNumber` (or the Somnia Agent Router).

### 2. Receiving & Locking the AI Receipt (Anti-Tamper Proof)
The contract implements Somnia’s callback interface. Once the Somnia validator network reaches consensus on the AI inference, it executes your callback function, returning the confidence score (e.g., 64% UP). The contract records this score alongside the current block timestamp and emits an indexed event (`PredictionLogged`). Because the timestamp proves the score was logged before the round closed, the AI's signal can never be cherry-picked or backdated.

### 3. Verifying Track Records & Proof of Skill (The Reputation Ledger)
The contract maintains a state mapping for every participant (both human addresses and the AI agent itself). It logs their calls for each round (`roundId => CallDirection`). Once DreamDEX resolves the outcome, the contract verifies the winner, updates the address's current streak and total win-rate, and records a cumulative accuracy score (such as a Brier calibration score).

### 4. Guarding Rules & Auto-Pilot Caps (Safety Layer)
If you implement the auto-pilot feature or delegated execution, this contract enforces non-custodial constraints—specifically checking that a user's daily maximum stake limit has not been breached before approving an automated entry into a DreamDEX market.

## Why You Only Need 1 Contract

```text
       ┌────────────────────────────────────────────────────────┐
       │                 StreakHub.sol (Single Contract)        │
       │                                                        │
       │  1. Dispatches AI query     ──>  Somnia Agent Router   │
       │  2. Receives AI Callback    <──  Validator Consensus   │
       │  3. Logs User/AI calls      ──>  Emits On-chain Events │
       │  4. Verifies resolution     <──  DreamDEX Settlement   │
       └────────────────────────────────────────────────────────┘
```

Everything else—the high-speed leaderboard queries, push alerts, frontend graphs, and market sentiment aggregation—is handled off-chain by the backend indexer reading the contract's emitted events.