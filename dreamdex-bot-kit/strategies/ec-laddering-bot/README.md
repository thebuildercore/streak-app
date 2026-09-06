# ec-laddering-bot — probability ladder (demo #9)

Posts a **ladder of resting limit orders** around the YES book mid on one live
event contract. When implied probability oscillates, buys fill on dips and sells
fill on rips — passive mean-reversion, no screen watching.

```bash
npm start -w ec-laddering-bot   # DRY_RUN=true by default
```

## What it teaches

- **Only resting limits capture mean-reversion.** A taker pays the spread every
  time; a laddered maker earns it when the book mean-reverts.
- **Inventory is the risk.** Every fill leaves directional exposure until you
  flatten or the window resolves.
- **Flatten before expiry is non-negotiable.** Near settlement, price goes to
  0 or 1. An open grid at lock is a settlement bet, not relative value.

## How it behaves

1. Picks **one** Trading market (longest window; optional `EC_UNDERLYING` /
   `EC_MARKET`).
2. Seeds inventory once via **mint-a-pair** so sell rungs are collateralised.
3. Centers the grid on **`GRID_CENTER`** or the YES book mid (fallback `0.5`).
4. Places **post-only** bids below and asks above (default: 2 rungs × 5¢).
5. Each cycle: cancel stale quotes, re-place the ladder, respect **net inventory
   cap** (`GRID_MAX_INVENTORY`).
6. Inside **`GRID_FLATTEN_BUFFER_MS`** of expiry: cancel all, **burn** paired
   YES+NO, **IOC** sell any excess leg. Does not re-quote.

## Caveat (plain)

The grid earns when price **oscillates**. A one-way move loads the wrong side.
This is **relative value, not riskless**. The inventory cap and flatten step bound
a bad run — they do not eliminate directional risk mid-window.

## Config

Repo-root `.env` (same as other EC bots).

| env | default | meaning |
| --- | --- | --- |
| `GRID_LEVELS` | `2` | rungs per side |
| `GRID_SPACING` | `0.05` | probability step between rungs |
| `GRID_SIZE` | `5` | shares per rung |
| `GRID_MAX_INVENTORY` | `20` | max \|YES − NO\| before stopping that side |
| `GRID_CENTER` | (unset) | fixed P(up); unset = follow YES mid |
| `GRID_FLATTEN_BUFFER_MS` | `300000` | start flatten this long before expiry |
| `GRID_REFRESH_MS` | `10000` | cycle interval |
| `EC_UNDERLYING` | (any) | e.g. `BTC` |
| `EC_MARKET` | (unset) | pin exact market symbol |
| `VENUE_ID` / `OPERATOR_ID` | (unset) | scope venue when multiple operators list markets |
| `DRY_RUN` | `true` | log ladder only |
| `PRIVATE_KEY` | (unset) | funded signer for live |
| `DEPLOY_ENV` | `testnet` | **`testnet` or `mainnet`** — EC config key (not `NETWORK`) |

Keep **`GRID_LEVELS * GRID_SIZE ≤ MM_INVENTORY`** so sell rungs stay within minted
YES (default inventory 200 on testnet).

### “no market to ladder”

The bot only runs when the indexer lists **active** binary markets and on-chain
status is **Trading**. Common fixes:

- **Testnet has no live windows** — indexer returns 0 active binaries; wait for
  markets or use `DEPLOY_ENV=mainnet` if you trade there.
- **Multiple venues** — set `VENUE_ID` or `OPERATOR_ID` in `.env` (same as
  `ec-oracle-follow` / `ec-maker`).
- **Wrong filter** — clear `EC_UNDERLYING` / `EC_MARKET` if you set them too narrow.

## Deploy

Railway: `STRATEGY=ec-laddering-bot` via the existing worker entrypoint. Dry run
first, then a funded key distinct from any other quoter (self-match is blocked).

Redeeming winners after settlement is **`ec-settlement`**'s job. Read
`EC-NOTES.md` before going live.
