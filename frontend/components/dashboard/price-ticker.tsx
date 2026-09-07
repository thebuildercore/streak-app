'use client'

import { useBtcPrice, useEthPrice, useSpotMarkets, parseSpotPrice, formatPrice } from '@/lib/hooks/usePrices'

export function PriceTicker() {
  const { price: btcPrice } = useBtcPrice()
  const { price: ethPrice } = useEthPrice()
  const { spotMarkets } = useSpotMarkets()
  
  const somiMarket = spotMarkets.find(m => m.baseSymbol === 'SOMI')
  const somiPrice = somiMarket ? parseSpotPrice(somiMarket.lastPrice, somiMarket.quoteDecimals || 18) : null

  return (
    <div className="flex items-center gap-3">
      {/* Mainnet Tag */}
      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1 text-emerald-400 font-mono text-[10px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Mainnet Spot
      </div>

      <div className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-full px-3 py-1.5">
        <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
          <span className="text-[10px] font-bold text-orange-500">₿</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#71717a] font-medium">BTC</span>
          <span className="text-xs font-bold text-white font-mono">
            ${btcPrice !== null && btcPrice > 0 ? formatPrice(btcPrice, 0) : '79,618'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-full px-3 py-1.5">
        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
          <span className="text-[10px] font-bold text-blue-400">Ξ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#71717a] font-medium">ETH</span>
          <span className="text-xs font-bold text-white font-mono">
            ${ethPrice !== null && ethPrice > 0 ? formatPrice(ethPrice, 2) : '2,510.39'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-full px-3 py-1.5">
        <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
          <span className="text-[10px] font-bold text-purple-400">S</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#71717a] font-medium">SOMI</span>
          <span className="text-xs font-bold text-white font-mono">
            ${somiPrice !== null && somiPrice > 0 ? formatPrice(somiPrice, 4) : '0.1358'}
          </span>
        </div>
      </div>
    </div>
  )
}

