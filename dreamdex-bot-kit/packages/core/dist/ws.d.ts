/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { NetworkConfig } from "./config/networks.js";
export type WsMessage = Record<string, unknown> & {
    channel?: string;
    type?: string;
};
export declare class DreamDexWs {
    private readonly net;
    private readonly onMessage;
    private readonly onReconnect?;
    private ws;
    private subs;
    private heartbeat;
    private reconnectDelay;
    private closed;
    /** Wall-clock ms of the last non-pong message (0 until first message). */
    private _lastMessageAt;
    constructor(net: NetworkConfig, onMessage: (msg: WsMessage) => void, onReconnect?: (() => void) | undefined);
    /** Epoch ms of the last application message. 0 if none yet. Used by kill switches. */
    get lastMessageAt(): number;
    connect(): void;
    subscribe(channel: string, params: Record<string, unknown>): void;
    subscribeOrderbook(symbols: string[]): void;
    subscribeTrades(symbols: string[]): void;
    close(): void;
    private send;
    private scheduleReconnect;
}
