-- 1. Traders & Leaderboard (Derived from real DreamDEX trading data)
CREATE TABLE traders (
    address TEXT PRIMARY KEY,
    total_trades INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    win_rate NUMERIC(5, 2) DEFAULT 0.00, -- e.g. 75.50%
    reputation_score INTEGER DEFAULT 0,   -- Calculated using your formula
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Recorded Trades on DreamDEX (To trace alpha calls)
CREATE TABLE dreamdex_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash TEXT UNIQUE NOT NULL,
    trader_address TEXT REFERENCES traders(address),
    market_pool TEXT NOT NULL,
    kind SMALLINT NOT NULL, -- 0=BUY_YES, 1=SELL_YES, 2=BUY_NO, 3=SELL_NO
    amount NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Subscriptions (Follow / Rebel Settings)
CREATE TABLE copy_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_vault_address TEXT NOT NULL,
    leader_address TEXT NOT NULL,
    mode TEXT CHECK (mode IN ('FOLLOW', 'REBEL')) NOT NULL,
    allocation_per_trade NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_vault_address, leader_address)
);

-- 4. Executed Copy Trades (History of what your bot executed)
CREATE TABLE copy_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES copy_subscriptions(id),
    user_vault_address TEXT NOT NULL,
    market_pool TEXT NOT NULL,
    kind SMALLINT NOT NULL,
    amount NUMERIC NOT NULL,
    tx_hash TEXT,
    status TEXT CHECK (status IN ('SUCCESS', 'FAILED')),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);