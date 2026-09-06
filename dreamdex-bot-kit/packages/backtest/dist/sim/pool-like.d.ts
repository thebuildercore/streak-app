/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { PlaceOrderResult, TopOfBook } from "@dreamdex-bot-kit/core";
/** Local stand-in for Pool — strategies only need these members (structural typing). */
export interface PoolLike {
    readonly symbol: string;
    readonly tick: number;
    readonly lot: number;
    readonly minQty: number;
    topOfBook(depth?: number): Promise<TopOfBook>;
    place(args: PlaceArgs): Promise<PlaceOrderResult>;
    cancel(orderId: bigint): Promise<`0x${string}`>;
    walletBase(): Promise<number>;
}
export interface PlaceArgs {
    isBid: boolean;
    price: number;
    qty: number;
    orderType?: number;
    expireMs?: number;
}
/** Cast for strategy constructors typed as concrete `Pool`. */
export declare function asPool<T>(pool: PoolLike): T;
//# sourceMappingURL=pool-like.d.ts.map