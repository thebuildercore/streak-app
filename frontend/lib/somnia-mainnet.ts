// Mainnet DreamDEX indexer for prediction market discovery
// Markets are fetched from mainnet but trades execute on testnet CopyTradeVault
export const DREAMDEX_MAINNET_INDEXER = 'https://api.dreamdex.io/v0'

export interface DreamDexMarket {
  id: string
  poolAddress: string
  question: string
  category: string
  status: string
  volume: string
  createdAt: string
  yesPrice?: number
  noPrice?: number
  liquidity?: string
}

/**
 * Fetch binary prediction markets from DreamDEX mainnet indexer
 */
export async function fetchMainnetMarkets(limit = 20): Promise<DreamDexMarket[]> {
  try {
    const res = await fetch(`${DREAMDEX_MAINNET_INDEXER}/markets?limit=${limit}`, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    })
    if (!res.ok) return []
    const data = await res.json()
    // Adapt response shape to our interface
    return (data.markets || data || []).map((m: any) => ({
      id: m.id || m.marketId,
      poolAddress: m.poolAddress || m.pool,
      question: m.question || m.title || m.name || 'Unknown Market',
      category: m.category || m.tags?.[0] || 'General',
      status: m.status || 'active',
      volume: m.volume || m.totalVolume || '0',
      createdAt: m.createdAt || m.createdAtTimestamp || '',
      yesPrice: m.yesPrice ?? m.lastYesPrice ?? null,
      noPrice: m.noPrice ?? m.lastNoPrice ?? null,
      liquidity: m.liquidity || m.tvl || '0',
    }))
  } catch {
    return []
  }
}
