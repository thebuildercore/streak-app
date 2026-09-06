/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// The signal half of oracle-follow: where the underlying price comes from, how
// recent history is kept, and how a view becomes a probability.
//
// The one thing to internalise: the UNDERLYING price (where BTC actually is)
// and the MARKET price (what the YES leg trades at) are different numbers.
// `fetchOrderBook` gives you the second one. Feeding it back into a directional
// signal is circular — you'd be chasing the book you're about to cross. Only
// the price feed knows the first one.

import type { EcContext } from "@dreamdex-bot-kit/ec-core";

export type Asset = "BTC" | "ETH";

/** One underlying-price observation, human units. */
export interface Spot {
  /** Price in quote units, e.g. 63494.76 for BTC. */
  price: number;
  /** When the ORACLE wrote it (ms). Not when we read it — see `maxAgeMs`. */
  at: number;
}

export interface SpotReader {
  /** Latest underlying spot, or null when the feed has no fresh observation. */
  getSpot(asset: Asset): Promise<Spot | null>;
}

/**
 * The default reader: the SDK's price-feed indexer, which serves the on-chain
 * EMA oracle's spot + mark per asset. `m.info.asset` ("BTC"/"ETH") is already
 * the feed's key, so the market row hands us the lookup for free.
 *
 * Needs `config.priceFeed` (ec-core sets it from the bundled testnet endpoint
 * or PRICE_FEED_URL). Without it the SDK throws on the first read.
 */
export function sdkSpotReader(ctx: EcContext): SpotReader {
  return {
    async getSpot(asset) {
      const px = await ctx.exchange.fetchPrice(asset);
      if (!px || !(px.price > 0)) return null;
      return { price: px.price, at: px.timestamp };
    },
  };
}

/**
 * Fallback reader: any public REST ticker. Kept as a seam for running against a
 * network with no price-feed endpoint bundled (mainnet today), and as the
 * obvious place to plug a different source. The oracle write time isn't
 * knowable here, so it stamps read time instead.
 */
export function restSpotReader(cfg: {
  urlFor: (a: Asset) => string;
  parse: (json: unknown) => number;
}): SpotReader {
  return {
    async getSpot(asset) {
      const res = await fetch(cfg.urlFor(asset));
      if (!res.ok) throw new Error(`spot ${asset} HTTP ${res.status}`);
      const price = cfg.parse(await res.json());
      return price > 0 ? { price, at: Date.now() } : null;
    },
  };
}

/**
 * Per-asset ring of recent observations, so a cycle can ask "where was BTC a
 * minute ago?" and "how much has it been moving?". Sized by whichever of those
 * needs more history — measuring volatility needs far more than one lookback
 * window — and old samples age out.
 *
 * Keyed by ASSET, not by market: one BTC feed serves every BTC market, and the
 * history has to survive a market rolling over (these windows are ~5 minutes).
 */
export class SpotHistory {
  private readonly samples = new Map<string, Spot[]>();
  private readonly retainMs: number;

  constructor(
    private readonly windowMs: number,
    private readonly maxAgeMs: number,
    /** How much history to keep. Momentum needs two windows; measuring
     *  volatility needs many more samples than that, so keep the longer of the
     *  two rather than sizing the ring for momentum alone. */
    retainMs = windowMs * 2,
  ) {
    this.retainMs = Math.max(retainMs, windowMs * 2);
  }

  /** Record an observation, dropping anything past the retention horizon. */
  record(asset: string, s: Spot): void {
    const arr = this.samples.get(asset) ?? [];
    // The feed can re-serve the same block; don't let duplicates pad the ring.
    if (arr.length > 0 && arr[arr.length - 1]!.at === s.at) return;
    arr.push(s);
    const cutoff = s.at - this.retainMs;
    while (arr.length > 0 && arr[0]!.at < cutoff) arr.shift();
    this.samples.set(asset, arr);
  }

