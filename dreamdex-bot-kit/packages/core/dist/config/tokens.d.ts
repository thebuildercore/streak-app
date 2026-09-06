/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { NetworkName } from "./networks.js";
export declare const NATIVE_SENTINEL: "0x28f34DeFd2b4CB48d9eE6d89f2Be4Bc601694c00";
export interface MarketMeta {
    readonly symbol: string;
    readonly pool: `0x${string}`;
    readonly stopRegistry: `0x${string}`;
    readonly baseDecimals: number;
    readonly quoteDecimals: number;
    readonly baseIsNative: boolean;
}
export declare const MARKETS: Record<NetworkName, Record<string, MarketMeta>>;
