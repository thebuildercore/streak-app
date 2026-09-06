'use client'

import { useState } from 'react'
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  CheckCircle2, 
  Bot,
  Sparkles,
  Loader2
} from 'lucide-react'
import { useLeaderboard, useSubscriptions } from '@/lib/hooks/useApi'
import { useAccount } from 'wagmi'

export default function LeadersPage() {
  const [filter, setFilter] = useState<'all' | 'top_performers' | 'serial_losers'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [processing, setProcessing] = useState<Record<string, boolean>>({})

  const { isConnected } = useAccount()
  
  // Use undefined for 'all' to fetch everyone
  const filterParam = filter === 'all' ? undefined : filter
  const { data: traders, loading: tradersLoading } = useLeaderboard(filterParam)
  const { data: subscriptions, subscribe, unsubscribe } = useSubscriptions()

  const isSubscribed = (address: string, mode: 'FOLLOW' | 'REBEL') => {
    return subscriptions.some(s => s.leader_address.toLowerCase() === address.toLowerCase() && s.mode === mode)
  }

  const handleAction = async (address: string, mode: 'FOLLOW' | 'REBEL') => {
    if (!isConnected) {
      showToast("Please connect your wallet first")
      return
    }

    setProcessing(prev => ({ ...prev, [address]: true }))
    
    try {
      if (isSubscribed(address, mode)) {
        await unsubscribe(address)
        showToast(`Removed strategy for ${address.substring(0, 6)}`)
      } else {
        await subscribe(address, mode, '50')
        showToast(mode === 'FOLLOW' ? `Now FOLLOWING ${address.substring(0, 6)} signals!` : `Now REBELLING against ${address.substring(0, 6)} signals!`)
      }
    } finally {
      setProcessing(prev => ({ ...prev, [address]: false }))
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filteredTraders = traders.filter(trader => {
    const matchesSearch = trader.address.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    return true
  })

  // Sort by win rate / reputation based on filter
  if (filter === 'serial_losers') {
    filteredTraders.sort((a, b) => a.win_rate - b.win_rate)
  } else {
    filteredTraders.sort((a, b) => b.win_rate - a.win_rate)
  }

  return (
    <div className="flex-1 bg-[#0c0c0c] min-h-screen text-white p-8 overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#111] border border-emerald-500/50 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="text-emerald-500" size={18} />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#ef4444] uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
            Somnia Network Leaders
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Trophy className="text-yellow-500" size={28} />
            Leaderboard & Signal Discovery
          </h1>
          <p className="text-xs md:text-sm text-[#71717a] mt-1">
            Ranked prediction market traders. Follow top winners or rebel against serial losers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#111] border border-[#222] px-4 py-2 rounded-lg text-right">
            <div className="text-[10px] text-[#71717a] uppercase font-mono">Total Tracked</div>
            <div className="text-sm font-bold text-white font-mono">
              {tradersLoading ? '...' : traders.length} Wallets
            </div>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table Container */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden shadow-2xl">
        {/* Filters & Search Toolbar */}
        <div className="p-4 md:p-5 border-b border-[#222] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center bg-[#0c0c0c] border border-[#333] rounded-lg p-1">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === 'all' ? 'bg-[#222] text-white' : 'text-[#71717a] hover:text-white'
              }`}
            >
              All Traders
            </button>
            <button 
              onClick={() => setFilter('top_performers')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === 'top_performers' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[#71717a] hover:text-white'
              }`}
            >
              Top Performers
            </button>
            <button 
              onClick={() => setFilter('serial_losers')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === 'serial_losers' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'text-[#71717a] hover:text-white'
              }`}
            >
              Serial Losers
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-[#71717a]" size={15} />
            <input 
              type="text"
              placeholder="Search wallet address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#ef4444]"
            />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto min-h-[400px] relative">
          {tradersLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#71717a]" />
            </div>
          ) : filteredTraders.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[#71717a]">
              No traders found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[#71717a] text-xs uppercase tracking-wider border-b border-[#222] bg-[#0c0c0c]/50">
                  <th className="py-3 px-5 w-14 text-center">#</th>
                  <th className="py-3 px-5">Trader Address</th>
                  <th className="py-3 px-5 text-right">Win Rate</th>
                  <th className="py-3 px-5 text-right">Reputation</th>
                  <th className="py-3 px-5 text-center">Trades</th>
                  <th className="py-3 px-5 text-center">Automate Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTraders.map((trader, idx) => {
                  const isFollowed = isSubscribed(trader.address, 'FOLLOW')
                  const isRebelled = isSubscribed(trader.address, 'REBEL')
                  const isBusy = processing[trader.address]
                  const rank = idx + 1

                  return (
                    <tr 
                      key={trader.address}
                      className="border-b border-[#222]/60 hover:bg-[#161616] transition-colors group"
                    >
                      <td className="py-4 px-5 text-center">
                        <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold font-mono ${
                          rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                          rank === 2 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40' :
                          rank === 3 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40' :
                          'text-[#71717a]'
                        }`}>
                          {rank}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center text-white font-bold text-xs border border-[#333] shadow-inner`}>
                            {trader.address.substring(2, 4).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-white font-semibold group-hover:text-emerald-500 transition-colors">
                              {trader.address.substring(0, 8)}...{trader.address.substring(38)}
                              {trader.reputation_score > 500 && <CheckCircle2 size={15} className="text-emerald-500" />}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right font-mono font-medium text-white">
                        {trader.win_rate}%
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="font-mono font-bold text-white">
                          {trader.reputation_score}
                        </div>
                      </td>

                      <td className="py-4 px-5 text-center font-mono text-[#a1a1aa]">
                        {trader.total_trades}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={isBusy || (isRebelled && !isFollowed)}
                            onClick={() => handleAction(trader.address, 'FOLLOW')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all disabled:opacity-50 min-w-[80px] ${
                              isFollowed
                                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-black'
                            }`}
                          >
                            {isBusy ? <Loader2 size={14} className="animate-spin mx-auto" /> : isFollowed ? 'Following' : 'Follow'}
                          </button>
                          <button
                            disabled={isBusy || (isFollowed && !isRebelled)}
                            onClick={() => handleAction(trader.address, 'REBEL')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all disabled:opacity-50 min-w-[80px] ${
                              isRebelled
                                ? 'bg-[#ef4444] text-white border-[#ef4444] shadow-md shadow-red-500/20'
                                : 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444] hover:text-white'
                            }`}
                          >
                            {isBusy ? <Loader2 size={14} className="animate-spin mx-auto" /> : isRebelled ? 'Rebelling' : 'Rebel'}
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
      </div>
    </div>
  )
}
