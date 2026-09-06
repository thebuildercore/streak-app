# ec-oracle-follow — event contracts directional taker

Prices a binary market from the underlying price feed — how far BTC/ETH sits from
the level the contract settles against, over the time remaining, against measured
volatility — and crosses only when the book offers the favoured leg below that.
When the settlement level can't be resolved, the bot uses the market mid plus a
momentum tilt (`OF_MODEL=momentum` or the automatic fallback).

```bash
npm start -w ec-oracle-follow   # DRY_RUN=true by default
```

A dry run prints its reasoning:

```
DRY BUY_YES 5 BTC-...#YES @ ~0.777 (opening 63475.60 vs spot 63820.00, vol 0.056% measured,
    r +0.0020, tilt +0.040 off market 0.765, pUp 0.805, fair 0.805, ask 0.775)
```

BTC is 0.54% above the price this market settles against, with volatility
measured at 5.6 bps per minute. That makes YES worth 0.805 against a market
pricing it at 0.765 and an ask of 0.775 — about 3c of edge, and it crosses.

> **The venue has more than one operator.** Set `OPERATOR_ID` (or `VENUE_ID`),
> or `activeMarkets` refuses to guess which venue you meant as soon as a second
> one lists live markets.

## Three things that shape the design

**A bearish view is `BUY_NO`, never `SELL_YES`.** Selling escrows the token being
sold, so a naked short is impossible on this venue. Because the bot only ever
buys, it needs no mint-a-pair seeding — skipping `seedInventory` is correct here,
not an omission.

**The DIRECTION comes from the underlying, never from the book.** `fetchOrderBook`
and the market's own mark tell you what the YES leg trades at; they say nothing
about where BTC is. Taking a *view* from them is circular — you'd be chasing the
book you're about to cross. The underlying comes from the SDK's price feed
(`exchange.fetchPrice("BTC")`), which serves the on-chain EMA oracle.

**The LEVEL comes from the contract when it can be read, and from the market when
it can't.** Resolve what the market settles against and there is a fair value to
compute from spot, time left, and volatility. If the reference does not resolve,
`OF_MODEL=momentum` (or the automatic fallback) uses the market mid plus a
momentum tilt — see **Signal**.

## The signal is still a placeholder

Resolving the reference and measuring volatility make the bot structurally sound,
not profitable. Short-window BTC momentum is one of the most arbitraged signals in
existence; against an attentive market maker reading the same oracle feed, its
edge is approximately zero — and past `OF_MAX_HORIZONS` it is muted entirely,
leaving the fair value resting on moneyness and measured volatility alone.

**The remaining open question is which side to believe.** With the reference
resolved and volatility measured, the strike model tracks Φ closely on live
inputs:

| market | spot vs opening | measured vol | σ over remaining life | z | model | Φ(z) | book mid |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `BTC-0-05AUG26` | +0.847% | 0.0446%/min | 0.966% | 0.877 | 0.802 | 0.810 | **0.465** |
| `ETH-0-05AUG26` | +0.616% | 0.0511%/min | 1.106% | 0.557 | 0.709 | 0.711 | **0.485** |

The books say roughly a coin flip on contracts whose underlying is already most
of a percent above the level they settle against. **No volatility assumption
reconciles that** — under a driftless model, spot above the reference cannot
produce a probability below 0.5, at any σ. So either those quotes are not
tracking the underlying at all, which is unsurprising on a testnet this thin, or
the reference is not what `getOpeningPrices` reports. The bot cannot distinguish
those from the inside, so `OF_MAX_DISAGREEMENT` muzzles it — which is the guard
doing exactly its job. Confirm the settlement reference against a resolved market
before widening that ceiling.

The version of this strategy that makes money is a **staleness** play: you profit
when the underlying moves and the book hasn't caught up yet — BTC jumps 30 bps
and the YES quote is still sitting where it was. That's a latency and attention
edge against slow or absent makers, not a forecasting edge.

Everything around the signal — the edge gate, risk limits, IOC crossing, leg
selection (via **tilt**, not `pUp > 0.5`), on-chain status gating — is the part
worth copying. Swap `estimateUp` in `signal.ts` for a real forecast and the rest
holds.

## What the market actually asks

There are two kinds of binary market here, and only one of them wears its
question in the symbol:

| kind | symbol | settles against | where the level lives |
| --- | --- | --- | --- |
| fixed strike | `BTC-6389760-04AUG26-1540` | a fixed price | the row's `strike` |
| up/down | `BTC-0-05AUG26` | its own **opening price** | the oracle's reference question |

