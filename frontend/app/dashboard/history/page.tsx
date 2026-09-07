'use client'

import { useState } from 'react'
import { History, Download, Filter, ArrowUpRight, ArrowDownRight, ExternalLink, Bot, Target, Flame, Loader2 } from 'lucide-react'
import { useUserExecutions, ExecutionData } from '@/lib/hooks/useApi'

export default function HistoryPage() {
  const [filter, setFilter] = useState<'ALL' | 'FOLLOW' | 'REBEL'>('ALL')
  const { data: executions, loading } = useUserExecutions(50)

  const filteredHistory = (executions || []).filter((trade: ExecutionData) => {
    const mode = trade.copy_subscriptions?.mode || 'FOLLOW'
    if (filter === 'ALL') return true
    return mode === filter
  })

  return (
    <div className="flex-1 bg-[#0c0c0c] min-h-screen text-white p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <History className="text-[#a1a1aa]" size={28} />
            Execution History
          </h1>
          <p className="text-xs md:text-sm text-[#71717a] mt-1">
            Complete log of automated trades executed by your agent on Somnia.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] px-4 py-2 rounded-lg text-xs font-semibold transition-colors">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden shadow-2xl">
        {/* Filters */}
        <div className="p-4 border-b border-[#222] flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#71717a] text-xs font-bold uppercase tracking-wider">
            <Filter size={14} />
            Filter By Mode:
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === 'ALL' ? 'bg-[#222] text-white' : 'text-[#71717a] hover:text-white'}`}
            >
              All Trades
            </button>
            <button 
              onClick={() => setFilter('FOLLOW')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === 'FOLLOW' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[#71717a] hover:text-white'}`}
            >
              <Target size={12} />
              Follow Mode
            </button>
            <button 
              onClick={() => setFilter('REBEL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filter === 'REBEL' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'text-[#71717a] hover:text-white'}`}
            >
              <Flame size={12} />
              Rebel Mode
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px] relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#71717a]" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#71717a]">
              <History size={48} className="mb-4 opacity-50" />
              <p>No trade history found.</p>
              <p className="text-xs mt-2">Trades executed by your agent will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[#71717a] text-xs uppercase tracking-wider border-b border-[#222] bg-[#0c0c0c]/50">
                  <th className="py-3 px-5">Time</th>
                  <th className="py-3 px-5">Market Pool</th>
                  <th className="py-3 px-5">Strategy</th>
                  <th className="py-3 px-5">Action</th>
                  <th className="py-3 px-5 text-right">Size</th>
                  <th className="py-3 px-5 text-center">Tx</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((trade: ExecutionData) => {
                  const mode = trade.copy_subscriptions?.mode || 'FOLLOW'
                  const leader = trade.copy_subscriptions?.leader_address || 'Unknown'
                  const isYes = trade.kind === 0 || trade.kind === 1

                  return (
                    <tr key={trade.id} className="border-b border-[#222]/60 hover:bg-[#161616] transition-colors">
                      <td className="py-3 px-5 font-mono text-xs text-[#a1a1aa]">
                        {new Date(trade.executed_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-5 font-mono text-xs text-white">
                        {(trade.market_pool || '').substring(0, 8)}...
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          {mode === 'FOLLOW' ? (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                              <Target size={10} /> FOLLOW
                            </span>
                          ) : (
                            <span className="text-[10px] bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                              <Flame size={10} /> REBEL
                            </span>
                          )}
                          <span className="text-[10px] text-[#71717a] font-mono" title={leader}>
                            {leader.substring(0, 6)}...
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        {isYes ? (
                          <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                            <ArrowUpRight size={14} /> Buy YES
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[#ef4444] font-bold text-xs">
                            <ArrowDownRight size={14} /> Buy NO
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right font-mono text-white text-xs">
                        {trade.amount} USDC
                      </td>
                      <td className="py-3 px-5 text-center">
                        <a 
                          href={`https://explorer.somnia.network/tx/${trade.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center p-1.5 rounded bg-[#222] hover:bg-[#333] text-[#a1a1aa] hover:text-white transition-colors"
                          title="View on Explorer"
                        >
                          <ExternalLink size={14} />
                        </a>
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

