1. Where to get the Trade Data (Building the Leaderboard)
To create a leaderboard of "who earned the most" vs "who failed," you need to track trader Profits and Losses (PnL).

The Tool: Use the @somnia-chain/markets-sdk (specifically the watchTrades and watchPositions methods).

The Implementation:

Because you need a leaderboard, you cannot just fetch data on the fly. You need to build a lightweight Indexer backend (using Node.js and a DB like Supabase/PostgreSQL).

Your backend script will listen to the Somnia blockchain for trade events on the Event Contracts. Every time a trade settles, you calculate the user's profit or loss and update their score in your database.

Your frontend then fetches this DB to rank the "Top Alpha Callers" (high earners) and the "Top Liquidity Providers" (the people losing the most money).

2. "Follow" vs "Rebel" (The Agent Logic)
Event Contracts operate on binary outcomes (e.g., YES or NO tokens for a specific event).

Follow (Copy-Trade): Your backend detects that Wallet A (the Leader) bought 100 YES tokens on a market. Your AI Agent instantly triggers the createOrder function in the DreamDEX SDK to buy YES tokens for your user.

Rebel (Counter-Trade): This is where it gets fun. If the user chooses "Rebel", your agent does the exact opposite. If the leader buys YES, your agent buys NO tokens on the same market.

3. Solving the MetaMask Problem (Session Keys)
To allow the AI agent to trade automatically without the user confirming every transaction in MetaMask, you must use a Session Key (Delegated Trading) pattern.

Here is how you set it up securely:

The One-Time Setup: When the user clicks "Follow" or "Rebel", they choose an allocation (e.g., "Use up to 500 USDC for this strategy").

The Session Key: Your frontend generates a temporary, hidden cryptographic keypair (a "hot wallet" or "session key") stored locally in the browser or your secure backend.

The Allowance Transaction: The user signs one MetaMask transaction. This transaction transfers the 500 USDC to a smart contract vault and grants the temporary session key the authority to trade only that 500 USDC.

Automated Execution: When the Leader makes a trade, your AI Agent uses the Session Key to sign the trade instantly in the background via the DreamDEX Bot Kit logic. No popups, no waiting. Once the threshold is hit, the session key expires.

(Note: The @somnia-chain/markets-sdk natively supports session keys and server-side signing via private keys, which makes this exact flow very easy to build).