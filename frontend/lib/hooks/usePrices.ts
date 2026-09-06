'use client'

import { useLivePrice } from '@somnia-chain/markets-sdk/react'

/**
 * Live BTC/USDC price from DreamDEX testnet price feed.
 * Returns the current price and the price feed status.
 */
export function useBtcPrice() {
  const price = useLivePrice('BTC')
  return {
    price: price?.mid ? Number(price.mid) / 1e8 : null,
    raw: price,
  }
}

/**
 * Live ETH/USDC price from DreamDEX testnet price feed.
 */
export function useEthPrice() {
  const price = useLivePrice('ETH')
  return {
    price: price?.mid ? Number(price.mid) / 1e8 : null,
    raw: price,
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
