/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
const REFRESH_MARGIN_MS = 3 * 60_000; // refresh 3 min before expiry
export class DreamDexRest {
    net;
    account;
    token = null;
    tokenExpiry = 0;
    constructor(net, account) {
        this.net = net;
        this.account = account;
    }
    // ── Public market data ──────────────────────────────────────────────────
    async fetchMarkets() {
        const body = await this.request("GET", "/markets", { auth: false });
        return body.markets;
    }
    /** Canonical multi-symbol orderbook endpoint. Prefer this over per-market paths. */
    async fetchOrderbooks(symbols, depth = 5) {
        const q = encodeURIComponent(symbols.join(","));
        return this.request("GET", `/orderbooks?symbols=${q}&depth=${depth}`, { auth: false });
    }
    // ── Authenticated: prepare unsigned txs ─────────────────────────────────
    async prepareOrder(input) {
        const { symbol, ...rest } = input;
        return this.request("POST", `/markets/${encodeURIComponent(symbol)}/orders`, {
            body: { walletAddress: this.account.address, ...rest },
        });
    }
    async prepareCancel(symbol, orderId) {
        return this.request("DELETE", `/markets/${encodeURIComponent(symbol)}/orders/${orderId}`);
    }
    async prepareVaultApprove(symbol, currency, amount) {
        return this.request("POST", `/markets/${encodeURIComponent(symbol)}/vault/approve`, {
            body: { walletAddress: this.account.address, currency, amount },
        });
    }
    async getOrder(symbol, orderId) {
        return this.request("GET", `/markets/${encodeURIComponent(symbol)}/orders/${orderId}`);
    }
    // ── SIWE auth ────────────────────────────────────────────────────────────
    async ensureAuth() {
        if (this.token && Date.now() < this.tokenExpiry - REFRESH_MARGIN_MS)
            return this.token;
        const { nonce } = await this.request("GET", "/auth/nonce", { auth: false });
        const domain = new URL(this.net.restApi).host;
        const uri = new URL(this.net.restApi).origin;
        const issuedAt = new Date().toISOString();
        const message = `${domain} wants you to sign in with your Ethereum account:\n` +
            `${this.account.address}\n\n` +
            `Sign in to dreamDEX\n\n` +
            `URI: ${uri}\n` +
            `Version: 1\n` +
            `Chain ID: ${this.net.chainId}\n` +
            `Nonce: ${nonce}\n` +
            `Issued At: ${issuedAt}`;
        if (!this.account.signMessage)
            throw new Error("Account cannot sign messages (need a local account).");
        const signature = await this.account.signMessage({ message });
        const login = await this.request("POST", "/auth/login", {
            auth: false,
            body: { message, signature },
        });
        this.token = login.token;
        this.tokenExpiry = login.expiresAt;
        return this.token;
    }
    // ── Low-level request ────────────────────────────────────────────────────
    async request(method, path, opts = {}) {
        const auth = opts.auth ?? true;
        const headers = { Accept: "application/json" };
        if (opts.body !== undefined)
            headers["Content-Type"] = "application/json";
        if (auth)
            headers["Authorization"] = `Bearer ${await this.ensureAuth()}`;
        const res = await fetch(`${this.net.restApi}${path}`, {
            method,
            headers,
            body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        });
        const text = await res.text();
        const parsed = text ? safeJson(text) : {};
        if (!res.ok) {
            // The stable machine-readable error is in `name`; `description` is for debugging only.
            const name = parsed.name ?? res.headers.get("Error-Name") ?? "http_error";
            throw new DreamDexApiError(res.status, name, JSON.stringify(parsed));
        }
        return parsed;
    }
}
export class DreamDexApiError extends Error {
    status;
    /** The stable, machine-readable error name from the API (e.g. "invalid_amount"). */
    apiName;
    constructor(status, apiName, detail) {
        super(`DreamDEX API ${status} ${apiName}: ${detail}`);
        this.status = status;
        this.name = "DreamDexApiError";
        this.apiName = apiName;
    }
}
function safeJson(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return { raw: text };
    }
}
//# sourceMappingURL=rest.js.map