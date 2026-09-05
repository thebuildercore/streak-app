import { Router } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// GET /api/leaderboard - Returns top traders for users to Follow/Rebel
router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('traders')
        .select('*')
        .order('reputation_score', { ascending: false })
        .limit(20);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ leaderboard: data });
});

export default router;