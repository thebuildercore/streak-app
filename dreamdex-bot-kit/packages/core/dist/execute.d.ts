/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { Account, PublicClient, WalletClient } from "viem";
/** Native-base BUYs deliver native SOMI to the buyer; that payout path needs a
 *  big gas headroom or it reverts with InsufficientGasForPayout. */
export declare const NATIVE_BASE_BUY_GAS = 5000000n;
export interface PlaceOrderParams {
    pool: `0x${string}`;
    baseIsNative: boolean;
    isBid: boolean;
    priceRaw: bigint;
    quantityRaw: bigint;
    tickRaw: bigint;
    lotRaw: bigint;
    minQtyRaw: bigint;
    orderType?: number;
    expireTimestampNs: bigint;
    userData?: bigint;
}
export interface PlaceOrderResult {
    txHash: `0x${string}`;
    orderId: bigint | null;
    gasUsed: bigint;
}
export interface ExecCtx {
    publicClient: PublicClient;
    walletClient: WalletClient;
    account: Account;
}
export declare function placeOrder(ctx: ExecCtx, p: PlaceOrderParams): Promise<PlaceOrderResult>;
/**
 * Place an order ON BEHALF OF `owner` from an approved operator key (split-key /
 * session-key trading). Funds come from the owner's vault (owner must be in
 * manual vault mode and have deposited + granted the operator the placeOrderFor
 * selector — see operator.ts / docs/session-keys.md). No allowance or msg.value:
 * the operator never holds funds.
 */
export declare function placeOrderFor(ctx: ExecCtx, p: PlaceOrderParams, owner: `0x${string}`): Promise<PlaceOrderResult>;
/** Cancel an owner's order from an approved operator key. */
export declare function cancelOrderFor(ctx: ExecCtx, pool: `0x${string}`, owner: `0x${string}`, orderId: bigint): Promise<`0x${string}`>;
export declare function cancelOrder(ctx: ExecCtx, pool: `0x${string}`, orderId: bigint): Promise<`0x${string}`>;
/** Approve `spender` to pull at least `amount` of `token`, if the current allowance is short. */
export declare function ensureAllowance(ctx: ExecCtx, token: `0x${string}`, spender: `0x${string}`, amount: bigint): Promise<void>;
