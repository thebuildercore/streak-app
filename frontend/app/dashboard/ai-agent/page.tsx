'use client'

import { useState } from 'react'
import { ChevronDown, Sun, Target, Flame, CheckCircle2, Circle, Clock, Zap, TrendingUp, Settings } from 'lucide-react'

export default function AIAgentPage() {
  const [activeMode, setActiveMode] = useState<'follow' | 'rebel'>('follow')

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-end py-6 px-8">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#333] rounded-full px-4 py-2 text-sm text-white transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            Somnia Mainnet
            <ChevronDown size={16} className="text-[#666] ml-1" />
          </button>

          <button className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#333] rounded-full px-4 py-2 text-sm text-white transition-colors">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-orange-500"></div>
            0x7Af3...8c2D
            <ChevronDown size={16} className="text-[#666] ml-1" />
          </button>

          <button className="p-2 text-[#a1a1aa] hover:text-white transition-colors">
            <Sun size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">AI Agent</h1>
          <p className="text-[#a1a1aa] mb-4">Your automated trading agent</p>
          <div className="flex items-center gap-2 text-emerald-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Agent is Active
          </div>
        </div>

        <div className="grid grid-cols-[1.5fr_1fr] gap-8">
          {/* Left Column */}
          <div className="flex flex-col gap-8">
            {/* Mode Section */}
            <div>
              <h2 className="text-sm font-bold text-white mb-4">Mode</h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setActiveMode('follow')}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    activeMode === 'follow' 
                      ? 'bg-[#111] border-emerald-500/50' 
                      : 'bg-[#111] border-[#222] hover:border-[#333]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                      <Target size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">Follow Mode</div>
                      <div className="text-[10px] text-[#71717a]">Copy top traders</div>
                    </div>
                  </div>
                  {activeMode === 'follow' ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Circle size={20} className="text-[#333]" />
                  )}
                </button>

                <button 
                  onClick={() => setActiveMode('rebel')}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    activeMode === 'rebel' 
                      ? 'bg-[#111] border-[#ef4444]/50' 
                      : 'bg-[#111] border-[#222] hover:border-[#333]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-[#ef4444]/30 flex items-center justify-center text-[#ef4444]">
                      <Flame size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">Rebel Mode</div>
                      <div className="text-[10px] text-[#71717a]">Take opposite positions</div>
                    </div>
                  </div>
                  {activeMode === 'rebel' ? (
                    <CheckCircle2 size={20} className="text-[#ef4444]" />
                  ) : (
                    <Circle size={20} className="text-[#333]" />
                  )}
                </button>
              </div>
            </div>

            {/* Active Strategy Section */}
            <div>
              <h2 className="text-sm font-bold text-white mb-4">Active Strategy</h2>
              <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden border border-[#333]">
                    <span className="text-sm font-bold text-white">AW</span>
                  </div>
                  <div>
                    <div className="font-bold text-white mb-1">AlphaWolf</div>
                    <div className="text-xs text-[#71717a]">72% Win Rate <span className="mx-2">|</span> 1.2K Followers</div>
                  </div>
                </div>
                <button className="px-6 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-medium rounded border border-emerald-500/20 transition-colors">
                  Following
                </button>
              </div>
            </div>

            {/* Allocation Section */}
            <div>
              <h2 className="text-sm font-bold text-white mb-4">Allocation</h2>
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1 bg-[#222] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-1/4 rounded-full"></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-emerald-500">25%</div>
                    <div className="text-[10px] text-[#71717a]">of vault</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-[#222]">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-[#71717a]" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">Last trade</div>
                      <div className="text-xs font-medium text-white">2m ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap size={16} className="text-[#71717a]" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">Trades today</div>
                      <div className="text-xs font-medium text-white">12</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp size={16} className="text-[#71717a]" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">Total PnL</div>
                      <div className="text-xs font-bold text-emerald-500">+$18.42</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] text-white font-medium py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              Manage Agent
              <Settings size={16} className="text-[#71717a]" />
            </button>
          </div>

          {/* Right Column */}
          <div>
            <div className="bg-[#0c0c0c] border border-[#222] rounded-2xl p-8 flex flex-col items-center h-full">
              <h2 className="text-sm font-bold text-white w-full text-left mb-12">Agent Status</h2>
              
              <div className="w-32 h-32 rounded-full border border-[#222] flex items-center justify-center relative mb-8">
                <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="w-24 h-24 rounded-full border border-emerald-500/40 flex items-center justify-center relative bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                  {/* Robot Face SVG */}
                  <svg viewBox="0 0 24 24" className="w-12 h-12 text-emerald-500" fill="currentColor">
                    <path d="M12 2a2 2 0 0 1 2 2v2h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2.5l-1.5 1.5c-.3.3-.7.5-1.1.5s-.8-.2-1.1-.5l-1.5-1.5H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2zm0 2a.5.5 0 0 0-.5.5V6h1V4.5A.5.5 0 0 0 12 4zM7 8a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 7 19h2.9c.2 0 .4.1.6.2l1.5 1.5c.1.1.2.1.2.1h-.3l1.5-1.5c.2-.2.4-.3.6-.3H17a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17 8H7zm2.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
                  </svg>
                </div>
              </div>

              <div className="text-emerald-500 font-bold mb-2">Active</div>
              <div className="text-xs text-[#a1a1aa] mb-12">Scanning markets & executing trades</div>

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#a1a1aa]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Market Scan
                  </div>
                  <div className="text-emerald-500 text-xs font-medium">Live</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#a1a1aa]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Trade Execution
                  </div>
                  <div className="text-emerald-500 text-xs font-medium">Live</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#a1a1aa]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Risk Management
                  </div>
                  <div className="text-emerald-500 text-xs font-medium">Live</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
