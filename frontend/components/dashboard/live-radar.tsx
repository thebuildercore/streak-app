'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Crosshair, CheckCircle2, Loader2 } from 'lucide-react'
import { useLeaderboard, useSubscriptions } from '@/lib/hooks/useApi'
import { useAccount } from 'wagmi'

export function LiveRadar() {
  const [activeTab, setActiveTab] = useState<'top' | 'losers'>('top')
  const { data: topPerformers, loading: topLoading } = useLeaderboard('top_performers')
  const { data: serialLosers, loading: losersLoading } = useLeaderboard('serial_losers')
  const { subscribe, unsubscribe, data: subscriptions } = useSubscriptions()
  const { isConnected } = useAccount()

  const [processing, setProcessing] = useState<Record<string, boolean>>({})

  const traders = activeTab === 'top' ? topPerformers : serialLosers
  const isLoading = activeTab === 'top' ? topLoading : losersLoading

  const isSubscribed = (address: string, mode: 'FOLLOW' | 'REBEL') => {
    return subscriptions.some(s => s.leader_address.toLowerCase() === address.toLowerCase() && s.mode === mode)
  }

  const handleSubscribe = async (address: string, mode: 'FOLLOW' | 'REBEL') => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }
    
    setProcessing(prev => ({ ...prev, [address]: true }))
    
    if (isSubscribed(address, mode)) {
      await unsubscribe(address)
    } else {
      // Default allocation of 50 USDC for quick subscribe from radar
      await subscribe(address, mode, '50')
    }
    
    setProcessing(prev => ({ ...prev, [address]: false }))
  }

  return (
    <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col h-full">
      <div className="p-5 border-b border-[#222] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Crosshair size={20} className="text-[#a1a1aa]" />
            Live Radar
          </h2>
          <p className="text-xs text-[#71717a] mt-1">Real-time leaderboard of DreamDEX traders on Somnia</p>
        </div>
        <div className="flex bg-[#111] border border-[#333] rounded-md p-1">
          <button 
            onClick={() => setActiveTab('top')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'top' ? 'bg-emerald-500/20 text-emerald-500' : 'text-[#71717a] hover:text-white'
            }`}
          >
            Top Performers
          </button>
          <button 
            onClick={() => setActiveTab('losers')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'losers' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'text-[#71717a] hover:text-white'
            }`}
          >
            Serial Losers
          </button>
        </div>
      </div>

      <div className="flex-1 p-2 relative min-h-[300px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#71717a]" />
          </div>
        ) : traders.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#71717a]">
            No traders found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#71717a] text-xs border-b border-[#222]">
                <th className="font-normal text-left py-3 px-4 w-12">#</th>
                <th className="font-normal text-left py-3 px-4">Trader</th>
                <th className="font-normal text-right py-3 px-4">Win Rate</th>
                <th className="font-normal text-right py-3 px-4">Reputation</th>
                <th className="font-normal text-center py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {traders.slice(0, 5).map((trader, idx) => {
                const rank = idx + 1
                const isFollowed = isSubscribed(trader.address, 'FOLLOW')
                const isRebelled = isSubscribed(trader.address, 'REBEL')
                const isBusy = processing[trader.address]

                return (
                  <tr key={trader.address} className="border-b border-[#222]/50 hover:bg-[#111] transition-colors agent-row group">
                    <td className="py-3 px-4">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : 
                        rank === 2 ? 'bg-gray-400/20 text-gray-400' : 
                        rank === 3 ? 'bg-amber-600/20 text-amber-600' : 'text-[#71717a]'
                      }`}>
                        {rank}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center overflow-hidden border border-[#333]`}>
                          <span className="text-[10px] text-white font-bold">{trader.address.substring(2, 4).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white font-medium">
                          {trader.address.substring(0, 6)}...{trader.address.substring(38)}
                          {trader.reputation_score > 500 && <CheckCircle2 size={14} className="text-emerald-500" />}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-[#a1a1aa] font-medium">{trader.win_rate}%</td>
                    <td className="py-3 px-4 text-right text-white font-mono">{trader.reputation_score}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          disabled={isBusy || (isRebelled && !isFollowed)}
                          onClick={() => handleSubscribe(trader.address, 'FOLLOW')}
                          className={`px-3 py-1.5 text-xs font-medium border rounded transition-colors disabled:opacity-50 ${
                            isFollowed 
                              ? 'bg-emerald-500 text-white border-emerald-500' 
                              : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border-emerald-500/20'
                          }`}
                        >
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : isFollowed ? 'Following' : 'Follow'}
                        </button>
                        <button 
                          disabled={isBusy || (isFollowed && !isRebelled)}
                          onClick={() => handleSubscribe(trader.address, 'REBEL')}
                          className={`px-3 py-1.5 text-xs font-medium border rounded transition-colors disabled:opacity-50 ${
                            isRebelled
                              ? 'bg-[#ef4444] text-white border-[#ef4444]'
                              : 'bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444] hover:text-white border-[#ef4444]/20'
                          }`}
                        >
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : isRebelled ? 'Rebelling' : 'Rebel'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-3 border-t border-[#222] text-center">
        <Link href="/dashboard/leaders" className="text-xs text-[#a1a1aa] hover:text-white transition-colors inline-flex items-center gap-1 mx-auto">
          View full leaderboard <span className="text-[#ef4444] ml-1">→</span>
        </Link>
      </div>
    </div>
  )
}
