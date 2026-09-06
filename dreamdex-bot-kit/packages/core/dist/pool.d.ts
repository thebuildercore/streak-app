/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { ChainContext } from "./client.js";
import { type PoolParams } from "./contract.js";
import { type PlaceOrderResult } from "./execute.js";
export interface TopOfBook {
    bestBid?: number;
    bestAsk?: number;
    mid?: number;
}
export interface PlaceArgs {
    isBid: boolean;
    price: number;
    qty: number;
    orderType?: number;
    expireMs?: number;
}
export declare class Pool {
    private readonly ctx;
    readonly symbol: string;
    readonly address: `0x${string}`;
    readonly baseIsNative: boolean;
    readonly params: PoolParams;
    readonly baseDecimals: number;
    readonly quoteDecimals: number;
    private constructor();
    static load(ctx: ChainContext, symbol: string): Promise<Pool>;
    private get exec();
    /**
     * The account whose position we're reading. In session-key mode the signer is
     * the OPERATOR, but orders are placed for — and fills settle to — the OWNER, so
     * balance/order reads must be scoped to the owner, mirroring how `place()` /
     * `cancel()` route through the `*For` variants. With no owner set this is the
     * signer, so the default (non-session-key) path is unchanged.
     */
    private get subject();
    /** Human-unit tick / lot / min for sizing decisions. */
    get tick(): number;
    get lot(): number;
    get minQty(): number;
    topOfBook(depth?: number): Promise<TopOfBook>;
    place(args: PlaceArgs): Promise<PlaceOrderResult>;
    cancel(orderId: bigint): Promise<`0x${string}`>;
    openOrderIds(): Promise<bigint[]>;
    /** Withdrawable vault balance of the base side (uses the native sentinel for native pools). */
    vaultBase(): Promise<number>;
    /**
     * Base held in the WALLET — ERC-20 `balanceOf`, or the native balance for a
     * native-base pool. Under the default auto-pull / auto-deliver mode fills
     * settle to the wallet (the vault reads ~0), so THIS is the number that
     * reflects live inventory for skew/hedging. Use `vaultBase()` only when you
     * run the market in manual-vault mode (`setManualVaultMode(true)`).
     *
     * In session-key mode this reads the OWNER's wallet — fills settle to them, not
     * to the operator signing the transactions.
     */
    walletBase(): Promise<number>;
}
