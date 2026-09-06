/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
/**
 * Apply CLI `--set key=value` overrides onto a strategy config object.
 * Coerces numeric/boolean-looking strings; leaves other values as strings.
 */
export function applyConfigOverrides(base, overrides = {}) {
    if (!overrides || Object.keys(overrides).length === 0)
        return { ...base };
    const out = { ...base };
    for (const [key, raw] of Object.entries(overrides)) {
        if (!(key in base)) {
            // Allow unknown keys for forward-compat; strategies ignore extras.
            out[key] = coerce(raw);
            continue;
        }
        const prev = base[key];
        if (typeof prev === "number") {
            const n = typeof raw === "number" ? raw : Number(raw);
            if (!Number.isFinite(n))
                throw new Error(`--set ${key}=${raw} is not a number`);
            out[key] = n;
        }
        else if (typeof prev === "boolean") {
            if (typeof raw === "boolean")
                out[key] = raw;
            else {
                const s = String(raw).toLowerCase();
                out[key] = s === "1" || s === "true";
            }
        }
        else {
            out[key] = coerce(raw);
        }
    }
    return out;
}
function coerce(raw) {
    if (typeof raw !== "string")
        return raw;
    if (raw === "true")
        return true;
    if (raw === "false")
        return false;
    if (raw !== "" && Number.isFinite(Number(raw)))
        return Number(raw);
    return raw;
}
//# sourceMappingURL=config-overrides.js.map