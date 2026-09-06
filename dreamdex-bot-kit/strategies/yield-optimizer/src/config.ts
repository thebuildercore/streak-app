/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import { loadEnv, WEIGHT_AT_ONE_SIGMA } from "@dreamdex-bot-kit/core";
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

function strOpt(key: string): string | undefined {
  const v = process.env[key];
  return v === undefined || v === "" ? undefined : v;
}

function bool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

export type YoMode = "quote" | "cancel" | "flatten";

function mode(key: string, fallback: YoMode): YoMode {
  const v = (process.env[key] ?? fallback).toLowerCase();
  if (v === "quote" || v === "cancel" || v === "flatten") return v;
  throw new Error(`${key}="${process.env[key]}" must be quote | cancel | flatten`);
}

/** Re-read mode each tick so operators can flip without restarting. */
export function readMode(): YoMode {
  return mode("YO_MODE", "quote");
}

/**
 * Resolve protocol σ in raw price units.
 * Prefer YO_SIGMA_RAW; else YO_SIGMA_TICKS × tickRaw (default 50 ticks).
 */
export function resolveSigmaRaw(tickRaw: bigint): bigint {
  const rawStr = process.env.YO_SIGMA_RAW;
  if (rawStr !== undefined && rawStr !== "") {
    try {
      const n = BigInt(rawStr);
      if (n <= 0n) throw new Error("must be > 0");
      return n;
    } catch (e) {
      throw new Error(`YO_SIGMA_RAW="${rawStr}" is not a positive integer: ${(e as Error).message}`);
    }
  }
  const ticks = num("YO_SIGMA_TICKS", 50);
  if (!(ticks > 0) || !Number.isInteger(ticks)) {
    throw new Error(`YO_SIGMA_TICKS="${ticks}" must be a positive integer`);
  }
  if (tickRaw <= 0n) throw new Error("tickRaw must be > 0 to derive σ from YO_SIGMA_TICKS");
  return tickRaw * BigInt(ticks);
}

export const config = {
  symbol: str("YO_SYMBOL", "SOMI:USDso"),
  /** Minimum Gaussian W to treat a quote as yield-eligible (≈1σ default). */
  minWeight: num("YO_MIN_WEIGHT", WEIGHT_AT_ONE_SIGMA),
  /** Floor half-spread in bps (Avellaneda half-spread uses max of this and k·σ_vol). */
  halfSpreadBps: num("YO_HALF_SPREAD_BPS", 5),
  /** Risk aversion γ in reservation price r = mid − q·γ·σ_vol²·mid. */
  gamma: num("YO_GAMMA", 0.5),
  /** Volatility multiplier for half-spread. */
  kVol: num("YO_K_VOL", 2.0),
  /** Trailing mid samples for realized vol σ (Avellaneda, not protocol σ). */
  volLookback: num("YO_VOL_LOOKBACK", 60),
  notionalUsdso: num("YO_NOTIONAL_USDSO", 20),
  targetInventoryUsdso: num("YO_TARGET_INVENTORY_USDSO", 0),
  maxInventoryUsdso: num("YO_MAX_INVENTORY_USDSO", 100),
  requoteTriggerBps: num("YO_REQUOTE_TRIGGER_BPS", 3),
  requoteCooldownMs: num("YO_REQUOTE_COOLDOWN_MS", 2_000),
  refreshIntervalMs: num("YO_REFRESH_INTERVAL_MS", 5_000),
  maxBookSpreadBps: num("YO_MAX_BOOK_SPREAD_BPS", 50),
  /** Rolling mark-out kill threshold (bps adverse); 0 disables. */
  maxToxicBps: num("YO_MAX_TOXIC_BPS", 30),
  staleMs: num("YO_STALE_MS", 15_000),
  minGasSomi: num("YO_MIN_GAS_SOMI", 0.05),
  /** If base inventory (quote terms) exceeds this, IOC-sell excess. 0 = off. */
  flattenAboveUsdso: num("YO_FLATTEN_ABOVE_USDSO", 0),
  flattenCrossBps: num("YO_FLATTEN_CROSS_BPS", 2),
  expireMs: num("YO_EXPIRE_MS", 60 * 60_000),
  dryRun: bool("DRY_RUN", true),

  tradesCsv: strOpt("YO_TRADES_CSV"),
  midsCsv: strOpt("YO_MIDS_CSV"),
  yieldCsv: strOpt("YO_YIELD_CSV"),

  /** Optional APR estimate: pool size (USDso) per settlement run. */
  poolUsdso: numOpt("YO_POOL_USDSO"),
  /** Optional APR estimate: settlement interval seconds. */
  settleSec: numOpt("YO_SETTLE_SEC"),
};

export type Config = typeof config;
