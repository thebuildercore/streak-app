/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
// WebSocket market-data feed with heartbeat + auto-reconnect.
//
// The server closes idle connections after 60s, so we ping every 30s. On any
// disconnect we reconnect with backoff and REPLAY the subscriptions — a bot that
// silently stops receiving book updates is worse than one that crashes, because
// it keeps quoting on a frozen view. Pair this with an occasional REST/on-chain
// reconcile of the book (see docs/24-7-operations.md on staleness).
import WebSocket from "ws";
export class DreamDexWs {
    net;
    onMessage;
    onReconnect;
    ws = null;
    subs = [];
    heartbeat = null;
    reconnectDelay = 1_000;
    closed = false;
    /** Wall-clock ms of the last non-pong message (0 until first message). */
    _lastMessageAt = 0;
    constructor(net, onMessage, onReconnect) {
        this.net = net;
        this.onMessage = onMessage;
        this.onReconnect = onReconnect;
    }
    /** Epoch ms of the last application message. 0 if none yet. Used by kill switches. */
    get lastMessageAt() {
        return this._lastMessageAt;
    }
    connect() {
        this.closed = false;
        const ws = new WebSocket(this.net.wsUrl);
        this.ws = ws;
        ws.on("open", () => {
            this.reconnectDelay = 1_000;
            for (const s of this.subs)
                this.send({ operation: "subscribe", channel: s.channel, params: s.params });
            this.heartbeat = setInterval(() => this.send({ operation: "ping" }), 30_000);
            this.onReconnect?.();
        });
        ws.on("message", (data) => {
            let msg;
            try {
                msg = JSON.parse(data.toString());
            }
            catch {
                return;
            }
            if (msg.operation === "pong")
                return;
            this._lastMessageAt = Date.now();
            this.onMessage(msg);
        });
        ws.on("close", () => this.scheduleReconnect());
        ws.on("error", () => ws.close());
    }
    subscribe(channel, params) {
        this.subs.push({ channel, params });
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.send({ operation: "subscribe", channel, params });
        }
    }
    subscribeOrderbook(symbols) {
        this.subscribe("orderbook", { symbols });
    }
    subscribeTrades(symbols) {
        this.subscribe("trades", { symbols });
    }
    close() {
        this.closed = true;
        if (this.heartbeat)
            clearInterval(this.heartbeat);
        this.ws?.close();
    }
    send(obj) {
        if (this.ws?.readyState === WebSocket.OPEN)
            this.ws.send(JSON.stringify(obj));
    }
    scheduleReconnect() {
        if (this.heartbeat)
            clearInterval(this.heartbeat);
        if (this.closed)
            return;
        const delay = this.reconnectDelay;
        this.reconnectDelay = Math.min(delay * 2, 30_000); // exponential backoff, capped
        setTimeout(() => this.connect(), delay);
    }
}
//# sourceMappingURL=ws.js.map