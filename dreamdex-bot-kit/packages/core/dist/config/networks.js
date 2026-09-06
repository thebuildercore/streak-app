/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
// Network configuration for Somnia mainnet and Shannon testnet.
//
// The chain ID is load-bearing in two independent places, and they must agree
// with the network you are actually talking to:
//   1. The `chainId` you SIGN transactions with.
//   2. The `Chain ID` field inside the SIWE login message (see auth.ts).
// A mismatch on either side is rejected. See docs/gotchas.md.
import { defineChain } from "viem";
export const NETWORKS = {
    mainnet: {
        name: "mainnet",
        chainId: 5031,
        nativeSymbol: "SOMI",
        rpcUrl: process.env.RPC_URL ?? "https://api.infra.mainnet.somnia.network",
        restApi: process.env.REST_API_URL ?? "https://api.dreamdex.io/v0",
        wsUrl: process.env.WS_URL ?? "wss://api.dreamdex.io/v0/ws/public",
        explorer: "https://explorer.somnia.network",
        operatorRegistry: "0xE7a190736B6024a4DbafadC04E283075877005ce",
    },
    testnet: {
        name: "testnet",
        chainId: 50312,
        nativeSymbol: "STT",
        rpcUrl: process.env.RPC_URL ?? "https://dream-rpc.somnia.network",
        restApi: process.env.REST_API_URL ?? "https://stg.api.dreamdex.io/v0",
        wsUrl: process.env.WS_URL ?? "wss://stg.api.dreamdex.io/v0/ws/public",
        explorer: "https://shannon-explorer.somnia.network",
        operatorRegistry: "0x15C7e8CE38F021c5b45d098AaD788f63090bF20A",
    },
};
/** Resolve the active network from the `NETWORK` env var (defaults to testnet). */
export function getNetwork() {
    const raw = (process.env.NETWORK ?? "testnet").toLowerCase();
    if (raw !== "mainnet" && raw !== "testnet") {
        throw new Error(`Invalid NETWORK="${raw}". Use "mainnet" or "testnet".`);
    }
    return NETWORKS[raw];
}
/** A viem chain object for the active network. */
export function toViemChain(net) {
    return defineChain({
        id: net.chainId,
        name: net.name === "mainnet" ? "Somnia" : "Somnia Shannon",
        nativeCurrency: { name: net.nativeSymbol, symbol: net.nativeSymbol, decimals: 18 },
        rpcUrls: { default: { http: [net.rpcUrl] } },
        blockExplorers: { default: { name: "Explorer", url: net.explorer } },
    });
}
//# sourceMappingURL=networks.js.map