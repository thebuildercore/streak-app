/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
/** W = 1 at the mid; ≈0.60653066 at |ΔP| = σ. */
export declare const WEIGHT_AT_ONE_SIGMA: number;
/**
 * Gaussian proximity weight for a resting order vs the book mid.
 * Returns 0 when σ ≤ 0 (undefined band). At the mid, returns 1.
 */
export declare function proximityWeight(pOrderRaw: bigint, pMidRaw: bigint, sigmaRaw: bigint): number;
/**
 * Absolute raw-price distance from mid at which W equals `minW` (0 < minW ≤ 1).
 * For minW = e^{-1/2} this is exactly σ. Returns 0n for invalid inputs.
 */
export declare function weightRadiusRaw(sigmaRaw: bigint, minW: number): bigint;
/** Accrue score for `dtSec` seconds at weight W and size `qty` (human base units). */
export declare function scoreIncrement(qty: number, W: number, dtSec: number): number;
export interface YieldBandDescription {
    sigmaRaw: bigint;
    minWeight: number;
    radiusRaw: bigint;
    /** Weight at mid, 1σ, 2σ, and at the minWeight radius. */
    weights: {
        atMid: number;
        atOneSigma: number;
        atTwoSigma: number;
        atMinWeight: number;
    };
}
/** Human-readable band summary for calibration / startup logs. */
export declare function describeYieldBand(sigmaRaw: bigint, minWeight?: number): YieldBandDescription;
/**
 * Snap a candidate raw price toward mid until W ≥ minWeight, without crossing
 * the opposite side. Always returns a **tick-aligned** price (bids round down,
 * asks round up — matching Pool.place) so a later alignToTick cannot push the
 * quote out of the yield band. Bids move up toward mid; asks move down. If even
 * the touch fails the weight floor, returns the aligned touch (caller decides).
 */
export declare function snapPriceToMinWeight(args: {
    candidateRaw: bigint;
    midRaw: bigint;
    sigmaRaw: bigint;
    minWeight: number;
    tickRaw: bigint;
    isBid: boolean;
    /** Best opposite side — bid must stay < bestAsk; ask must stay > bestBid. */
    oppositeRaw?: bigint;
}): bigint;