**Reading `strike = 0` as "unreadable" is the trap.** It isn't missing data — it
means *"does BTC close at or above where it opened"*, and the opening price is one
indexer call away via `getOpeningPrices`. Treat it as unreadable and every
up/down market looks unpriceable, which leaves the bot with no fair value on
exactly the markets carrying the liquidity. Measured on the live venue: every
market on operators 1 and 2 reports `strike = 0`, and operator 2 is where the
two-sided books are.

So `referenceFor` resolves the settlement level per market — the symbol strike
when it's fixed, the opening price when it isn't — and caches it, since a
resolved opening price never changes. With that level in hand the bot has a
genuine standalone fair value: how far spot sits from the reference, over how
long, against how much the underlying actually moves.

## Signal

Each cycle samples the underlying, keeps a short per-asset history, and measures
the return `r` over the lookback window.

The `strike` model prices against the resolved reference. Two BTC markets sharing
one expiry can resolve opposite ways when their references straddle the
settlement price, so a per-asset momentum number can't tell them apart — it would
hand both the same probability and misprice one.

`OF_MODEL=momentum` uses `fair(YES) = market mid + sensitivity × r` when no
reference resolves. Leg selection uses the **tilt** (model minus market), not
whether `pUp` is above 0.5.

**Normal CDF approximation.** `tanh` stands in for Φ with `k = √(2/π) ≈ 0.798`
(matching slope at zero), within ~0.018 of Φ over the useful range.

**Volatility is measured, not assumed.** `OF_EXPECTED_MOVE` is only a warm-up
fallback until `SpotHistory` has enough samples; `OF_MIN_VOL` floors the estimate
when the feed stalls.

**Momentum is diffusive, not ballistic.** Drift scales with `√horizons`, same as
the plausible move, so extrapolating a one-minute return linearly over hundreds of
windows does not dominate the z-score.

## The horizon gates momentum, not the market

A 60-second return says almost nothing about a market resolving in eight hours.
`OF_MAX_HORIZONS` (default 30, so 30 minutes at the 60s window) mutes the momentum
**term** past that horizon. Moneyness against a resolved reference still prices
long-dated markets. A market with neither momentum nor a resolved reference is
skipped.

## The edge band

Two knobs bracket every trade, and they pull in opposite directions on purpose.

`OF_EDGE` is the floor: the market must be at least this much cheaper than the
model before crossing is worth the spread.

`OF_MAX_DISAGREEMENT` is the ceiling: if the model is further than this from the
market's mid (or the one-sided bound when there is no mid), the bot refuses. A
very large gap on a liquid book usually means the model and the book disagree on
the question or inputs, not a free 25-cent edge.

The bot trades only in the band between the floor and ceiling. Set the ceiling to
`0` to disable it.

The heartbeat tells you which gate is holding it back:

```
idle · 2 tradable · flat · no edge ×2 · closest BTC-...#NO ref opening 63475.60 vol 0.056% tilt -0.016 fair 0.251 ask 0.245 (needs 0.024 more)
idle · 2 tradable · flat · model disagrees with market ×2 · ETH-...#NO model 0.300 vs market 0.055 (off by 0.245)
```

The `ref` and `vol` fields are there because when the fair value is wrong, it is
almost always one of those two that was wrong first.

## Risk is counted in direction, not in shares bought

YES and NO are not interchangeable risk. Equal amounts of both are a **complete
set**, which redeems for one collateral per set whichever way the market
resolves — no directional exposure at all. Only the imbalance between the legs is
a bet, so `OF_MAX_SHARES` and `OF_MAX_EXPOSURE` limit `|YES − NO|`, not shares
bought.

The difference is not cosmetic. A market holding 3 YES and 2 NO carries *one*
share of risk, but a counter that adds up purchases reads five and stops trading
a position that has largely neutralised itself — while the offsetting part sits
there as collateral locked until expiry, earning nothing. `position.ts` owns this
arithmetic so the limits can be checked on their own.

**The bot will not buy the leg opposite one it already holds.** That doesn't
reverse a position, it mints complete sets: the legs cancel, the collateral locks
until expiry, and a spread was paid on each side to get there. Selling what you
hold is strictly better — on a 0.755/0.775 book, dumping a YES returns 0.753
immediately against a set that redeems for about 0.99 only at expiry — but this
bot has no sell path, so on a signal flip it stops rather than spending spread to
go nowhere. It sits that market out until expiry and says so once:

