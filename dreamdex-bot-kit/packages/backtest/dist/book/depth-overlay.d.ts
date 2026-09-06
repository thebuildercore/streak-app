/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { type NetworkName } from "@dreamdex-bot-kit/core";
export interface DepthLevel {
    price: number;
    quantity: number;
}
export interface DepthSnapshot {
    timestamp: number;
    bids: DepthLevel[];
    asks: DepthLevel[];
}
/**
 * Load depth snapshots from a directory of JSON files.
 * Filenames may be `{timestamp}.json` or any JSON with a `timestamp` field.
 */
export declare function loadDepthSnapshots(dir: string): Promise<Map<number, DepthSnapshot>>;
/**
 * Fetch live orderbook once and return observed spread (bps) + best bid/ask.
 * Uses repeated `symbols=` query keys per OpenAPI explode:true.
 */
export declare function calibrateLiveSpread(symbol: string, network?: NetworkName): Promise<{
    spreadBps: number;
    bestBid: number;
    bestAsk: number;
    mid: number;
} | null>;
/** Find the snapshot whose timestamp is closest to `ts` within `toleranceMs`. */
export declare function nearestSnapshot(snapshots: Map<number, DepthSnapshot>, ts: number, toleranceMs?: number): DepthSnapshot | undefined;
/**
 * Latest snapshot at or before `ts` within `toleranceMs` (causal — no future lookahead).
 * Prefer this for queue-position modeling.
 */
export declare function latestSnapshotAtOrBefore(snapshots: Map<number, DepthSnapshot>, ts: number, toleranceMs?: number): DepthSnapshot | undefined;
//# sourceMappingURL=depth-overlay.d.ts.map