/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
export class NonceManager {
    client;
    address;
    maxInFlight;
    next = null;
    inFlight = 0;
    queue = Promise.resolve();
    constructor(client, address, maxInFlight = 8) {
        this.client = client;
        this.address = address;
        this.maxInFlight = maxInFlight;
    }
    /** Sync the local counter with the chain. Call once at startup. */
    async initialize() {
        this.next = await this.client.getTransactionCount({ address: this.address, blockTag: "pending" });
    }
    /**
     * Allocate the next nonce. Serialized, and blocks while too many txs are in
     * flight. Caller MUST then call `settled()` (on confirm) or `resync()` (on a
     * nonce error) so the in-flight counter drains.
     */
    async acquire() {
        // Backpressure: don't hand out a nonce while the mempool is backed up.
        while (this.inFlight >= this.maxInFlight) {
            await sleep(200);
        }
        // Chain the allocation onto the queue so concurrent callers serialize.
        let release;
        const gate = new Promise((r) => (release = r));
        const prev = this.queue;
        this.queue = prev.then(() => gate);
        await prev;
        try {
            if (this.next === null)
                await this.initialize();
            const n = this.next;
            this.next = n + 1;
            this.inFlight += 1;
            return n;
        }
        finally {
            release();
        }
    }
    /** A tx you acquired a nonce for has confirmed (or you gave up on it). */
    settled() {
        if (this.inFlight > 0)
            this.inFlight -= 1;
    }
    /**
     * Re-read the pending nonce from chain after a "nonce too low" error — the
     * chain already consumed a nonce, so a local decrement would reuse it and
     * loop. Resets the in-flight counter.
     */
    async resync() {
        this.next = await this.client.getTransactionCount({ address: this.address, blockTag: "pending" });
        this.inFlight = 0;
        return this.next;
    }
}
export function isNonceTooLow(err) {
    const m = String(err?.message ?? err).toLowerCase();
    return m.includes("nonce too low") || m.includes("nonce is too low") || m.includes("already known");
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
//# sourceMappingURL=nonce.js.map