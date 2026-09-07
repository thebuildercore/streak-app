import { useMarkets } from '@somnia-chain/markets-sdk/react'
import { SpotMarket } from '@somnia-chain/markets-sdk'

/**
 * Parse raw price string from spot market using quoteDecimals
 */
export function parseSpotPrice(lastPrice: string | null | undefined, decimals = 18): number {
  if (!lastPrice) return 0
  try {
    const val = Number(BigInt(lastPrice)) / Math.pow(10, decimals)
    return isNaN(val) ? 0 : val
  } catch {
    const val = parseFloat(lastPrice) / Math.pow(10, decimals)
    return isNaN(val) ? 0 : val
  }
}

/**
 * Hook to fetch live Spot markets directly from Somnia (Mainnet or Devnet)
 */
export function useSpotMarkets() {
  const { data: markets, loading, error } = useMarkets({ marketType: 'SPOT', limit: 10 })
  
  const spotMarkets = (markets || []).filter((m): m is SpotMarket => m.marketType === 'SPOT')

  return {
    spotMarkets,
    loading,
    error,
    isMainnet: true // SDK points to Somnia Mainnet indexer (prd.smk.somnia.host)
  }
}

/**
 * Live BTC/USDC price from DreamDEX spot markets or price feed
 */
export function useBtcPrice() {
  const { spotMarkets } = useSpotMarkets()
  const btcMarket = spotMarkets.find(m => m.baseSymbol === 'WBTC' || m.baseSymbol === 'BTC')
  
  if (btcMarket) {
    return {
      price: parseSpotPrice(btcMarket.lastPrice, btcMarket.quoteDecimals || 18),
      market: btcMarket,
      isMainnet: true,
    }
  }

  return {
    price: null,
    market: null,
    isMainnet: true,
  }
}

/**
 * Live ETH/USDC price from DreamDEX spot markets
 */
export function useEthPrice() {
  const { spotMarkets } = useSpotMarkets()
  const ethMarket = spotMarkets.find(m => m.baseSymbol === 'WETH' || m.baseSymbol === 'ETH')
  
  if (ethMarket) {
    return {
      price: parseSpotPrice(ethMarket.lastPrice, ethMarket.quoteDecimals || 18),
      market: ethMarket,
      isMainnet: true,
    }
  }

  return {
    price: null,
    market: null,
    isMainnet: true,
  }
}

/**
 * Format a price number to a readable string with commas
 */
export function formatPrice(price: number | null, decimals = 2): string {
  if (price === null || price === undefined) return '—'
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format a large number to K/M/B shorthand
 */
export function formatCompact(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`
  return `$${num.toFixed(2)}`
}

