import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// POST /api/subscribe - User configures Follow/Rebel from the UI
router.post('/', async (req: Request, res: Response) => {
    const { userVaultAddress, leaderAddress, mode, allocationPerTrade } = req.body;

    if (!userVaultAddress || !leaderAddress || !mode || !allocationPerTrade) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!['FOLLOW', 'REBEL'].includes(mode)) {
        return res.status(400).json({ error: 'Mode must be FOLLOW or REBEL' });
    }

    const allocation = parseFloat(allocationPerTrade);
    if (isNaN(allocation) || allocation <= 0) {
        return res.status(400).json({ error: 'allocationPerTrade must be a positive number' });
    }

    try {
        const { data, error } = await supabase
            .from('copy_subscriptions')
            .upsert({
                user_vault_address: userVaultAddress.toLowerCase(),
                leader_address: leaderAddress.toLowerCase(),
                mode,
                allocation_per_trade: allocation,
                is_active: true,
            })
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, subscription: data?.[0] || null });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// GET /api/subscribe?vault=0x... - Get active subscriptions for user
router.get('/', async (req: Request, res: Response) => {
    const vaultAddress = (req.query.vault as string || '').toLowerCase();

    if (!vaultAddress) {
        return res.status(400).json({ error: 'Missing vault query parameter' });
    }

    try {
        const { data, error } = await supabase
            .from('copy_subscriptions')
            .select('*')
            .eq('user_vault_address', vaultAddress)
            .eq('is_active', true);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ subscriptions: data || [] });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// PATCH /api/subscribe/mode - Toggle between FOLLOW and REBEL
router.patch('/mode', async (req: Request, res: Response) => {
    const { userVaultAddress, leaderAddress, mode } = req.body;

    if (!userVaultAddress || !leaderAddress || !mode) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!['FOLLOW', 'REBEL'].includes(mode)) {
        return res.status(400).json({ error: 'Mode must be FOLLOW or REBEL' });
    }

    try {
        const { data, error } = await supabase
            .from('copy_subscriptions')
            .update({ mode })
            .eq('user_vault_address', userVaultAddress.toLowerCase())
            .eq('leader_address', leaderAddress.toLowerCase())
            .eq('is_active', true)
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No active subscription found for this leader' });
        }

        res.json({ success: true, subscription: data[0] });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// DELETE /api/subscribe - Deactivate a subscription
router.delete('/', async (req: Request, res: Response) => {
    const { userVaultAddress, leaderAddress } = req.body;

    if (!userVaultAddress || !leaderAddress) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const { data, error } = await supabase
            .from('copy_subscriptions')
            .update({ is_active: false })
            .eq('user_vault_address', userVaultAddress.toLowerCase())
            .eq('leader_address', leaderAddress.toLowerCase())
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, deactivated: data?.[0] || null });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

export default router;