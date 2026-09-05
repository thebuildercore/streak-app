import { Router } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// POST /api/subscribe - User configures Follow/Rebel from the UI
router.post('/', async (req, res) => {
    const { userVaultAddress, leaderAddress, mode, allocationPerTrade } = req.body;

    if (!userVaultAddress || !leaderAddress || !mode || !allocationPerTrade) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const { data, error } = await supabase
        .from('copy_subscriptions')
        .upsert({
            user_vault_address: userVaultAddress.toLowerCase(),
            leader_address: leaderAddress.toLowerCase(),
            mode,
            allocation_per_trade: allocationPerTrade,
            is_active: true,
        })
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, subscription: data[0] });
});

export default router;