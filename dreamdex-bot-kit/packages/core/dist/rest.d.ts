/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { Account } from "viem";
import type { NetworkConfig } from "./config/networks.js";
export interface PreparedTx {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: string;
    gasLimit?: string;
    chainId?: string | number;
}
export interface MarketInfo {
    symbol: string;
    contract: `0x${string}`;
    base: `0x${string}`;
    quote: `0x${string}`;
    baseDecimals: number;
    quoteDecimals: number;
    tickSize: string;
    lotSize: string;
    minQuantity: string;
}
export interface PrepareOrderInput {
    symbol: string;
    side: "buy" | "sell";
    type: "limit" | "market";
    amount: string;
    price?: string;
    fundingSource?: "wallet" | "vault";
    orderType?: "normalOrder" | "fillOrKill" | "immediateOrCancel" | "postOnly";
}
export declare class DreamDexRest {
    private readonly net;
    private readonly account;
    private token;
    private tokenExpiry;
    constructor(net: NetworkConfig, account: Account);
    fetchMarkets(): Promise<MarketInfo[]>;
    /** Canonical multi-symbol orderbook endpoint. Prefer this over per-market paths. */
    fetchOrderbooks(symbols: string[], depth?: number): Promise<unknown>;
    prepareOrder(input: PrepareOrderInput): Promise<PreparedTx>;
    prepareCancel(symbol: string, orderId: string): Promise<PreparedTx>;
    prepareVaultApprove(symbol: string, currency: string, amount: string): Promise<PreparedTx>;
    getOrder(symbol: string, orderId: string): Promise<unknown>;
    ensureAuth(): Promise<string>;
    private request;
}
export declare class DreamDexApiError extends Error {
    readonly status: number;
    /** The stable, machine-readable error name from the API (e.g. "invalid_amount"). */
    readonly apiName: string;
    constructor(status: number, apiName: string, detail: string);
}
