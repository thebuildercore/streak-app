/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
export class PortfolioLedger {
    base;
    quote;
    feesPaid = 0;
    realizedPnl = 0;
    fills = [];
    avgEntry = 0;
    positionBase = 0;
    constructor(initialQuote, initialBase = 0) {
        this.quote = initialQuote;
        this.base = initialBase;
        this.positionBase = initialBase;
        this.avgEntry = 0;
    }
    applyFill(f) {
        this.fills.push(f);
        this.feesPaid += f.fee;
        if (f.isBid) {
            // buy base with quote
            const cost = f.price * f.qty + f.fee;
            this.quote -= cost;
            this.base += f.qty;
            // update average entry for long inventory
            const newPos = this.positionBase + f.qty;
            if (newPos > 0) {
                this.avgEntry = (this.avgEntry * this.positionBase + f.price * f.qty) / newPos;
            }
            this.positionBase = newPos;
        }
        else {
            const proceeds = f.price * f.qty - f.fee;
            this.quote += proceeds;
            this.base -= f.qty;
            if (this.positionBase > 0) {
                const closed = Math.min(this.positionBase, f.qty);
                this.realizedPnl += (f.price - this.avgEntry) * closed - f.fee * (closed / f.qty);
                this.positionBase -= closed;
                if (this.positionBase <= 1e-12) {
                    this.positionBase = 0;
                    this.avgEntry = 0;
                }
            }
            else {
                this.positionBase -= f.qty;
            }
        }
    }
    equity(mid) {
        return this.quote + this.base * mid;
    }
    snapshot() {
        return {
            base: this.base,
            quote: this.quote,
            feesPaid: this.feesPaid,
            realizedPnl: this.realizedPnl,
        };
    }
}
//# sourceMappingURL=ledger.js.map