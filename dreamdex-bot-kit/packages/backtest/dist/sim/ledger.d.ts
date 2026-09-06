/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { SimFill } from "./fill-engine.js";
export interface LedgerSnapshot {
    base: number;
    quote: number;
    feesPaid: number;
    realizedPnl: number;
}
export declare class PortfolioLedger {
    base: number;
    quote: number;
    feesPaid: number;
    realizedPnl: number;
    readonly fills: SimFill[];
    private avgEntry;
    private positionBase;
    constructor(initialQuote: number, initialBase?: number);
    applyFill(f: SimFill): void;
    equity(mid: number): number;
    snapshot(): LedgerSnapshot;
}
//# sourceMappingURL=ledger.d.ts.map