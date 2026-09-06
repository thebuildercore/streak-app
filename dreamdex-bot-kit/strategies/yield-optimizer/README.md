# Yield Optimizer

Proximity-weighted **maker** bot for DreamDEX's
[Collateral Yield Algorithm](https://docs.dreamdex.io/trading/common/yield-algorithm).
Quotes two-sided **PostOnly** orders, snaps them into the Gaussian high-weight
region around mid, skews with an Avellaneda-lite reservation price, and reports
a yield-vs-risk score — distinct from both [market-making](../market-making)
(fixed bps spread) and [treasury](../treasury) (idle-USDso parking).

## The idea

DreamDEX pays makers for **resting open interest**, not per-fill rebates:

\[
W = e^{-\frac{(P_{\mathrm{order}} - P_{\mathrm{mid}})^2}{2\sigma^2}},\quad
\mathrm{score} = q \times W \times \mathrm{seconds}
\]

\(\sigma\) is per market in **raw on-chain price units**. `GET /v0/markets` and
`getPoolParams` do **not** expose \(\sigma\) today — set `YO_SIGMA_RAW` (or
`YO_SIGMA_TICKS` as a bootstrap) and calibrate with the startup band log.

This bot:

1. Builds a reservation price from inventory + realized mid vol (Avellaneda-lite).
2. **Snaps** quotes inward until \(W \ge\) `YO_MIN_WEIGHT` (default ≈ one \(\sigma\)).
3. Requotes when mid drifts, inventory breaches, or resting \(W\) falls out of band.
4. Kill-switches on stale WS, low gas, hard inventory, toxic rolling mark-out, or
   `YO_MODE=flatten`.
5. Logs score rate / accrued score; emit CSVs for
   [`tools/edge-analytics`](../../tools/edge-analytics).

Do **not** confuse the two \(\sigma\)s:

| Symbol | Meaning | Config |
| --- | --- | --- |
| Protocol \(\sigma\) | Yield-band width (raw price) | `YO_SIGMA_RAW` / `YO_SIGMA_TICKS` |
| Avellaneda \(\sigma_{\mathrm{vol}}\) | Trailing mid return stdev | `YO_VOL_LOOKBACK` |

## Calibrating `YO_SIGMA_*`

Sprint 0 finding: sigma is described as on-chain per market, but no documented
REST field or `getSigma()` exists yet. Until ops publish it:

```bash
# Bootstrap: treat σ as N ticks (default 50). Startup logs W at 1σ / 2σ / radius.
YO_SIGMA_TICKS=50 npm run dev -w yield-optimizer

# Once you know the raw value (quote decimals, same units as price raw):
YO_SIGMA_RAW=5000000000000000 npm run dev -w yield-optimizer
```

On a ~1 bp touch book (e.g. WETH), expect the snap to land **at the touch** —
that matches competition MM configs for proximity yield.

## Run

```bash
npm install                       # from the repo root, once
cp .env.example .env              # set PRIVATE_KEY, keep NETWORK=testnet
# or: cp strategies/yield-optimizer/.env.example strategies/yield-optimizer/.env
npm run dev -w yield-optimizer    # DRY_RUN=true by default
```

Set `DRY_RUN=false` when ready. Prefer session keys
([docs/session-keys.md](../../docs/session-keys.md)): `OWNER_ADDRESS` + operator
`PRIVATE_KEY` — the bot never needs withdraw rights.

**Modes** (set at process start — restart the bot after changing `YO_MODE`):

```bash
YO_MODE=flatten npm run start -w yield-optimizer   # cancel and idle
YO_MODE=cancel  npm run start -w yield-optimizer
YO_MODE=quote   npm run start -w yield-optimizer
```

## Configuration

| Env | Meaning |
| --- | --- |
| `YO_SYMBOL` | Market (default `SOMI:USDso`) |
| `YO_SIGMA_RAW` / `YO_SIGMA_TICKS` | Protocol yield \(\sigma\) |
| `YO_MIN_WEIGHT` | Weight floor (default `0.607` ≈ 1σ) |
| `YO_HALF_SPREAD_BPS` | Floor half-spread before vol term |
| `YO_GAMMA` / `YO_K_VOL` / `YO_VOL_LOOKBACK` | Reservation + half-spread |
| `YO_NOTIONAL_USDSO` | Size per side |
| `YO_TARGET_INVENTORY_USDSO` / `YO_MAX_INVENTORY_USDSO` | Inventory target / hard cap |
| `YO_REQUOTE_TRIGGER_BPS` / `YO_REQUOTE_COOLDOWN_MS` | Gas-efficient requote |
| `YO_MAX_BOOK_SPREAD_BPS` | Skip dislocated books |
| `YO_MAX_TOXIC_BPS` | Kill on rolling adverse mark-out |
| `YO_STALE_MS` / `YO_MIN_GAS_SOMI` | Feed / gas kill switches |
| `YO_FLATTEN_ABOVE_USDSO` | IOC shed excess base (0 = off) |
| `YO_TRADES_CSV` / `YO_MIDS_CSV` / `YO_YIELD_CSV` | Optional analytics logs |

## Reporting

Live loop prints a `net-score` line (score rate + accrued + W + gas txs).
Spread capture and adverse selection come from edge-analytics on the trade/mid
CSVs. Presence yield is the sixth term in
[docs/measuring-edge.md](../../docs/measuring-edge.md) — realized USDso payout
still needs a settlement ingest (portfolio API is trading PnL only).

```bash
# After a live/dry run with CSVs enabled:
npm start -w dreamdex-edge-analytics -- \
  --trades data/yo-trades.csv --mid data/yo-mids.csv \
  --yield-log data/yo-yield.csv
```

## Backtest

Candle replay cannot model competing makers' score share. The adapter accrues an
**own-order relative** `estYieldScore` (`qty × W × barSeconds`) — not a USDso APR.

```bash
npm run backtest -- run yield-optimizer --symbol SOMI:USDso --interval 5m --days 7 --quiet
npm run backtest -- run yield-optimizer --set sigmaTicks=30 --set halfSpreadBps=3
```

## Non-goals (V1)

No multi-pair orchestration, multi-level ladder, hosted SaaS, ERC-4626 vault, or
Python port. Wallet auto-pull by default (vault not required for yield).

## Disclaimer

Please read the [Legal Disclaimer](../../DISCLAIMER.md) before using this bot.
