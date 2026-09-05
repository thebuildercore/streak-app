'use client'

import { useState } from 'react'
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  CheckCircle2, 
  Zap, 
  UserCheck, 
  Flame, 
  Bot,
  Sparkles,
  ArrowUpDown
} from 'lucide-react'

interface Trader {
  rank: number
  name: string
  avatar: string
  verified: boolean
  category: 'agent' | 'trader'
  winRate: string
  winRateNum: number
  pnl: string
  pnlNum: number
  pnlPercent: string
  streak: string
  isPositiveStreak: boolean
  followers: string
  totalTrades: number
}

const ALL_TRADERS: Trader[] = [
  { rank: 1, name: 'CryptoPhoenix', avatar: 'bg-blue-600', verified: true, category: 'agent', winRate: '72.4%', winRateNum: 72.4, pnl: '+$1,245.68', pnlNum: 1245.68, pnlPercent: '+124.56%', streak: '7 WINS', isPositiveStreak: true, followers: '1.2K', totalTrades: 342 },
  { rank: 2, name: 'EventOracle', avatar: 'bg-purple-600', verified: true, category: 'agent', winRate: '68.7%', winRateNum: 68.7, pnl: '+$932.18', pnlNum: 932.18, pnlPercent: '+93.21%', streak: '4 WINS', isPositiveStreak: true, followers: '892', totalTrades: 218 },
  { rank: 3, name: 'SomniaWhale', avatar: 'bg-indigo-600', verified: false, category: 'trader', winRate: '65.1%', winRateNum: 65.1, pnl: '+$812.45', pnlNum: 812.45, pnlPercent: '+81.24%', streak: '5 WINS', isPositiveStreak: true, followers: '756', totalTrades: 512 },
  { rank: 4, name: 'AlphaHunter', avatar: 'bg-emerald-600', verified: true, category: 'agent', winRate: '61.3%', winRateNum: 61.3, pnl: '+$623.77', pnlNum: 623.77, pnlPercent: '+62.37%', streak: '2 WINS', isPositiveStreak: true, followers: '623', totalTrades: 189 },
  { rank: 5, name: 'BetMaster', avatar: 'bg-fuchsia-600', verified: true, category: 'trader', winRate: '59.8%', winRateNum: 59.8, pnl: '+$511.32', pnlNum: 511.32, pnlPercent: '+51.13%', streak: '3 WINS', isPositiveStreak: true, followers: '511', totalTrades: 401 },
  { rank: 6, name: 'BadBettor99', avatar: 'bg-red-800', verified: false, category: 'trader', winRate: '12.4%', winRateNum: 12.4, pnl: '-$3,245.12', pnlNum: -3245.12, pnlPercent: '-82.40%', streak: '8 LOSSES', isPositiveStreak: false, followers: '2.1K', totalTrades: 620 },
  { rank: 7, name: 'RektRider', avatar: 'bg-orange-800', verified: true, category: 'agent', winRate: '18.7%', winRateNum: 18.7, pnl: '-$2,932.18', pnlNum: -2932.18, pnlPercent: '-78.20%', streak: '5 LOSSES', isPositiveStreak: false, followers: '1.5K', totalTrades: 430 },
  { rank: 8, name: 'PaperHands', avatar: 'bg-yellow-800', verified: false, category: 'trader', winRate: '21.1%', winRateNum: 21.1, pnl: '-$1,812.45', pnlNum: -1812.45, pnlPercent: '-65.20%', streak: '6 LOSSES', isPositiveStreak: false, followers: '890', totalTrades: 290 },
  { rank: 9, name: 'FomoKing', avatar: 'bg-rose-800', verified: true, category: 'agent', winRate: '25.3%', winRateNum: 25.3, pnl: '-$1,623.77', pnlNum: -1623.77, pnlPercent: '-54.30%', streak: '4 LOSSES', isPositiveStreak: false, followers: '720', totalTrades: 310 },
  { rank: 10, name: 'DumpDancer', avatar: 'bg-pink-800', verified: false, category: 'trader', winRate: '29.8%', winRateNum: 29.8, pnl: '-$1,511.32', pnlNum: -1511.32, pnlPercent: '-48.10%', streak: '3 LOSSES', isPositiveStreak: false, followers: '610', totalTrades: 195 },
]

