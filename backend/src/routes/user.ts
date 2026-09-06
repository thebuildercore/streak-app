import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// GET /api/user/stats?vault=0x... - Returns aggregated PnL, win rate, total trades
router.get('/stats', async (req: Request, res: Response) => {
    const vaultAddress = (req.query.vault as string || '').toLowerCase();

    if (!vaultAddress) {
        return res.status(400).json({ error: 'Missing vault query parameter' });
    }

    try {
        // Fetch all executions for this vault
        const { data: executions, error } = await supabase
            .from('copy_executions')
            .select('*')
            .eq('user_vault_address', vaultAddress);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const allExecutions = executions || [];
        const totalTrades = allExecutions.length;
        const successfulTrades = allExecutions.filter(e => e.status === 'SUCCESS').length;
        const failedTrades = allExecutions.filter(e => e.status === 'FAILED').length;
        const winRate = totalTrades > 0 ? ((successfulTrades / totalTrades) * 100).toFixed(2) : '0.00';

        // Calculate PnL from amounts (simplified — in production, compare entry vs exit)
        const totalVolume = allExecutions.reduce((sum, e) => sum + Number(e.amount || 0), 0);

        // Get active subscriptions
        const { data: subs } = await supabase
            .from('copy_subscriptions')
            .select('*')
            .eq('user_vault_address', vaultAddress)
            .eq('is_active', true);

        const followCount = (subs || []).filter(s => s.mode === 'FOLLOW').length;
        const rebelCount = (subs || []).filter(s => s.mode === 'REBEL').length;

        res.json({
            stats: {
                totalTrades,
                successfulTrades,
                failedTrades,
                winRate: `${winRate}%`,
                totalVolume: totalVolume.toString(),
                followCount,
                rebelCount,
            }
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// GET /api/user/executions?vault=0x...&limit=10 - Returns recent trade history
router.get('/executions', async (req: Request, res: Response) => {
    const vaultAddress = (req.query.vault as string || '').toLowerCase();
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);

    if (!vaultAddress) {
        return res.status(400).json({ error: 'Missing vault query parameter' });
    }

    try {
        const { data, error } = await supabase
            .from('copy_executions')
            .select(`
                *,
                copy_subscriptions (
                    leader_address,
                    mode
                )
            `)
            .eq('user_vault_address', vaultAddress)
            .order('executed_at', { ascending: false })
            .limit(limit);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ executions: data || [] });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

export default router;