  /**
   * Realized volatility of the underlying over ONE lookback window, measured
   * from the samples we already collect.
   *
   * This replaces a fixed `OF_EXPECTED_MOVE` once enough samples exist — confidence
   * scales with measured move size, and a wrong guess skews every probability.
   *
   * Variance accumulates linearly in time, so sum squared sample-to-sample
   * returns, divide by the time they SPAN, and scale to one window.
   *
   * Dividing by elapsed time rather than by sample count is what makes this
   * survive a slow oracle. The feed updates far less often than the bot polls it,
   * so most consecutive samples repeat a price; those contribute nothing to the
   * sum but still advance the clock, and each real jump arrives carrying its
   * whole move at once. The two effects cancel, leaving the estimate insensitive
   * to how the moves happen to land across polls. Simulated against a feed
   * updating six times slower than the poll rate, this and an estimator built
   * from whole-window strides agree to within 1%, and this one needs one window
   * of history where strides need six.
   */
  volatility(asset: string, minSamples = 12): number | null {
    const arr = this.samples.get(asset);
    if (!arr || arr.length < minSamples + 1) return null;

    let sumSq = 0;
    let elapsed = 0;
    let n = 0;
    for (let i = 1; i < arr.length; i++) {
      const a = arr[i - 1]!;
      const b = arr[i]!;
      const dt = b.at - a.at;
      if (dt <= 0 || !(a.price > 0) || !(b.price > 0)) continue;
      const r = Math.log(b.price / a.price);
      sumSq += r * r;
      elapsed += dt;
      n++;
    }
    if (n < minSamples || elapsed <= 0) return null;

    const sigma = Math.sqrt((sumSq / elapsed) * this.windowMs);
    return sigma > 0 ? sigma : null;
  }

  /**
   * Return over the lookback window, or null while still warming up.
   *
   * Warming up means either too little history to span the window, or a feed
   * that has stalled (the oracle stopped writing). A stalled feed keeps
   * returning its last value, which reads as "zero momentum" rather than "no
   * data" — so age it out explicitly instead of trading on a frozen price.
   */
  momentum(asset: string, now: number): { spot: number; r: number } | null {
    const arr = this.samples.get(asset);
    if (!arr || arr.length < 2) return null;

    const latest = arr[arr.length - 1]!;
    if (now - latest.at > this.maxAgeMs) return null;

    const target = latest.at - this.windowMs;
    if (arr[0]!.at > target) return null; // history doesn't reach back far enough

    let lag = arr[0]!;
    for (const s of arr) {
      if (s.at <= target) lag = s;
      else break;
    }
    if (!(lag.price > 0)) return null;
    return { spot: latest.price, r: (latest.price - lag.price) / lag.price };
  }
}

const clamp = (p: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, p));

/** sqrt(2/π) — the tanh coefficient whose slope at zero matches the Gaussian's. */
const NORMAL_CDF_K = Math.sqrt(2 / Math.PI);

export interface ModelInput {
  /** Latest underlying spot, human units. */
  spot: number;
  /** Return over the lookback window. */
  r: number;
  /** The market's strike in the SAME units as `spot`, or null if unreadable. */
  strike: number | null;
  /** Milliseconds until the market expires, or null if unreadable. */
  timeToExpiryMs: number | null;
  /** The lookback window `r` was measured over. */
  windowMs: number;
  /** Return magnitude the bot treats as a "full" move over one window. */
  expectedMove: number;
  /** Momentum tilt per unit of return. */
  sensitivity: number;
  model: "strike" | "momentum";
  /**
   * The MARKET's own P(up): the YES mid, or on a one-sided book the single
   * quote available (see `marketBoundUp`). Both models are scored against it,
   * and the relative model anchors to it. Required: a directional bot with no
   * reference point cannot tell "this leg is cheap" from "I misread the
   * question".
   *
   * Note the bias when it comes from one side only — an ask sits above the true
   * mid, so `tilt` is understated and leg selection leans toward NO. That is
   * conservative for the leg being crossed, but it is a bias, not noise.
   */
  anchorUp: number;
}

