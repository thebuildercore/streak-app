# Treasury

Idle-yield **maker** bot for DreamDEX. Parks deployable quote capital (USDso) as
two-sided **PostOnly** quotes so resting maker / [proximity yield](https://docs.dreamdex.io/trading/common/yield-algorithm)
can accrue on-chain.

This is the **execution bot** for the Reserve “idle yield sweep” narrative — not the
Reserve Next.js demo, squad simulation, or mock RWA ledger. Spot trading context:
[docs.dreamdex.io spot](https://docs.dreamdex.io/trading/readme-1/spot).

## The idea

1. Treat wallet **USDso** as idle cash.
2. Keep `TREASURY_MIN_IDLE_USDSO` unquoted as a buffer.
3. Deploy `TREASURY_DEPLOY_RATIO` of the remainder (optionally capped) as bid/ask size.
4. Quote around mid at `±TREASURY_SPREAD_BPS / 2` with PostOnly; requote only when mid
   drifts past `TREASURY_REQUOTE_TRIGGER_BPS` (same gas-efficient pattern as
   [market-making](../market-making)).
5. Optionally (mainnet) IOC-convert a fixed amount of idle **USDC.e → USDso** when
   USDso is below the buffer — then keep quoting.

## Run

```bash
npm install                       # from the repo root, once
cp .env.example .env              # set PRIVATE_KEY, keep NETWORK=testnet
# or: cp strategies/treasury/.env.example strategies/treasury/.env
npm run dev -w treasury           # DRY_RUN=true by default — logs quotes, sends nothing
```

Set `DRY_RUN=false` when you're ready to place real orders. Start small on testnet.

**Cancel / redeem deployed quotes:**

```bash
TREASURY_MODE=cancel npm run start -w treasury
# or TREASURY_MODE=flatten — cancels open quotes and idles until mode returns to quote
```

## Configuration

| Env | Meaning |
| --- | --- |
| `SYMBOL` | Maker market (default `SOMI:USDso`). |
| `DRY_RUN` | Log intended places/cancels/refills without sending txs (default `true`). |
| `TREASURY_DEPLOY_RATIO` | Fraction of (idle − buffer) to deploy as notional. |
| `TREASURY_MIN_IDLE_USDSO` | USDso kept unquoted. |
| `TREASURY_SPREAD_BPS` | Full spread in bps (split half each side of mid). |
| `TREASURY_REQUOTE_TRIGGER_BPS` | Mid must move this far before cancel/replace. |
| `TREASURY_TICK_MS` | Poll interval (WS still drives most requotes). |
| `TREASURY_MODE` | `quote` (default), `cancel`, or `flatten`. |
| `TREASURY_MAX_NOTIONAL_USDSO` | Optional hard cap on deployable notional. |

### Optional refill (USDC.e → USDso)

Off by default. On **mainnet**, enable to top up USDso from idle USDC.e via a single
slippage-bounded IOC sell on `USDC.e:USDso`. The IOC itself is not yield — it only
funds the maker loop. The kit address book has no `USDC.e:USDso` on testnet; with
swap enabled there the bot logs once and disables refill for the process.

| Env | Meaning |
| --- | --- |
| `TREASURY_SWAP_ENABLED` | Opt-in refill (default `false`). |
| `TREASURY_SWAP_MARKET` | Conversion pool (default `USDC.e:USDso`). |
| `TREASURY_SWAP_AMOUNT` | Fixed USDC.e size per refill. |
| `TREASURY_SWAP_MAX_SLIPPAGE_BPS` | IOC price bound below best bid. |
| `TREASURY_SWAP_COOLDOWN_MS` | Min time between refill attempts. |

Refill runs on start and on poll ticks (cooldown-gated), only when mode is `quote`
and wallet USDso is below `TREASURY_MIN_IDLE_USDSO`.

## Non-goals

No Next.js UI, SSE dashboard, squad teammates, fake proximity tiers, simulated yield
pool accounting, Event Contracts SDK, or LLM narration.

## How it maps to the core

Everything DreamDEX-specific lives in [`@dreamdex-bot-kit/core`](../../packages/core):
`Pool.place` / `Pool.cancel` (modern `placeOrder` path), `DreamDexWs`, `ORDER_TYPE.PostOnly`
for quotes and `ImmediateOrCancel` for optional refill. This package is quoting + capital
rules only.

## Backtest

```bash
npm run backtest -- run treasury --symbol SOMI:USDso --interval 5m --days 7 --quiet
```

Refill is disabled in backtest (live/mainnet path only). The adapter forces
`minIdleUsdso=0` so the default `--quote-usdso 1000` actually deploys; override with
`--set minIdleUsdso=…` to exercise the buffer rule offline.

See [docs/backtesting.md](../../docs/backtesting.md).

## Disclaimer

Please read the [Legal Disclaimer](../../DISCLAIMER.md) before using this bot.
