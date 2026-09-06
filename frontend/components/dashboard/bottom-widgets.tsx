'use client'

import { ChevronDown, ArrowRight, Loader2 } from 'lucide-react'
import { useUserExecutions } from '@/lib/hooks/useApi'
import { useMarkets } from '@somnia-chain/markets-sdk/react'
import { formatCompact } from '@/lib/hooks/usePrices'
import Link from 'next/link'

export function BottomWidgets() {
  const { data: executions, loading: executionsLoading } = useUserExecutions(5)
  const { data: markets, loading: marketsLoading } = useMarkets({ marketType: 'BINARY', limit: 3 })

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

      {/* Market Heatmap */}
      <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col h-full">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Market Heatmap</h3>
            <p className="text-[10px] text-[#71717a] mt-0.5">Top opportunities on DreamDEX</p>
          </div>
        </div>
        <div className="p-2 flex-1 relative min-h-[150px]">
          {marketsLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#71717a]" />
            </div>
          ) : !markets || markets.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-[#71717a]">
              No markets available
            </div>
          ) : (
            markets.map(market => {
              // Note: using testnet indexer markets here since we're using the default wagmi provider
              const title = (market as any).question || 'Binary Market'
              const volume = (market as any).volume || '0'
              return (
                <div key={market.id} className="p-3 hover:bg-[#111] rounded-lg transition-colors flex items-center justify-between mt-1">
                  <div className="min-w-0 pr-4">
                    <div className="text-xs font-bold text-white mb-1 truncate">{title}</div>
                    <div className="flex gap-3 text-[10px] font-bold">
                      <span className="text-emerald-500">Live</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] text-[#a1a1aa] mb-1">Vol. {formatCompact(volume)}</div>
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