export interface Estimate {
  /** The model's P(up), the probability the YES leg pays out. */
  pUp: number;
  /**
   * Signed gap to the market's P(up). Positive means the model is MORE bullish
   * than the market, which makes YES the leg the market underprices.
   *
   * This — not `pUp` against 0.5 — is what the bot trades. Picking the leg off
   * `pUp > 0.5` breaks the moment a market is priced away from even money: with
   * YES at 0.75 and a bearish signal, `pUp` is still ~0.73, so the naive rule
   * reads "bullish" and buys the leg the signal was against.
   */
  tilt: number;
  /** True when `pUp` is the market's level plus a tilt, not a standalone fair value. */
  anchored: boolean;
}

/**
 * The model's probability that the market resolves UP (the YES leg pays out),
 * together with how far that sits from the market's own view.
 *
 * Two models, because the honest answer depends on what the market row gives us.
 *
 * `strike` — these markets ask "is ASSET at or above STRIKE at expiry", and the
 * strike differs per market. Two BTC markets sharing one expiry can resolve
 * OPPOSITE ways purely because their strikes straddle the settlement price, so
 * a per-asset momentum number cannot tell them apart: it hands both the same
 * probability and is guaranteed to misprice one. This model asks how far spot
 * sits from THIS market's strike, relative to how far price could plausibly
 * travel in the time left, and treats momentum as drift on top. It is the only
 * model here that produces a standalone fair value.
 *
 * `momentum` — market mid plus `sensitivity × r`. Used when no settlement
 * reference resolves (`OF_MODEL=momentum` or automatic fallback).
 */
export function estimateUp(i: ModelInput): Estimate {
  const PMIN = 0.05;
  const PMAX = 0.95;

  const strikeAware = i.model === "strike" && i.strike !== null && i.timeToExpiryMs !== null;
  if (!strikeAware) {
    const anchor = clamp(i.anchorUp, PMIN, PMAX);
    const raw = i.sensitivity * i.r;
    // Clamp the TILT, not the result. Clamping `anchor + raw` into range can
    // shorten the tilt past zero and flip the trade to the wrong leg near the
    // bounds; capping the tilt by the room available cannot change its sign.
    const room = raw > 0 ? PMAX - anchor : anchor - PMIN;
    const tilt = Math.sign(raw) * Math.min(Math.abs(raw), Math.max(room, 0));
    return { pUp: anchor + tilt, tilt, anchored: true };
  }

  // Lookback windows still to run. Floored so the final ticks before expiry
  // don't divide the scale to zero and saturate every quote.
  const horizons = Math.max(i.timeToExpiryMs! / i.windowMs, 0.05);

  const moneyness = (i.spot - i.strike!) / i.strike!;
  // Momentum is diffusive, not ballistic: it decays, so a one-window return is
  // NOT a per-window rate to run forward. Extrapolating it linearly (`r *
  // horizons`) projects an 8bp minute into a 58% move over twelve hours and
  // saturates the tanh on noise — the further out the market, the more certain
  // the model claimed to be. Scaling by the same sqrt as the plausible move
  // leaves momentum's share of `z` at r/expectedMove, independent of horizon:
  // "how big was this move next to a typical one".
  const drift = i.r * Math.sqrt(horizons);
  // Price wanders ~sqrt(time), so the plausible move grows with the root of the
  // horizon rather than linearly.
  const scale = i.expectedMove * Math.sqrt(horizons);
  if (!(scale > 0)) return { pUp: i.anchorUp, tilt: 0, anchored: false };

  // tanh stands in for the normal CDF with k = sqrt(2/π) so slope at zero matches φ(0).
  const z = (moneyness + drift) / scale;
  const pUp = clamp(0.5 + 0.5 * Math.tanh(NORMAL_CDF_K * z), PMIN, PMAX);
  return { pUp, tilt: pUp - i.anchorUp, anchored: false };
}

/**
 * A stand-in for the market's P(up) when the book is ONE-SIDED.
 *
 * A single quote bounds fair value rather than locating it — an ask caps it, a
 * bid floors it — so this is deliberately not called a mid. It exists so that a
 * model with its own level (one that resolved the market's settlement price) can
 * still be sanity-checked against *something* on a book too thin to have a mid,
 * instead of the bot either refusing to trade or trading unchecked.
 */
export function marketBoundUp(book: { bids: [number, number][]; asks: [number, number][] }): number | null {
  const p = book.asks[0]?.[0] ?? book.bids[0]?.[0];
  return p !== undefined && p > 0 && p < 1 ? p : null;
}

