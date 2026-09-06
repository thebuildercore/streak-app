import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// GET /api/leaderboard - Returns top traders for users to Follow/Rebel
// Supports filters: ?filter=top_performers | serial_losers
// Supports market-specific: ?market_pool=0x...
router.get('/', async (req: Request, res: Response) => {
    const filter = req.query.filter as string | undefined;
    const marketPool = req.query.market_pool as string | undefined;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);

    try {
        let query = supabase.from('traders').select('*');

        if (filter === 'top_performers') {
            query = query.gte('win_rate', 50).order('reputation_score', { ascending: false });
        } else if (filter === 'serial_losers') {
            query = query.lte('win_rate', 30).order('reputation_score', { ascending: true });
        } else {
            query = query.order('reputation_score', { ascending: false });
        }

        query = query.limit(limit);

        const { data, error } = await query;

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // If filtering by market_pool, also include trade-specific data
        if (marketPool) {
            const { data: marketTrades, error: tradesError } = await supabase
                .from('dreamdex_trades')
                .select('trader_address, kind, amount, price')
                .eq('market_pool', marketPool)
                .order('created_at', { ascending: false })
                .limit(100);

            if (!tradesError && marketTrades) {
                // Merge market-specific trade data with trader profiles
                const traderMap = new Map((data || []).map(t => [t.address, t]));
                const marketTraders = marketTrades.reduce((acc, trade) => {
                    if (!acc.has(trade.trader_address)) {
                        acc.set(trade.trader_address, {
                            ...traderMap.get(trade.trader_address),
                            market_trades: 0,
                            address: trade.trader_address,
                        });
                    }
                    const entry = acc.get(trade.trader_address);
                    if (entry) entry.market_trades++;
                    return acc;
                }, new Map());

                return res.json({
                    leaderboard: Array.from(marketTraders.values())
                        .sort((a, b) => (b.reputation_score || 0) - (a.reputation_score || 0))
                        .slice(0, limit)
                });
            }
        }

        res.json({ leaderboard: data || [] });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

export default router;