```
BTC-...: signal favours NO but we hold 3 YES — sitting out (buying the other leg would only mint sets)
```

That's the honest behaviour for a bot that can only open positions, and it's the
seam where exits would go. Position management proper — conviction-based sizing,
a hysteresis band wide enough to cover the ~0.024 round-trip cost on a 2-cent
book, mark-to-market, a stop — is deliberately not here yet. Reacting faster to a
placeholder signal mostly just pays the spread more often.

## Config

Repo-root `.env` (EC bots read it via `loadEnv`; there's no per-bot example file).

| env var | default | meaning |
| --- | --- | --- |
| `OF_INTERVAL_MS` | `8000` | cycle interval (one pass over active markets) |
| `OF_MOMENTUM_WINDOW_MS` | `60000` | lookback for the short-window return |
| `OF_MOMENTUM_THRESHOLD` | `0.0005` | minimum absolute return (5 bps) before momentum counts as a view |
| `OF_MODEL` | `strike` | `strike` (reference + vol) or `momentum` (mid + tilt) |
| `OF_EXPECTED_MOVE` | `0.0015` | warm-up fallback for per-window volatility; **measured** from spot history once enough samples exist |
| `OF_MIN_VOL` | `0.0002` | floor under measured volatility (a stalled feed measures as certainty) |
| `OF_VOL_WINDOW_MS` | `600000` | spot history retained for the volatility estimate |
| `OF_SENSITIVITY` | `20` | probability tilt per unit of return, applied on top of the market's mid |
| `OF_EDGE` | `0.03` | minimum edge (fair minus best ask) required to cross |
| `OF_MAX_DISAGREEMENT` | `0.1` | refuse to trade when the model is this far from the market's mid (`0` disables) |
| `OF_MAX_HORIZONS` | `30` | mute the momentum term past this many lookback windows from expiry (`0` disables) |
| `OF_MAX_SHARES` | `5` | max **net directional** shares per market |
| `OF_MAX_EXPOSURE` | `50` | max **net directional** shares across all markets |
| `OF_COOLDOWN_MS` | `30000` | minimum gap between takes on one market |
| `OF_NEAR_EXPIRY_STOP_MS` | 40% of the window | stop taking this long before expiry; set a number to fix it |
| `OF_MAX_SPOT_AGE_MS` | `15000` | reject spot older than this (stalled feed) |
| `PRICE_FEED_URL` | bundled on testnet | underlying price-feed endpoint |
| `VENUE_ID` / `OPERATOR_ID` | (unset) | **usually required** — see below |
| `DEPLOY_ENV` | `testnet` | `testnet` or `mainnet` |
| `DRY_RUN` | `true` | true logs intended takes and signs nothing |
| `PRIVATE_KEY` | (unset) | funded signer; must DIFFER from any quoter key (self-match is blocked) |

The bot stops taking before the venue can lock a market between your book
snapshot and the order send — a late IOC can revert and still come back as
`filled = 0` without throwing ([gotcha
#2](https://docs.dreamdex.io/developers/event-contracts/gotchas#id-2.-a-reverted-write-does-not-throw)).

That threshold **scales with the window**: 40% of the series interval, floored
at 30s and capped at 300s. So a 1h window stops 5 minutes out, a 5-minute window
stops 2 minutes out. A fixed value cannot serve both — 300s is right for
mainnet's 15m and 1h series but swallows a 5-minute window whole, and testnet
runs 5m and 10m today, so a fixed stop there means the bot never trades at all.
Set `OF_NEAR_EXPIRY_STOP_MS` to pin a fixed number of milliseconds if you would
rather choose it yourself.

### Venue scoping is usually required

Several operators run markets on the same deployment. When live markets span more
than one venue, `activeMarkets` refuses to guess and throws — set `VENUE_ID` or
`OPERATOR_ID` to pick yours. Don't hardcode it anywhere else: the venue moves on
relaunches.

### Mainnet

No price-feed endpoint is bundled for mainnet yet, so set `PRICE_FEED_URL`
explicitly there. Without it the bot refuses to start rather than trading blind.

## Handoff

This bot only opens positions. Redeeming winners after settlement is
`ec-settlement`'s job.

Read the sharp edges in [`docs/event-contracts.md`](../../docs/event-contracts.md) before going live.
