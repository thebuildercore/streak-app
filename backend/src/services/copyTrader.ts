import { createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { supabase } from '../db/supabase';

// Somnia Shannon testnet setup
const somniaTestnet = {
    id: 50312,
    name: 'Somnia Shannon Testnet',
    nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
    rpcUrls: { default: { http: [process.env.RPC_URL || 'https://dream-rpc.somnia.network'] } },
};

const botAccount = privateKeyToAccount(`0x${process.env.BOT_PRIVATE_KEY}`);
const client = createWalletClient({
    account: botAccount,
    chain: somniaTestnet,
    transport: http(),
});

const VAULT_ABI = parseAbi([
    'function executeCopyTrade(address marketPool, uint8 kind, uint256 amount, uint256 limitPrice) external',
]);

/**
 * Dispatches automated trades to user vaults when a leader acts
 */
export async function dispatchCopyTrades(
    leaderAddress: string,
    marketPool: string,
    leaderKind: number, // 0=BUY_YES, 1=SELL_YES, 2=BUY_NO, 3=SELL_NO
    limitPrice: bigint
) {
    // 1. Find all active subscribers for this leader
    const { data: subs, error } = await supabase
        .from('copy_subscriptions')
        .select('*')
        .eq('leader_address', leaderAddress.toLowerCase())
        .eq('is_active', true);

    if (error || !subs || subs.length === 0) return;

    for (const sub of subs) {
        try {
            // 2. Determine trade direction: Follow vs. Rebel
            let targetKind = leaderKind;
            if (sub.mode === 'REBEL') {
                // Invert the outcome: BUY_YES (0) -> BUY_NO (2), BUY_NO (2) -> BUY_YES (0)
                if (leaderKind === 0) targetKind = 2;
                else if (leaderKind === 2) targetKind = 0;
                else if (leaderKind === 1) targetKind = 3;
                else if (leaderKind === 3) targetKind = 1;
            }

            const amountToTrade = BigInt(sub.allocation_per_trade);

            // 3. Bot calls executeCopyTrade on the user's specific Vault
            const txHash = await client.writeContract({
                address: sub.user_vault_address as `0x${string}`,
                abi: VAULT_ABI,
                functionName: 'executeCopyTrade',
                args: [marketPool as `0x${string}`, targetKind, amountToTrade, limitPrice],
            });

            // 4. Log the execution in the database
            await supabase.from('copy_executions').insert({
                subscription_id: sub.id,
                user_vault_address: sub.user_vault_address,
                market_pool: marketPool,
                kind: targetKind,
                amount: sub.allocation_per_trade,
                tx_hash: txHash,
                status: 'SUCCESS',
            });
        } catch (err: any) {
            console.error(`Failed to copy trade for vault ${sub.user_vault_address}:`, err);
        }
    }
}