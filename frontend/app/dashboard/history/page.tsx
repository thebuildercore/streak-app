'use client'

import { History, ArrowUpRight, ArrowDownRight, Bot, ExternalLink, Calendar } from 'lucide-react'

export default function HistoryPage() {
  const trades = [
    { id: 'tx-9081', time: '10 mins ago', market: 'Will Somnia hit 100k TPS testnet by Q4?', type: 'FOLLOW', agent: 'CryptoPhoenix', side: 'YES', amount: '$250.00 USDC', status: 'EXECUTED', pnl: '+$42.50' },
    { id: 'tx-9080', time: '1 hour ago', market: 'Fed Rate Cut 50bps in Sept Meeting?', type: 'REBEL', agent: 'BadBettor99', side: 'NO', amount: '$150.00 USDC', status: 'EXECUTED', pnl: '+$28.10' },
    { id: 'tx-9079', time: '3 hours ago', market: 'Bitcoin > $70k before Friday?', type: 'FOLLOW', agent: 'EventOracle', side: 'YES', amount: '$500.00 USDC', status: 'EXECUTED', pnl: '-$35.00' },
    { id: 'tx-9078', time: 'Yesterday', market: 'Ethereum Gas < 5 gwei weekend avg?', type: 'AUTO', agent: 'Vault Engine', side: 'NO', amount: '$100.00 USDC', status: 'SETTLED', pnl: '+$18.75' },
    { id: 'tx-9077', time: '2 days ago', market: 'Solana Breakpoint Announcement Live?', type: 'FOLLOW', agent: 'AlphaHunter', side: 'YES', amount: '$300.00 USDC', status: 'SETTLED', pnl: '+$64.20' },
  ]

  return (
    <div className="flex-1 bg-[#0c0c0c] min-h-screen text-white p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <History className="text-[#ef4444]" size={28} />
            Execution History
          </h1>
          <p className="text-xs md:text-sm text-[#71717a] mt-1">
            Real-time audit log of your automated bot trades, agent signals, and settled payouts.
          </p>
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <div className="text-xs font-semibold text-white font-mono uppercase tracking-wider">Recent Signals & Auto Executions</div>
          <div className="text-xs text-[#71717a] font-mono">Showing 5 of 128 trades</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[#71717a] text-xs uppercase tracking-wider border-b border-[#222] bg-[#0c0c0c]/50">
                <th className="py-3 px-5">Time & ID</th>
                <th className="py-3 px-5">Prediction Market</th>
                <th className="py-3 px-5">Mode & Signal Source</th>
                <th className="py-3 px-5 text-center">Position</th>
                <th className="py-3 px-5 text-right">Amount</th>
                <th className="py-3 px-5 text-right">Result PnL</th>
                <th className="py-3 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-[#222]/60 hover:bg-[#161616] transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-mono text-xs text-white">{t.id}</div>
                    <div className="text-[10px] text-[#71717a] flex items-center gap-1 mt-0.5">
                      <Calendar size={10} /> {t.time}
                    </div>
                  </td>
                  <td className="py-4 px-5 font-medium text-white max-w-xs truncate">
                    {t.market}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        t.type === 'FOLLOW' ? 'bg-emerald-500/20 text-emerald-400' :
                        t.type === 'REBEL' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {t.type}
                      </span>
                      <span className="text-xs text-[#a1a1aa] font-mono">{t.agent}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                      t.side === 'YES' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30'
                    }`}>
                      {t.side}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right font-mono text-white">
                    {t.amount}
                  </td>
                  <td className="py-4 px-5 text-right font-mono font-bold">
                    <span className={t.pnl.startsWith('+') ? 'text-emerald-400' : 'text-[#ef4444]'}>
                      {t.pnl}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className="text-[10px] font-mono font-bold bg-[#222] text-[#a1a1aa] px-2 py-1 rounded">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
