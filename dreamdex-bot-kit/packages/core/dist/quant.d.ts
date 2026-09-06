/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
export declare function toRaw(human: number | string, decimals: number): bigint;
export declare function fromRaw(raw: bigint, decimals: number): number;
/** Round a raw price DOWN (bid) or UP (ask) to the nearest tick multiple. */
export declare function alignToTick(priceRaw: bigint, tickRaw: bigint, side: "bid" | "ask"): bigint;
/** Round a raw quantity DOWN to the nearest lot multiple (never over-spend). */
export declare function alignToLot(qtyRaw: bigint, lotRaw: bigint): bigint;
/** Shift a human price by ±bps. Positive widens up, negative widens down. */
export declare function shiftBps(price: number, bps: number): number;
export declare function spreadBps(bestBid: number, bestAsk: number): number;
