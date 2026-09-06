/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import { loadEnv } from "@dreamdex-bot-kit/core";
loadEnv();

function num(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${key}="${v}" is not a number`);
  return n;
}

function numOpt(key: string): number | undefined {
  const v = process.env[key];
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${key}="${v}" is not a number`);
  return n;
}

function str(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function bool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

export type TreasuryMode = "quote" | "cancel" | "flatten";

function mode(key: string, fallback: TreasuryMode): TreasuryMode {
  const v = (process.env[key] ?? fallback).toLowerCase();
  if (v === "quote" || v === "cancel" || v === "flatten") return v;
  throw new Error(`${key}="${process.env[key]}" must be quote | cancel | flatten`);
}

/** Re-read mode each tick so operators can flip without restarting. */
export function readMode(): TreasuryMode {
  return mode("TREASURY_MODE", "quote");
}

export const config = {
  /** Maker market. SOMI:USDso exists on both mainnet and testnet. */
  symbol: str("SYMBOL", "SOMI:USDso"),
  /** Fraction of (idle USDso − min buffer) to deploy as quote notional. */
  deployRatio: num("TREASURY_DEPLOY_RATIO", 0.6),
  /** Keep this much USDso unquoted as a cash buffer. */
  minIdleUsdso: num("TREASURY_MIN_IDLE_USDSO", 1000),
  /** Total quoted spread in bps (split half above / half below mid). */
  spreadBps: num("TREASURY_SPREAD_BPS", 12),
  /** Only requote once mid has moved this many bps. */
  requoteTriggerBps: num("TREASURY_REQUOTE_TRIGGER_BPS", 5),
  /** Soft inventory skew per 1× deployable notional of base imbalance, in bps. */
  inventorySkewBps: num("TREASURY_INVENTORY_SKEW_BPS", 4),
  /** Don't quote if the book's own spread is wider than this. */
  maxBookSpreadBps: num("TREASURY_MAX_BOOK_SPREAD_BPS", 50),
  /** Minimum wall-time between requotes, ms. */
  requoteCooldownMs: num("TREASURY_REQUOTE_COOLDOWN_MS", 2_000),
  /** Poll / refresh interval (also used for refill cooldown checks), ms. */
  tickMs: num("TREASURY_TICK_MS", 5_000),
  /** Resting order lifetime, ms. */
  expireMs: num("TREASURY_EXPIRE_MS", 60 * 60_000),
  /** Optional hard cap on deployable notional (USDso). */
  maxNotionalUsdso: numOpt("TREASURY_MAX_NOTIONAL_USDSO"),
  /** Log intended actions without sending any transaction. */
  dryRun: bool("DRY_RUN", true),

  // --- optional USDC.e → USDso refill (mainnet) ---
  swapEnabled: bool("TREASURY_SWAP_ENABLED", false),
  swapMarket: str("TREASURY_SWAP_MARKET", "USDC.e:USDso"),
  /** Fixed USDC.e amount per refill attempt. */
  swapAmount: num("TREASURY_SWAP_AMOUNT", 500),
  swapMaxSlippageBps: num("TREASURY_SWAP_MAX_SLIPPAGE_BPS", 10),
  swapCooldownMs: num("TREASURY_SWAP_COOLDOWN_MS", 300_000),
};

export type Config = typeof config;
