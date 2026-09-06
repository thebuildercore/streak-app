/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// Settlement: what your outcome tokens are worth once a market resolves, and how
// to turn them back into collateral.
//
// Two things people get wrong here:
//   1. The winner does NOT redeem 1:1 — the venue skims a one-time settlement
//      fee, so a winning token pays `1 − fee`. We use the SDK's own
//      `estPayoutFor` so the fee math is never hand-rolled.
//   2. A VOIDED market pays BOTH sides 0.5, and there is no winning outcome to
//      infer. The unified `exchange.redeem()` derives the outcome from
//      `winningOutcome`, which is meaningless on a void — so we go through the
//      raw trader with an EXPLICIT `outcomeIdx` instead.

import { estPayoutFor, marketKey, binarySettlementAbi, type MarketOnchain, type UnifiedMarket } from "@somnia-chain/markets-sdk";
import { parseAbi, type Hex } from "viem";
import { assertTxOk, type EcContext } from "./exchange.js";

/** YES is outcome 0, NO is outcome 1 — the order the contracts use. */
export type OutcomeIdx = 0 | 1;
export const outcomeIdxOf = (outcome: "YES" | "NO"): OutcomeIdx => (outcome === "YES" ? 0 : 1);

// Minimal read ABI for the pool's frozen fee params (the SDK doesn't surface
// this read on its client). Rates are bps × 1000 on-chain.
const binaryPoolParamsAbi = parseAbi([
  "function getBinaryPoolParams() view returns ((address collateralToken, address market, address outcomeToken, uint256 yesId, uint256 noId, uint256 oneCollateral, uint256 setBacking, address feeRecipient, uint256 makerFeeBpsTimes1k, uint256 takerFeeBpsTimes1k, uint256 maxBuilderFeeBpsTimes1k, uint256 settlementFeeBpsTimes1k, address settlement, uint64 marketNonce, bool finalized))",
]);

/**
 * The venue's one-time settlement fee in bps (1 = 0.01%). 0 when unset.
 *
 * Source order:
 *   1. The indexer's `MarketVenue` row (one cheap query — the common case).
 *   2. On-chain fallback when that row is missing or pre-dates the fee plumbing
 *      (its fee fields are null then): a FINALIZED market reads its settlement
 *      record (correct even after the pool was recycled onto a newer market);
 *      a live one reads the fee frozen into its own pool.
 * Pass the market's `onchain` snapshot if you already hold one — it saves the
 * fallback a `getMarketOnchain` round-trip.
 */
export async function settlementFeeBps(
  ctx: EcContext,
  market: UnifiedMarket,
  onchain?: MarketOnchain,
): Promise<bigint> {
  if (market.info.marketType !== "BINARY") return 0n;
  try {
    const fees = await ctx.exchange.client.getMarketFees(market.info.marketId);
    const raw = fees?.settlementFeeBps;
    if (raw != null) return BigInt(raw);
  } catch {
    // indexer unreachable — fall through to chain
  }
  const oc = onchain ?? (await ctx.exchange.client.getMarketOnchain(market.info.marketId as Hex));
  const pc = ctx.exchange.client.getViemClient();
  const settlement = ctx.config.addresses.binarySettlement;
  if (oc.finalized && settlement) {
    // The settlement record froze the fee at finalize — the pool may already be
    // serving a different market (recycling), so don't ask the pool.
    const rec = (await pc.readContract({
      address: settlement,
      abi: binarySettlementAbi,
      functionName: "getSettlement",
      args: [marketKey(oc.yesId)],
    })) as { settlementFeeBpsTimes1k: bigint };
    return rec.settlementFeeBpsTimes1k / 1000n;
  }
  if (oc.finalized) {
    // Finalized, but no settlement address to ask. Reading the pool here would
    // answer with whatever market is using it NOW — pools are recycled across
    // windows — and quietly hand back another market's fee. Better to stop.
    throw new Error(
      "settlementFeeBps: market is finalized and BINARY_SETTLEMENT is unset. " +
        "The pool has likely been recycled, so its params are a different market's. " +
        "Set BINARY_SETTLEMENT in .env.",
    );
  }
  const params = (await pc.readContract({
    address: oc.pool,
    abi: binaryPoolParamsAbi,
    functionName: "getBinaryPoolParams",
  })) as { settlementFeeBpsTimes1k: bigint };
  return params.settlementFeeBpsTimes1k / 1000n;
}

/**
 * What `amount` (raw outcome-token units) of `outcome` redeems for, in raw
 * collateral units. Winner pays `1 − fee`, loser 0, voided 0.5 (never a fee).
 */
export function estimatePayout(args: {
  onchain: MarketOnchain;
  outcome: OutcomeIdx;
  amount: bigint;
  feeBps: bigint;
}): bigint {
  const { onchain, outcome, amount, feeBps } = args;
  // Guard: on an UNRESOLVED market the on-chain `winningOutcome` reads 0 (the
  // argmax of an empty payout vector), which estPayoutFor would score as a YES
  // win. Nothing is claimable before resolution/void — say so explicitly.
  if (!onchain.isResolved && !onchain.isVoided) return 0n;
  return estPayoutFor({
    marketId: "",
    pool: onchain.pool,
    outcomeIdx: outcome,
    amount,
    winningOutcome: onchain.isVoided ? null : onchain.winningOutcome,
    voided: onchain.isVoided,
    status: onchain.isResolved || onchain.isVoided ? "Resolved" : "Trading",
    settlementFeeBps: feeBps,
  });
}

/** Which outcomes still have something to claim, given what the signer holds. */
export function claimableOutcomes(
  onchain: MarketOnchain,
  held: { yes: bigint; no: bigint },
): OutcomeIdx[] {
  if (onchain.isVoided) {
    // Both sides refund at 0.5 — claim whichever you actually hold.
    return ([0, 1] as OutcomeIdx[]).filter((i) => (i === 0 ? held.yes : held.no) > 0n);
  }
  if (!onchain.isResolved) return [];
  const win = onchain.winningOutcome === 0 ? 0 : 1;
  return (win === 0 ? held.yes : held.no) > 0n ? [win as OutcomeIdx] : [];
}

/**
 * Redeem one outcome for collateral. Goes through the raw trader so the outcome
 * is explicit — required for voided markets, and harmless otherwise. The module
 * finalizes the market first if it hasn't been finalized yet.
 */
export async function redeemOutcome(
  ctx: EcContext,
  market: UnifiedMarket,
  onchain: MarketOnchain,
  outcome: OutcomeIdx,
  amount: bigint,
) {
  if (market.info.marketType !== "BINARY") throw new Error("not a binary market");
  const res = await ctx.exchange.trader.redeem({
    marketId: market.info.marketId as Hex,
    market: onchain.marketAddress,
    outcomeToken: onchain.outcomeToken,
    outcomeIdx: outcome,
    amount,
  });
  assertTxOk(res, `redeem(${market.symbol ?? market.info.marketId}, outcome ${outcome})`);
  return res;
}