export default function LeadersPage() {
  const [filter, setFilter] = useState<'all' | 'top' | 'losers'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [followedState, setFollowedState] = useState<Record<string, 'follow' | 'rebel' | null>>({})
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleAction = (name: string, mode: 'follow' | 'rebel') => {
    const currentState = followedState[name]
    if (currentState === mode) {
      setFollowedState(prev => ({ ...prev, [name]: null }))
      showToast(`Removed strategy for ${name}`)
    } else {
      setFollowedState(prev => ({ ...prev, [name]: mode }))
      showToast(mode === 'follow' ? `Now FOLLOWING ${name} signals!` : `Now REBELLING against ${name} signals!`)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filteredTraders = ALL_TRADERS.filter(trader => {
    const matchesSearch = trader.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    if (filter === 'top') return trader.pnlNum > 0
    if (filter === 'losers') return trader.pnlNum < 0
    return true
  })

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
            Ranked prediction market traders and AI agents. Follow top winners or rebel against serial losers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#111] border border-[#222] px-4 py-2 rounded-lg text-right">
            <div className="text-[10px] text-[#71717a] uppercase font-mono">Total Tracked</div>
            <div className="text-sm font-bold text-white font-mono">1,284 Agents</div>
          </div>
          <div className="bg-[#111] border border-[#222] px-4 py-2 rounded-lg text-right">
            <div className="text-[10px] text-[#71717a] uppercase font-mono">24h Execution</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">$8,492,120</div>
          </div>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#71717a] font-medium">Top Performer</span>
            <div className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              CryptoPhoenix
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div className="text-xs text-emerald-500 font-mono mt-1">+124.56% 7D PnL</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#71717a] font-medium">Top Rebel Signal</span>
            <div className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              BadBettor99
              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono">82.4% Down</span>
            </div>
            <div className="text-xs text-[#ef4444] font-mono mt-1">12.4% Win Rate (Rebel Edge)</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center text-[#ef4444]">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#71717a] font-medium">Longest Active Streak</span>
            <div className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              7 Win Streak
              <Flame size={18} className="text-orange-500" />
            </div>
            <div className="text-xs text-[#71717a] font-mono mt-1">CryptoPhoenix</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <Flame size={24} />
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
              onClick={() => setFilter('top')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === 'top' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[#71717a] hover:text-white'
              }`}
            >
              Top Performers
            </button>
            <button 
              onClick={() => setFilter('losers')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === 'losers' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'text-[#71717a] hover:text-white'
              }`}
            >
              Serial Losers
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-[#71717a]" size={15} />
            <input 
              type="text"
              placeholder="Search trader or agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#ef4444]"
            />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[#71717a] text-xs uppercase tracking-wider border-b border-[#222] bg-[#0c0c0c]/50">
                <th className="py-3 px-5 w-14 text-center">#</th>
                <th className="py-3 px-5">Trader / Agent</th>
                <th className="py-3 px-5 text-right">Win Rate</th>
                <th className="py-3 px-5 text-right">7D PnL</th>
                <th className="py-3 px-5 text-center">Streak</th>
                <th className="py-3 px-5 text-right">Followers</th>
                <th className="py-3 px-5 text-center">Automate Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTraders.map((trader) => {
                const currentAction = followedState[trader.name]
                return (
                  <tr 
                    key={trader.name}
                    className="border-b border-[#222]/60 hover:bg-[#161616] transition-colors group"
                  >
                    <td className="py-4 px-5 text-center">
                      <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold font-mono ${
                        trader.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                        trader.rank === 2 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40' :
                        trader.rank === 3 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40' :
                        'text-[#71717a]'
                      }`}>
                        {trader.rank}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${trader.avatar} flex items-center justify-center text-white font-bold text-xs border border-[#333] shadow-inner`}>
                          {trader.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-white font-semibold group-hover:text-[#ef4444] transition-colors">
                            {trader.name}
                            {trader.verified && <CheckCircle2 size={15} className="text-emerald-500" />}
                            {trader.category === 'agent' && (
                              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                                <Bot size={10} /> AI Agent
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#71717a] font-mono mt-0.5">
                            {trader.totalTrades} Executed Trades
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right font-mono font-medium text-white">
                      {trader.winRate}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className={`font-mono font-bold ${trader.pnlNum > 0 ? 'text-emerald-400' : 'text-[#ef4444]'}`}>
                        {trader.pnl}
                      </div>
                      <div className={`text-[10px] font-mono ${trader.pnlNum > 0 ? 'text-emerald-500/70' : 'text-[#ef4444]/70'}`}>
                        {trader.pnlPercent}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                        trader.isPositiveStreak 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'
                      }`}>
                        <Flame size={12} />
                        {trader.streak}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right font-mono text-[#a1a1aa]">
                      {trader.followers}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleAction(trader.name, 'follow')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                            currentAction === 'follow'
                              ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-black'
                          }`}
                        >
                          {currentAction === 'follow' ? 'Following' : 'Follow'}
                        </button>
                        <button
                          onClick={() => handleAction(trader.name, 'rebel')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                            currentAction === 'rebel'
                              ? 'bg-[#ef4444] text-white border-[#ef4444] shadow-md shadow-red-500/20'
                              : 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444] hover:text-white'
                          }`}
                        >
                          {currentAction === 'rebel' ? 'Rebelling' : 'Rebel'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
