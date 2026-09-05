import { Users, Crosshair, TrendingUp, BarChart2 } from 'lucide-react'

export function FooterStats() {
  return (
    <div className="bg-[#0c0c0c] border-t border-[#222] mt-auto">
      <div className="flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-[#71717a]" />
            <div>
              <div className="text-[10px] text-[#71717a] font-medium uppercase tracking-wider">Total Copied Traders</div>
              <div className="text-lg font-bold text-emerald-500 leading-tight">4</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Crosshair size={20} className="text-[#ef4444]" />
            <div>
              <div className="text-[10px] text-[#71717a] font-medium uppercase tracking-wider">Total Rebel Traders</div>
              <div className="text-lg font-bold text-[#ef4444] leading-tight">2</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-[#71717a]" />
            <div>
              <div className="text-[10px] text-[#71717a] font-medium uppercase tracking-wider">Total Trades (All Time)</div>
              <div className="text-lg font-bold text-white leading-tight">127</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <BarChart2 size={20} className="text-[#71717a]" />
            <div>
              <div className="text-[10px] text-[#71717a] font-medium uppercase tracking-wider">Avg. PnL / Trade</div>
              <div className="text-lg font-bold text-emerald-500 leading-tight">+12.45 <span className="text-[10px] text-[#71717a]">USDC</span></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#111] px-4 py-2 rounded-full border border-[#222]">
          <div className="text-right">
            <div className="text-sm font-bold text-white">Fully automated. You relax.</div>
            <div className="text-[10px] text-[#71717a]">StreakChaser AI handles the rest.</div>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
