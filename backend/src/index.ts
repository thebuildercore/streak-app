import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { startDreamdexListener } from './listeners/somnia';
import leaderboardRoutes from './routes/leaderboard';
import subscriptionRoutes from './routes/subscriptions';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes for your frontend
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/subscribe', subscriptionRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Streak AI Backend running on port ${PORT}`);

    // Start listening to the Somnia blockchain in the background
    startDreamdexListener();
});