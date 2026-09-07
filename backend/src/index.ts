import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { startDreamdexListener } from './listeners/somnia';
import leaderboardRoutes from './routes/leaderboard';
import subscriptionRoutes from './routes/subscriptions';
import userRoutes from './routes/user';
import settingsRoutes from './routes/settings';

dotenv.config();

const app = express();

// Middleware
// TODO(security): Restrict CORS origin to frontend domain in production
app.use(cors());
app.use(express.json());

// API Routes for your frontend
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/subscribe', subscriptionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Streak AI Backend running on port ${PORT}`);

    // Start listening to the Somnia blockchain in the background
    startDreamdexListener();
});