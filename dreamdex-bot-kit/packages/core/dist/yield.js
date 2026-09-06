/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
// DreamDEX collateral-yield proximity math.
//
// Protocol docs (https://docs.dreamdex.io/trading/common/yield-algorithm):
//   W = exp( −(P_order − P_mid)² / (2 σ²) )
// where P_order, P_mid, and σ are in the same raw on-chain integer price units.
// Score accrues as quantity × W × seconds while the order rests.
//
// This module is pure math — it does not fetch σ. Markets expose no documented
// REST field for σ today; operators set YO_SIGMA_RAW (or YO_SIGMA_TICKS) and
// calibrate with `describeYieldBand`.
import { alignToTick } from "./quant.js";
/** W = 1 at the mid; ≈0.60653066 at |ΔP| = σ. */
export const WEIGHT_AT_ONE_SIGMA = Math.exp(-0.5);
/**
 * Gaussian proximity weight for a resting order vs the book mid.
 * Returns 0 when σ ≤ 0 (undefined band). At the mid, returns 1.
 */
export function proximityWeight(pOrderRaw, pMidRaw, sigmaRaw) {
    if (sigmaRaw <= 0n)
        return 0;
    const d = Number(pOrderRaw - pMidRaw);
    const s = Number(sigmaRaw);
    if (!Number.isFinite(d) || !Number.isFinite(s) || s === 0)
        return 0;
    return Math.exp(-(d * d) / (2 * s * s));
}
/**
 * Absolute raw-price distance from mid at which W equals `minW` (0 < minW ≤ 1).
 * For minW = e^{-1/2} this is exactly σ. Returns 0n for invalid inputs.
 */
export function weightRadiusRaw(sigmaRaw, minW) {
    if (sigmaRaw <= 0n || !(minW > 0) || minW > 1)
        return 0n;
    if (minW === 1)
        return 0n;
    // |ΔP| = σ √(−2 ln minW)
    const radius = Number(sigmaRaw) * Math.sqrt(-2 * Math.log(minW));
    if (!Number.isFinite(radius) || radius < 0)
        return 0n;
    return BigInt(Math.round(radius));
}
/** Accrue score for `dtSec` seconds at weight W and size `qty` (human base units). */
export function scoreIncrement(qty, W, dtSec) {
    if (!(qty > 0) || !(W > 0) || !(dtSec > 0))
        return 0;
    return qty * W * dtSec;
}
/** Human-readable band summary for calibration / startup logs. */
export function describeYieldBand(sigmaRaw, minWeight = WEIGHT_AT_ONE_SIGMA) {
    const radiusRaw = weightRadiusRaw(sigmaRaw, minWeight);
    const mid = 0n;
    return {
        sigmaRaw,
        minWeight,
        radiusRaw,
        weights: {
            atMid: proximityWeight(mid, mid, sigmaRaw),
            atOneSigma: proximityWeight(sigmaRaw, mid, sigmaRaw),
            atTwoSigma: proximityWeight(sigmaRaw * 2n, mid, sigmaRaw),
            atMinWeight: proximityWeight(radiusRaw, mid, sigmaRaw),
        },
    };
}
/**
 * Snap a candidate raw price toward mid until W ≥ minWeight, without crossing
 * the opposite side. Always returns a **tick-aligned** price (bids round down,
 * asks round up — matching Pool.place) so a later alignToTick cannot push the
 * quote out of the yield band. Bids move up toward mid; asks move down. If even
 * the touch fails the weight floor, returns the aligned touch (caller decides).
 */
export function snapPriceToMinWeight(args) {
    const { candidateRaw, midRaw, sigmaRaw, minWeight, tickRaw, isBid, oppositeRaw } = args;
    if (tickRaw <= 0n || sigmaRaw <= 0n)
        return candidateRaw;
    // Align first so Pool.place's alignToTick cannot drift us out of band afterward.
    let price = alignToTick(candidateRaw, tickRaw, isBid ? "bid" : "ask");
    if (price <= 0n)
        price = tickRaw;
    // Cap iterations to avoid infinite loops on pathological inputs.
    const maxSteps = 10_000;
    for (let i = 0; i < maxSteps; i++) {
        if (proximityWeight(price, midRaw, sigmaRaw) >= minWeight)
            break;
        if (isBid) {
            const next = price + tickRaw;
            if (oppositeRaw !== undefined && next >= oppositeRaw)
                break;
            if (next > midRaw && oppositeRaw === undefined)
                break;
            price = next;
        }
        else {
            const next = price - tickRaw;
            if (oppositeRaw !== undefined && next <= oppositeRaw)
                break;
            if (next < midRaw && oppositeRaw === undefined)
                break;
            if (next <= 0n)
                break;
            price = next;
        }
    }
    return price;
}
//# sourceMappingURL=yield.js.map