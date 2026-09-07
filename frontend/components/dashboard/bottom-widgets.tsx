'use client'

import { ChevronDown, ArrowRight, Loader2, TrendingUp } from 'lucide-react'
import { useUserExecutions } from '@/lib/hooks/useApi'
import { useSpotMarkets, parseSpotPrice, formatCompact, formatPrice } from '@/lib/hooks/usePrices'
import Link from 'next/link'

export function BottomWidgets() {
  const { data: executions, loading: executionsLoading } = useUserExecutions(5)
  const { spotMarkets, loading: marketsLoading } = useSpotMarkets()

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Recent Activity */}
      <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col h-full">
        <div className="p-4 border-b border-[#222]">
          <h3 className="text-sm font-bold text-white">Recent Activity</h3>
        </div>
        <div className="p-2 flex-1 relative min-h-[150px]">
          {executionsLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#71717a]" />
            </div>
          ) : executions.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-[#71717a]">
              No recent activity
            </div>
          ) : (
            executions.map(execution => {
              const mode = execution.copy_subscriptions?.mode || 'FOLLOW'
              const leader = execution.copy_subscriptions?.leader_address || 'Unknown'
              const isFollow = mode === 'FOLLOW'
              const isYes = execution.kind === 0 || execution.kind === 1
              
              return (
                <div key={execution.id} className="flex gap-3 p-2 hover:bg-[#111] rounded-lg transition-colors mt-1">
                  <div className={`w-8 h-8 rounded-full ${isFollow ? 'bg-blue-600' : 'bg-red-900'} flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#333]`}>
                    <span className={`text-[10px] ${isFollow ? 'text-white' : 'text-[#ef4444]'} font-bold`}>
                      {leader.substring(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-white truncate">
                      <span className="text-[#a1a1aa]">{isFollow ? 'Copied' : 'Rebeled against'}</span> {leader.substring(0, 6)}... 
                      <span className={`${isFollow ? 'text-emerald-500' : 'text-[#ef4444]'} font-bold ml-1 text-[10px] uppercase`}>{mode}</span>
                    </div>
                    <div className="text-[10px] text-[#71717a] mt-0.5 truncate">
                      {isYes ? 'YES' : 'NO'} {parseFloat(execution.amount).toFixed(2)} USDC
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="p-3 border-t border-[#222] text-center">
          <Link href="/dashboard/history" className="text-xs text-[#a1a1aa] hover:text-white transition-colors inline-flex items-center gap-1 mx-auto">
            View all activity <ArrowRight size={14} className="text-[#a1a1aa]" />
          </Link>
        </div>
      </div>

      {/* Spot Market Heatmap */}
      <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col h-full">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Spot Market Heatmap</h3>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                Somnia Mainnet
              </span>
            </div>
            <p className="text-[10px] text-[#71717a] mt-0.5">Real spot markets on Somnia</p>
          </div>
        </div>
        <div className="p-2 flex-1 relative min-h-[150px]">
          {marketsLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#71717a]" />
            </div>
          ) : !spotMarkets || spotMarkets.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-[#71717a]">
              No spot markets available
            </div>
          ) : (
            spotMarkets.slice(0, 4).map(market => {
              const pair = `${market.baseSymbol || 'TOKEN'}/${market.quoteSymbol || 'USDso'}`
              const rawPrice = parseSpotPrice(market.lastPrice, market.quoteDecimals || 18)
              const rawVol = parseSpotPrice(market.cumulativeQuoteVolume, market.quoteDecimals || 18)
              const trades = parseInt(market.tradeCount || '0', 10)
              
              return (
                <div key={market.id} className="p-2.5 hover:bg-[#111] rounded-lg transition-colors flex items-center justify-between mt-1">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-white mb-0.5 flex items-center gap-1.5">
                      {pair}
                      <span className="text-[10px] text-emerald-400 font-mono font-medium">
                        ${formatPrice(rawPrice, rawPrice < 1 ? 4 : 2)}
                      </span>
                    </div>
                    <div className="flex gap-2 text-[10px] text-[#71717a]">
                      <span>{trades > 0 ? `${trades.toLocaleString()} trades` : 'Live'}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] font-mono text-emerald-400 font-bold">Vol. {formatCompact(rawVol)}</div>
                    <div className="text-[9px] text-[#71717a] mt-0.5">Mainnet</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="p-3 border-t border-[#222] text-center">
          <Link href="/dashboard/events" className="text-xs text-[#a1a1aa] hover:text-white transition-colors inline-flex items-center gap-1 mx-auto">
            Explore markets <ArrowRight size={14} className="text-[#a1a1aa]" />
          </Link>
        </div>
      </div>

      {/* Active Positions */}
      <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col h-full">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Active Positions</h3>
        </div>
        <div className="flex-1 p-2 relative min-h-[150px] flex items-center justify-center">
           <div className="text-center">
             <div className="text-sm text-[#71717a] mb-2">Check Vault Page</div>
             <Link href="/dashboard/vault" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
               Manage positions →
             </Link>
           </div>
        </div>
      </div>
    </div>
  )
}

