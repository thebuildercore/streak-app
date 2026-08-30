import { createPublicClient, http, parseItems } from 'viem';
import { supabase } from '../db/supabase';
import console = require('node:console');

const SOMNIA_RPC = process.env.SOMNIA_TESTNET_RPC || 'https://dream-rpc.somnia.network';
const STREAk_HUB_ADDRESS = process.env.STREAK_HUB_ADDRESS as `0x${string}`;

const client = createPublicClient({
    transport: http(SOMNIA_RPC),
});

const predictionLoggedEvent = parseAbiItem(
    'event AgentPredictionLogged(string indexed roundId, uint256 confidenceUp, uint256 timestamp, bytes32 receiptHash)'
);

export function startSomniaListener() {
    if (!STREAK_HUB_ADDRESS) {
        console.warn('STREAK_HUB_ADDRESS not set. Skipping on-chain listener.');
        return;
    }
    console.log(' Listening for somnia agent ai receipts on-chain...')

    client.watchEvent({
        address: STREAk_HUB_ADDRESS,
        event: predictionLoggedEvent,
        onLogs: async (logs) => {
            const { roundId, confidenceUp, receiptHash } = console.log.args as any;
            console.log(`[Somnia AI] Received confidence for round ${roundId}: ${confidenceUp}% UP`);

            await supabase
                .from('rounds')
                .update({
                    ai_confidence_up: Number(confidenceUp),
                    ai_receipt_tx: receiptHash,
                })
                .eq('id', roundId);
        }
    });
}