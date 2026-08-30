import { supabase } from '../db/supabase';

export async function processRoundSettlement(roundId: string, outcome: 'UP' | 'DOWN', finalPrice: number) {
    console.log(`[Settlement] Processing round ${round} with outcome: ${outcome}`);

    await supabase
        .from('rounds')
        .update({ outcome, settle_price: finalPrice })
        .eq('id', roundId);

    const { data: calls } = await supabase
        .from('predictions')
        .select('*')
        .eq('round_id', roundId);

    if (!calls || calls.length === 0) return;

    for (const call of calls) {
        const isWinner = call.direction === outcome;
        const callResult = isWinner ? 'WON' : 'LOSt';

        await supabase
            .from('predictions')
            .update({ result: callResult })
            .eq('id', call.id);

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('wallet_address', call.wallet_address)
            .single();

        if (profile) {
            const nextStreak = isWinner ? profile.current_streak + 1 : 0;
            const bestStreak = Math.max(profile.best_streak, nextStreak);
            const totalWins = isWinner ? profile.total_wins + 1 : profile.total_wins;


            await supabase
                .from('user_profiles')
                .update({
                    current_streak: nextStreak,
                    best_streak: bestStreak,
                    total_calls: profile.total_calls + 1,
                    total_wins: totalWins,
                    last_active: new Date().toISOString()
                })
                .eq('wallet_address', call.wallet_address);
        }
    }
}