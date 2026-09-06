/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// Optional USDC.e → USDso refill via a single slippage-bounded IOC sell on
// USDC.e:USDso (mainnet). Tops up quote inventory for the maker loop; does not
// itself earn proximity yield. Off by default (TREASURY_SWAP_ENABLED=false).

import {
  Pool,
  ORDER_TYPE,
  shiftBps,
  type ChainContext,
} from "@dreamdex-bot-kit/core";
import { readMode, type Config } from "./config.js";
import { walletQuote } from "./strategy.js";

export interface RefillState {
  /** Last attempt timestamp (ms); advanced even on dry-run / soft skips that should cool down. */
  lastAttemptAt: number;
  /** Once true, stop trying to load the swap market for this process. */
  marketUnavailable: boolean;
  swapPool?: Pool;
}

export function createRefillState(): RefillState {
  return { lastAttemptAt: 0, marketUnavailable: false };
}

/**
 * Attempt a fixed-size IOC sell of USDC.e for USDso when gates pass.
 * Safe to call every poll tick — internal cooldown / availability flags gate work.
 */
export async function maybeRefillUsDso(args: {
  ctx: ChainContext;
  quotePool: Pool;
  cfg: Config;
  state: RefillState;
  log: (msg: string, extra?: unknown) => void;
  /**
   * Idle USDso including resting bid notional when available. Falls back to
   * wallet balanceOf when omitted.
   */
  quoteIdle?: () => Promise<number>;
}): Promise<void> {
  const { ctx, quotePool, cfg, state, log } = args;

  if (!cfg.swapEnabled) return;
  if (readMode() !== "quote") return;
  if (state.marketUnavailable) return;
  if (Date.now() - state.lastAttemptAt < cfg.swapCooldownMs) return;

  // Only top up when maker-pool USDso (wallet + reserved bid) is below the buffer.
  const usdso = args.quoteIdle
    ? await args.quoteIdle()
    : await walletQuote(ctx, quotePool);
  if (usdso >= cfg.minIdleUsdso) return;

  if (!state.swapPool) {
    try {
      state.swapPool = await Pool.load(ctx, cfg.swapMarket);
    } catch (err) {
      state.marketUnavailable = true;
      log(
        `swap market "${cfg.swapMarket}" unavailable on this network — refill disabled`,
        (err as Error).message,
      );
      return;
    }
  }

  const swapPool = state.swapPool;
  const sourceBal = await swapPool.walletBase();
  if (sourceBal < cfg.swapAmount) {
    log(
      `refill skip: ${cfg.swapMarket} base bal ${sourceBal.toFixed(4)} < amount ${cfg.swapAmount}`,
    );
    state.lastAttemptAt = Date.now();
    return;
  }

  if (cfg.swapAmount < swapPool.minQty) {
    log(`refill skip: swap amount ${cfg.swapAmount} < minQty ${swapPool.minQty}`);
    state.lastAttemptAt = Date.now();
    return;
  }

  const { bestBid } = await swapPool.topOfBook();
  if (bestBid === undefined) {
    log("refill skip: no best bid on swap market");
    state.lastAttemptAt = Date.now();
    return;
  }

  const price = shiftBps(bestBid, -cfg.swapMaxSlippageBps);
  const qty = cfg.swapAmount;

  state.lastAttemptAt = Date.now();

  if (cfg.dryRun) {
    log(
      `[dry-run] refill sell ${qty.toFixed(4)} @ ≥${price.toFixed(6)} on ${cfg.swapMarket} ` +
        `(usdso=${usdso.toFixed(2)} < buffer=${cfg.minIdleUsdso})`,
    );
    return;
  }

  try {
    const res = await swapPool.place({
      isBid: false,
      price,
      qty,
      orderType: ORDER_TYPE.ImmediateOrCancel,
    });
    log(`refill sold ${qty.toFixed(4)} @ ≥${price.toFixed(6)} on ${cfg.swapMarket} tx=${res.txHash}`);
  } catch (err) {
    log("refill failed", (err as Error).message);
  }
}
