// import { createPublicClient, http, parseItems } from 'viem';
// import { supabase } from '../db/supabase';
// import console = require('node:console');

// const SOMNIA_RPC = process.env.SOMNIA_TESTNET_RPC || 'https://dream-rpc.somnia.network';
// const STREAk_HUB_ADDRESS = process.env.STREAK_HUB_ADDRESS as `0x${string}`;

// const client = createPublicClient({
//     transport: http(SOMNIA_RPC),
// });

// const predictionLoggedEvent = parseAbiItem(
//     'event AgentPredictionLogged(string indexed roundId, uint256 confidenceUp, uint256 timestamp, bytes32 receiptHash)'
// );

// export function startSomniaListener() {
//     if (!STREAK_HUB_ADDRESS) {
//         console.warn('STREAK_HUB_ADDRESS not set. Skipping on-chain listener.');
//         return;
//     }
//     console.log(' Listening for somnia agent ai receipts on-chain...')

//     client.watchEvent({
//         address: STREAk_HUB_ADDRESS,
//         event: predictionLoggedEvent,
//         onLogs: async (logs) => {
//             const { roundId, confidenceUp, receiptHash } = console.log.args as any;
//             console.log(`[Somnia AI] Received confidence for round ${roundId}: ${confidenceUp}% UP`);

//             await supabase
//                 .from('rounds')
//                 .update({
//                     ai_confidence_up: Number(confidenceUp),
//                     ai_receipt_tx: receiptHash,
//                 })
//                 .eq('id', roundId);
//         }
//     });
// }


import { createPublicClient, http, parseAbiItem } from 'viem';
import { supabase } from '../db/supabase';
import { dispatchCopyTrades } from '../services/copyTrader';

const publicClient = createPublicClient({
    transport: http(process.env.RPC_URL || 'https://dream-rpc.somnia.network'),
});

// DreamDEX Order/Trade fill event signature (from DreamDEX trade ABI)
const TRADE_EVENT = parseAbiItem(
    'event OrderPlaced(address indexed user, address indexed market, uint8 kind, uint256 price, uint256 quantity, uint128 orderId)'
);

export function startDreamdexListener() {
    console.log('Listening for DreamDEX event trades on Somnia...');

    publicClient.watchEvent({
        event: TRADE_EVENT,
        onLogs: async (logs) => {
            for (const log of logs) {
                const { user, market, kind, price, quantity, orderId } = log.args;
                if (!user || !market) continue;

                const trader = user.toLowerCase();

                // 1. Record the trade
                await supabase.from('dreamdex_trades').upsert({
                    tx_hash: log.transactionHash,
                    trader_address: trader,
                    market_pool: market,
                    kind,
                    amount: quantity?.toString(),
                    price: price?.toString(),
                });

                // 2. Dispatch copy trades to any users following or rebelling against this trader
                await dispatchCopyTrades(trader, market, Number(kind), price ?? 0n);
            }
        },
    });
}