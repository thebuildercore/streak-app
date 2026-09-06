/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
/** Order execution type — the on-chain `orderType` enum. */
export declare const ORDER_TYPE: {
    /** GTC — rests on the book if it doesn't fully fill. */
    readonly Normal: 0;
    /** Fully fill immediately or revert. */
    readonly FillOrKill: 1;
    /** Fill what you can now, cancel the rest. The taker default. */
    readonly ImmediateOrCancel: 2;
    /** Maker-only: rejected if any part would fill immediately. */
    readonly PostOnly: 3;
};
export declare const SELF_MATCH: {
    /** Cancel the incoming (taker) order if it would hit your own resting order. */
    readonly CancelTaker: 0;
    /** Cancel your resting (maker) order and keep matching. */
    readonly CancelMaker: 1;
};
export declare const NS_PER_MS = 1000000n;
export declare class GotchaError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
/**
 * Build an `expireTimestampNs` value `durationMs` from now, in nanoseconds.
 * There is NO "no expiry" sentinel: 0, past, or current-time values are all
 * rejected. Always pass a future nanosecond timestamp.
 */
export declare function buildExpireNs(durationMs: number): bigint;
export declare function assertExpireNs(expireNs: bigint): void;
/**
 * A taker (IOC/FOK) order must cross the book: priceRaw = 0 never crosses and
 * produces no fill. Price your limit at-or-through the opposite top of book.
 */
export declare function assertPriceRawNonZero(priceRaw: bigint): void;
/**
 * This kit trades WITHOUT a builder code: it always passes builder = address(0)
 * and builderFeeBpsTimes1k = 0, which produces valid orders on every network.
 * This guard enforces that untagged path.
 *
 * Note: builder codes ARE enabled on mainnet — each pool's
 * `getMaxBuilderFeeBpsTimes1k()` returns 100000 (a 1% fee cap). Testnet's cap is
 * currently 0. To trade with a builder code, read the live cap, call
 * `approveBuilder` once, pass a fee <= cap, and include it in the
 * `getAutoPullRequirement` call. Builder support is intentionally out of scope
 * for this guard (a planned addition to the kit).
 */
export declare function assertBuilderDisabled(builder: string, builderFeeBpsTimes1k: bigint): void;
export declare function assertQtyMultipleOfLot(qtyRaw: bigint, lotRaw: bigint): void;
export declare function assertQtyAboveMin(qtyRaw: bigint, minQtyRaw: bigint): void;
export declare function assertPriceMultipleOfTick(priceRaw: bigint, tickRaw: bigint): void;
