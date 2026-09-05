'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Crosshair, CheckCircle2 } from 'lucide-react'

export function LiveRadar() {
  const [activeTab, setActiveTab] = useState<'top' | 'losers'>('top')

  const topPerformers = [
    { rank: 1, name: 'CryptoPhoenix', avatar: 'bg-blue-600', verified: true, winRate: '72.4%', pnl: '+1,245.68', pnlPercent: '+124.56%', followers: '1.2K' },
    { rank: 2, name: 'EventOracle', avatar: 'bg-purple-600', verified: true, winRate: '68.7%', pnl: '+932.18', pnlPercent: '+93.21%', followers: '892' },
    { rank: 3, name: 'SomniaWhale', avatar: 'bg-indigo-600', verified: false, winRate: '65.1%', pnl: '+812.45', pnlPercent: '+81.24%', followers: '756' },
    { rank: 4, name: 'AlphaHunter', avatar: 'bg-emerald-600', verified: true, winRate: '61.3%', pnl: '+623.77', pnlPercent: '+62.37%', followers: '623' },
    { rank: 5, name: 'BetMaster', avatar: 'bg-fuchsia-600', verified: true, winRate: '59.8%', pnl: '+511.32', pnlPercent: '+51.13%', followers: '511' },
  ]

  const serialLosers = [
    { rank: 1, name: 'BadBettor99', avatar: 'bg-red-800', verified: false, winRate: '12.4%', pnl: '-3,245.12', pnlPercent: '-82.4%', followers: '2.1K' },
    { rank: 2, name: 'RektRider', avatar: 'bg-orange-800', verified: true, winRate: '18.7%', pnl: '-2,932.18', pnlPercent: '-78.2%', followers: '1.5K' },
    { rank: 3, name: 'PaperHands', avatar: 'bg-yellow-800', verified: false, winRate: '21.1%', pnl: '-1,812.45', pnlPercent: '-65.2%', followers: '890' },
    { rank: 4, name: 'FomoKing', avatar: 'bg-rose-800', verified: true, winRate: '25.3%', pnl: '-1,623.77', pnlPercent: '-54.3%', followers: '720' },
    { rank: 5, name: 'DumpDancer', avatar: 'bg-pink-800', verified: false, winRate: '29.8%', pnl: '-1,511.32', pnlPercent: '-48.1%', followers: '610' },
  ]

  const traders = activeTab === 'top' ? topPerformers : serialLosers

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

      <div className="flex-1 p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#71717a] text-xs border-b border-[#222]">
              <th className="font-normal text-left py-3 px-4 w-12">#</th>
              <th className="font-normal text-left py-3 px-4">Trader</th>
              <th className="font-normal text-right py-3 px-4">Win Rate</th>
              <th className="font-normal text-right py-3 px-4">PnL (7D)</th>
              <th className="font-normal text-right py-3 px-4">Followers</th>
              <th className="font-normal text-center py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {traders.map((trader) => (
              <tr key={trader.name} className="border-b border-[#222]/50 hover:bg-[#111] transition-colors agent-row group">
                <td className="py-3 px-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    trader.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : 
                    trader.rank === 2 ? 'bg-gray-400/20 text-gray-400' : 
                    trader.rank === 3 ? 'bg-amber-600/20 text-amber-600' : 'text-[#71717a]'
                  }`}>
                    {trader.rank}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${trader.avatar} flex items-center justify-center overflow-hidden border border-[#333]`}>
                      <span className="text-[10px] text-white font-bold">{trader.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white font-medium">
                      {trader.name}
                      {trader.verified && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-[#a1a1aa] font-medium">{trader.winRate}</td>
                <td className="py-3 px-4 text-right">
                  <div className={`font-medium ${activeTab === 'top' ? 'text-emerald-500' : 'text-[#ef4444]'}`}>{trader.pnl} USDC</div>
                  <div className={`${activeTab === 'top' ? 'text-emerald-500/70' : 'text-[#ef4444]/70'} text-[10px]`}>{trader.pnlPercent}</div>
                </td>
                <td className="py-3 px-4 text-right text-[#a1a1aa]">{trader.followers}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded transition-colors">
                      Follow
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444] hover:text-white border border-[#ef4444]/20 rounded transition-colors">
                      Rebel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-[#222] text-center">
        <Link href="/dashboard/leaders" className="text-xs text-[#a1a1aa] hover:text-white transition-colors inline-flex items-center gap-1 mx-auto">
          View full leaderboard <span className="text-[#ef4444] ml-1">→</span>
        </Link>
      </div>
    </div>
  )
}
