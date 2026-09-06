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
export declare function applyConfigOverrides<T extends Record<string, unknown>>(base: T, overrides?: Record<string, unknown>): T;
//# sourceMappingURL=config-overrides.d.ts.map