import { Bell, ChevronDown } from 'lucide-react'

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between py-6 px-8 border-b border-[#222]">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Welcome back, StreakChaser
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#ef4444]">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
          </svg>
        </h1>
        <div className="flex items-center gap-2 mt-1 text-[#a1a1aa] text-sm">
          <span>Your AI agent is live and trading on Somnia</span>
          <span className="flex items-center gap-1.5 text-emerald-500 font-medium text-xs">
            <span className="live-dot bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.2)]"></span>
            Live
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#333] rounded-full px-4 py-2 text-sm text-white transition-colors">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          Somnia Mainnet
          <ChevronDown size={16} className="text-[#666] ml-1" />
        </button>

        <button className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#333] rounded-full px-4 py-2 text-sm text-white transition-colors">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-orange-500"></div>
          0x7Af3...8c2D
          <ChevronDown size={16} className="text-[#666] ml-1" />
        </button>

        <button className="relative p-2 text-[#a1a1aa] hover:text-white transition-colors border border-[#333] rounded-full bg-[#111] hover:bg-[#1a1a1a]">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-4 h-4 bg-[#ef4444] text-[10px] text-white rounded-full flex items-center justify-center font-bold transform translate-x-1/4 -translate-y-1/4">3</span>
        </button>
      </div>
    </header>
  )
}