/**
 * The market's own P(up) from the YES book: the mid, which is its fair-value
 * estimate stripped of the spread you'd pay to cross.
 *
 * Null on a one-sided book — with only one side quoted there is no mid. What to
 * do about that depends on the model: momentum mode needs a mid and refuses if
 * there is none; strike mode with a resolved reference can use `marketBoundUp`.
 */
export function marketImpliedUp(book: { bids: [number, number][]; asks: [number, number][] }): number | null {
  const bid = book.bids[0]?.[0];
  const ask = book.asks[0]?.[0];
  if (bid === undefined || ask === undefined) return null;
  const mid = (bid + ask) / 2;
  return mid > 0 && mid < 1 ? mid : null;
}

/**
 * A market row's strike, rescaled into the same units as the price feed.
 *
 * The two live on DIFFERENT scales: the feed reports 18-decimal human numbers
 * (63494.76) while `strike` is a raw integer string in the oracle's own scale
 * (6352741 = 63527.41, i.e. cents). Nothing in the row states that scale, so
 * infer it by picking the power of ten that lands the strike nearest to spot —
 * these are short-dated windows struck around the money, so the right scale is
 * never ambiguous by more than a factor of ten.
 */
export function scaleStrike(rawStrike: string | undefined, spot: number): number | null {
  if (!rawStrike || !(spot > 0)) return null;
  const raw = Number(rawStrike);
  if (!Number.isFinite(raw) || raw <= 0) return null;

  let best: number | null = null;
  let bestErr = Infinity;
  for (let exp = 0; exp <= 18; exp++) {
    const candidate = raw / 10 ** exp;
    const err = Math.abs(Math.log(candidate / spot));
    if (err < bestErr) {
      bestErr = err;
      best = candidate;
    }
  }
  // A strike more than ~2x away from spot means we guessed the scale wrong (or
  // the row is junk); refuse rather than trade a fabricated number.
  return bestErr <= Math.log(2) ? best : null;
}

/** The level a market settles against, and where it came from. */
export interface Reference {
  /** Reference price in the same units as spot. */
  price: number;
  /** `strike` — fixed-strike market. `opening` — up/down against its own open. */
  kind: "strike" | "opening";
}

/**
 * What the market actually resolves AGAINST. There are two kinds of binary
 * market here and only one of them wears its question in the symbol:
 *
 *   • FIXED STRIKE — "is BTC at or above 63897.60 at expiry". The level is the
 *     row's `strike`, e.g. `BTC-6389760-04AUG26-1540`.
 *   • UP/DOWN — "does BTC close at or above its OPENING price". The row carries
 *     `strike = 0`, e.g. `BTC-0-05AUG26`, and the level is the market's opening
 *     price, which lives on the oracle's REFERENCE question rather than the
 *     market row.
 *
 * Reading `strike = 0` as "unreadable" is the trap: it makes every up/down
 * market look unpriceable and leaves the bot with no fair value on precisely the
 * markets that carry the liquidity. The opening price is one indexer call away.
 *
 * Cached because a resolved opening price never changes. A null is NOT cached —
 * a market whose reference question hasn't been answered yet will get one.
 */
export interface ReferenceReader {
  referenceFor(m: { marketId?: string; strike?: string }, spot: number): Promise<Reference | null>;
}

export function referenceReader(ctx: EcContext): ReferenceReader {
  const openings = new Map<string, string>();

  return {
    async referenceFor(m, spot) {
      const fixed = scaleStrike(m.strike, spot);
      if (fixed !== null) return { price: fixed, kind: "strike" };

      const id = m.marketId;
      if (!id) return null;

      let raw = openings.get(id);
      if (raw === undefined) {
        const answers = await ctx.exchange.client.getOpeningPrices([id]);
        const found = answers[id.toLowerCase()] ?? answers[id] ?? null;
        if (found === null) return null; // not answered yet — ask again next cycle
        openings.set(id, found);
        raw = found;
      }

      const opening = scaleStrike(raw, spot);
      return opening === null ? null : { price: opening, kind: "opening" };
    },
  };
}
