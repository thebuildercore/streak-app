/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// Lightweight CSV writers matching the kit TradeRow shape (edge-analytics) plus
// mid and yield-score streams for offline net-score analysis.

import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export type TradeAction = "post" | "cancel" | "fill" | "reduce" | "error";

export interface TradeRow {
  ts: string;
  network: string;
  pool: string;
  side: "bid" | "ask" | "buy" | "sell";
  action: TradeAction;
  orderId?: string;
  price?: number;
  qty?: number;
  notional?: number;
  txHash?: string;
  note?: string;
}

const TRADE_HEADER =
  "ts,network,pool,side,action,orderId,price,qty,notional,txHash,note\n";
const MID_HEADER = "ts,mid\n";
const YIELD_HEADER = "ts,scoreRate,scoreAccrued,bidW,askW,estYieldUsdso,gasTxs\n";

const initialized = new Set<string>();

function escape(value: string | number | undefined): string {
  if (value === undefined || value === null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function ensureHeader(path: string, header: string): Promise<void> {
  if (initialized.has(path)) return;
  await mkdir(dirname(path), { recursive: true }).catch(() => undefined);
  try {
    const { promises: fs } = await import("node:fs");
    await fs.appendFile(path, "", { flag: "a" });
    const stat = await fs.stat(path);
    if (stat.size === 0) await fs.appendFile(path, header);
  } catch {
    /* best-effort */
  }
  initialized.add(path);
}

export async function appendTrade(path: string, row: TradeRow): Promise<void> {
  await ensureHeader(path, TRADE_HEADER);
  const line =
    [
      row.ts,
      row.network,
      row.pool,
      row.side,
      row.action,
      row.orderId ?? "",
      row.price ?? "",
      row.qty ?? "",
      row.notional ?? "",
      row.txHash ?? "",
      row.note ?? "",
    ]
      .map(escape)
      .join(",") + "\n";
  await appendFile(path, line).catch(() => undefined);
}

export async function appendMid(path: string, ts: string, mid: number): Promise<void> {
  await ensureHeader(path, MID_HEADER);
  await appendFile(path, `${escape(ts)},${escape(mid)}\n`).catch(() => undefined);
}

export async function appendYield(
  path: string,
  row: {
    ts: string;
    scoreRate: number;
    scoreAccrued: number;
    bidW: number;
    askW: number;
    estYieldUsdso: number | null;
    gasTxs: number;
  },
): Promise<void> {
  await ensureHeader(path, YIELD_HEADER);
  const line =
    [
      row.ts,
      row.scoreRate,
      row.scoreAccrued,
      row.bidW,
      row.askW,
      row.estYieldUsdso ?? "",
      row.gasTxs,
    ]
      .map(escape)
      .join(",") + "\n";
  await appendFile(path, line).catch(() => undefined);
}
