# ec-passive — patient entry with a resting bid

Buys the Up (or Down) side of the current window **only at its price**: rests
a post-only bid at `EC_TARGET` and waits. Dips fill it; anything else leaves
it untouched. It never crosses the spread — if the market is already at or
below the target it does nothing. Passive by design, not guaranteed execution.

```bash
npm start -w ec-passive        # DRY_RUN=true by default
```

Env: `PRIVATE_KEY` (funded), `DEPLOY_ENV` (`testnet` default), `EC_SIDE`
(`up`|`down`), `EC_TARGET` (default 0.40), `EC_SIZE` (per-order shares),
`EC_MAX_POSITION` (stop accumulating, per window), `EC_UNDERLYING` (e.g.
`BTC`, empty = any), `EC_REFRESH_MS`, `EC_MIN_LEFT_S` (pins the
headroom; by default it scales to 40% of the window capped at 10 minutes, so a
1h series needs 10min left, a 15m series 6min, and a 5m series 2min), `DRY_RUN`.

What it demonstrates beyond the starter:

- **Post-only** placement — the bid can only rest, never take.
- **Fills as ground truth** — position comes from the wallet's own trade
  history, not from what was ordered.
- **Window rolls** — orders die with the market's expiry; the bot follows the
  successor window and starts a fresh count.

One binary-market caveat: getting filled "on a dip" means buying exactly when
your side got less likely — passive entry in a binary carries adverse
selection. Size accordingly. Read [`docs/event-contracts.md`](../../docs/event-contracts.md) before going live.
