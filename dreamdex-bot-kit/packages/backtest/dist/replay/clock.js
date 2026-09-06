/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import FakeTimers from "@sinonjs/fake-timers";
/** Install fake timers so strategy Date.now() tracks candle timestamps. */
export function installReplayClock(nowMs) {
    const clock = FakeTimers.install({
        now: nowMs,
        toFake: ["Date"],
    });
    return {
        setTime(ms) {
            clock.setSystemTime(ms);
        },
        uninstall() {
            clock.uninstall();
        },
    };
}
//# sourceMappingURL=clock.js.map