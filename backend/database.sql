-- 1. Markets & Rounds Table
CREATE TABLE rounds (
    id TEXT PRIMARY KEY,               -- e.g. "BTC_15M_20260901_001"
    asset VARCHAR(10) NOT NULL,        -- "BTC" or "ETH"
    duration VARCHAR(10) NOT NULL,     -- "15m" or "1h"
    line_to_beat NUMERIC NOT NULL,     -- Strike price at round start
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    lock_time TIMESTAMP WITH TIME ZONE NOT NULL,
    settle_time TIMESTAMP WITH TIME ZONE NOT NULL,
    outcome VARCHAR(10) DEFAULT 'PENDING', -- 'UP', 'DOWN', or 'PENDING'
    settle_price NUMERIC,
    ai_confidence_up NUMERIC,          -- Somnia AI score (e.g., 64 for 64% UP)
    ai_receipt_tx TEXT,                -- Somnia on-chain tx hash
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User & AI Track Records
CREATE TABLE user_profiles (
    wallet_address TEXT PRIMARY KEY,
    is_ai BOOLEAN DEFAULT FALSE,
    current_streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    total_calls INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    win_rate NUMERIC GENERATED ALWAYS AS (
        CASE WHEN total_calls > 0 THEN ROUND((total_wins::NUMERIC / total_calls) * 100, 2) ELSE 0 END
    ) STORED,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Individual Predictions / Calls
CREATE TABLE predictions (
    id BIGSERIAL PRIMARY KEY,
    round_id TEXT REFERENCES rounds(id) ON DELETE CASCADE,
    wallet_address TEXT REFERENCES user_profiles(wallet_address),
    direction VARCHAR(10) NOT NULL,    -- 'UP' or 'DOWN'
    stake_amount NUMERIC NOT NULL,     -- USDso amount
    is_auto_pilot BOOLEAN DEFAULT FALSE,
    result VARCHAR(10) DEFAULT 'PENDING', -- 'WON', 'LOST', 'PENDING'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning-fast queries
CREATE INDEX idx_rounds_active ON rounds (lock_time, outcome);
CREATE INDEX idx_predictions_round ON predictions (round_id);
CREATE INDEX idx_leaderboard ON user_profiles (current_streak DESC, win_rate DESC);