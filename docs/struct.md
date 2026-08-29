streak-app/
│
├── frontend/                  # Next.js Consumer App (Mobile-first UI)
│   ├── src/
│   │   ├── app/               # Next.js App Router (Pages & Layouts)
│   │   │   ├── page.tsx       # Main feed: Live BTC/ETH markets
│   │   │   ├── profile.tsx    # User's verifiable track record & streak
│   │   │   └── layout.tsx     # Global layout (Wallet context provider)
│   │   ├── components/        
│   │   │   ├── CopilotCard.tsx # Somnia AI confidence read UI
│   │   │   ├── TradeButtons.tsx# Up/Down execution via DreamDEX SDK
│   │   │   └── ShareCard.tsx  # Gamified result export for socials
│   │   ├── hooks/
│   │   │   ├── useDreamDex.ts # WebSocket connection to DreamDEX
│   │   │   └── useSomnia.ts   # Fetches AI receipts from your backend
│   │   └── lib/
│   │       └── wagmi.ts       # Viem/Wagmi config for Somnia testnet
│   ├── .env.local             # Frontend env (API URLs, WalletConnect ID)
│   ├── tailwind.config.ts     
│   └── package.json
│
├── contracts/                 # Hardhat Smart Contracts (The Trust Layer)
│   ├── contracts/
│   │   └── StreakReputation.sol # The core contract calling Somnia Agents
│   ├── ignition/
│   │   └── modules/
│   │       └── deploy.ts      # Deployment script for Somnia testnet
│   ├── test/
│   │   └── Streak.test.ts     # Tests for the AI callback logic
│   ├── hardhat.config.ts      # Network config for Somnia
│   ├── .env                   # Private keys & RPC endpoints
│   └── package.json
│
└── backend/                   # Express Indexer (The Speed Layer)
    ├── src/
    │   ├── index.ts           # Main Express server entry point
    │   ├── listeners/
    │   │   ├── dreamdex.ts    # Listens for round settlement events
    │   │   └── somnia.ts      # Listens for your contract's AI receipts
    │   ├── db/
    │   │   └── supabase.ts    # Database client to update streak logic
    │   └── routes/
    │       └── leaderboard.ts # Serves fast JSON data to the frontend
    ├── .env                   # Supabase keys & Somnia RPC
    ├── tsconfig.json
    └── package.json