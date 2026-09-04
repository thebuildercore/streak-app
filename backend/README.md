# Streak App Backend

This directory contains the backend services for the Streak App. It is a Node.js/TypeScript application that bridges the gap between the on-chain smart contracts (Somnia network) and the off-chain database (Supabase).

## Overview

The backend is responsible for listening to on-chain events, managing the game rounds and user predictions, processing settlements, and updating user profiles (streaks and win rates).

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Web Framework**: Express (set up in dependencies)
- **Database Client**: `@supabase/supabase-js` (PostgreSQL via Supabase)
- **Blockchain Interaction**: `viem` (for EVM interactions with the Somnia testnet)

## Folder Structure & Key Components

### `database.sql`
Contains the database schema for the application, defining three primary tables:
- **`rounds`**: Tracks prediction rounds, including asset, duration, start/lock/settle times, outcomes, and AI prediction receipts.
- **`user_profiles`**: Maintains user statistics, such as current and best prediction streaks, total calls, wins, and dynamically calculated win rates.
- **`predictions`**: Stores individual user calls (UP/DOWN), their staked amounts, and the final result (WON/LOST/PENDING).

### `src/listeners/somnia.ts`
An on-chain event listener using `viem`. It watches the `STREAK_HUB_ADDRESS` smart contract on the Somnia Testnet for `AgentPredictionLogged` events. When the AI logs a prediction, this service catches the event and updates the Supabase `rounds` table with the AI's confidence score (`ai_confidence_up`) and transaction receipt hash (`ai_receipt_tx`).

### `src/listeners/dreamdex.ts`
Handles the settlement logic for prediction rounds. When a round finishes, the `processRoundSettlement` function:
1. Updates the `rounds` table with the final outcome and settle price.
2. Evaluates all user `predictions` for that round, marking them as `WON` or `LOST`.
3. Updates each corresponding `user_profiles` record to recalculate their current streak, best streak, and total wins.

### `src/db/`
Contains the Supabase client initialization (`supabase.ts`) to interact with the database.

### `src/routes/` & `src/index.ts`
Currently a work in progress. These files are intended to serve as the Express server entry point (`index.ts`) and expose API endpoints (like `leaderboard.ts`) for the frontend to consume.

## What it does (Summary)
1. **On-chain Synchronization**: Captures AI prediction logs from the Somnia blockchain and stores them in the database.
2. **Game Logic & Settlement**: Calculates the results of user predictions against final market outcomes and dynamically updates user streaks and statistics.
3. **Data Management**: Acts as the central source of truth for user profiles, current active rounds, and historical predictions.
