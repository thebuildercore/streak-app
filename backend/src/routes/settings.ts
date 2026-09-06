import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// POST /api/settings - Save user risk settings
router.post('/', async (req: Request, res: Response) => {
    const { userVaultAddress, maxDrawdown, maxAllocation, slippageTolerance } = req.body;

    if (!userVaultAddress) {
        return res.status(400).json({ error: 'Missing userVaultAddress' });
    }

    // Validate numeric ranges
    const drawdown = parseFloat(maxDrawdown);
    const allocation = parseFloat(maxAllocation);
    const slippage = parseFloat(slippageTolerance);

    if (isNaN(drawdown) || drawdown < 0 || drawdown > 100) {
        return res.status(400).json({ error: 'maxDrawdown must be between 0 and 100' });
    }
    if (isNaN(allocation) || allocation < 0) {
        return res.status(400).json({ error: 'maxAllocation must be a positive number' });
    }
    if (isNaN(slippage) || slippage < 0 || slippage > 10) {
        return res.status(400).json({ error: 'slippageTolerance must be between 0 and 10' });
    }

    try {
        const { data, error } = await supabase
            .from('user_settings')
            .upsert({
                user_vault_address: userVaultAddress.toLowerCase(),
                max_drawdown: drawdown,
                max_allocation: allocation,
                slippage_tolerance: slippage,
                updated_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, settings: data?.[0] || null });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// GET /api/settings?vault=0x... - Get user risk settings
router.get('/', async (req: Request, res: Response) => {
    const vaultAddress = (req.query.vault as string || '').toLowerCase();

    if (!vaultAddress) {
        return res.status(400).json({ error: 'Missing vault query parameter' });
    }

    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_vault_address', vaultAddress)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is fine for new users
            return res.status(500).json({ error: error.message });
        }

        res.json({
            settings: data || {
                max_drawdown: 15.0,
                max_allocation: 250.0,
                slippage_tolerance: 0.5,
            }
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

export default router;
