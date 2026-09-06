/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
export interface ReplayClock {
    setTime(ms: number): void;
    uninstall(): void;
}
/** Install fake timers so strategy Date.now() tracks candle timestamps. */
export declare function installReplayClock(nowMs: number): ReplayClock;
//# sourceMappingURL=clock.d.ts.map