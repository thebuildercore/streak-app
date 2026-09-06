/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { PublicClient } from "viem";
export declare class NonceManager {
    private readonly client;
    private readonly address;
    private readonly maxInFlight;
    private next;
    private inFlight;
    private queue;
    constructor(client: PublicClient, address: `0x${string}`, maxInFlight?: number);
    /** Sync the local counter with the chain. Call once at startup. */
    initialize(): Promise<void>;
    /**
     * Allocate the next nonce. Serialized, and blocks while too many txs are in
     * flight. Caller MUST then call `settled()` (on confirm) or `resync()` (on a
     * nonce error) so the in-flight counter drains.
     */
    acquire(): Promise<number>;
    /** A tx you acquired a nonce for has confirmed (or you gave up on it). */
    settled(): void;
    /**
     * Re-read the pending nonce from chain after a "nonce too low" error — the
     * chain already consumed a nonce, so a local decrement would reuse it and
     * loop. Resets the in-flight counter.
     */
    resync(): Promise<number>;
}
export declare function isNonceTooLow(err: unknown): boolean;
