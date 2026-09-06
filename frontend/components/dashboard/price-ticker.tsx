'use client'

import { useBtcPrice, useEthPrice, formatPrice } from '@/lib/hooks/usePrices'

export function PriceTicker() {
  const { price: btcPrice } = useBtcPrice()
  const { price: ethPrice } = useEthPrice()

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-full px-3 py-1.5">
        <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
          <span className="text-[10px] font-bold text-orange-500">₿</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#71717a] font-medium">BTC</span>
          <span className="text-xs font-bold text-white font-mono">
            ${btcPrice !== null ? formatPrice(btcPrice, 0) : '—'}
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
            ${ethPrice !== null ? formatPrice(ethPrice, 0) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
