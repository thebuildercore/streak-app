'use client'

import { useState } from 'react'
import { Search, ChevronDown, Bell, Star, CheckCircle2 } from 'lucide-react'

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<'top' | 'losers'>('top')
  const [isThemeOpen, setIsThemeOpen] = useState(false)

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-end py-6 px-8 border-b border-[#222]">
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

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">Events</h1>
          <p className="text-[#a1a1aa] mt-1">Discover and trade on real-world outcomes on DreamDEX</p>
        </div>

        <div className="grid grid-cols-[1.5fr_1fr] gap-6">
          {/* Left Column: Events List */}
          <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col min-h-[600px]">
            <div className="p-4 border-b border-[#222] flex gap-3 relative">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
                <input 
                  type="text" 
                  placeholder="Search events, keywords..." 
                  className="w-full bg-[#111] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setIsThemeOpen(!isThemeOpen)}
                  className={`flex items-center gap-2 bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-sm transition-colors ${isThemeOpen ? 'text-white border-[#555]' : 'text-[#a1a1aa] hover:text-white'}`}
                >
                  All Themes
                  <ChevronDown size={16} />
                </button>
                
                {isThemeOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#111] border border-[#333] rounded-lg shadow-xl z-50 py-2">
                    <div className="px-3 py-1.5 text-xs font-bold text-white">All Themes</div>
                    <button className="w-full text-left px-3 py-1.5 text-sm text-[#a1a1aa] hover:bg-[#222] hover:text-white flex items-center gap-2"><span>🌤️</span> Weather</button>
                    <button className="w-full text-left px-3 py-1.5 text-sm text-[#a1a1aa] hover:bg-[#222] hover:text-white flex items-center gap-2"><span>🌍</span> Geopolitics</button>
                    <button className="w-full text-left px-3 py-1.5 text-sm text-[#a1a1aa] hover:bg-[#222] hover:text-white flex items-center gap-2"><span>🏛️</span> Politics</button>
                    <button className="w-full text-left px-3 py-1.5 text-sm text-[#a1a1aa] hover:bg-[#222] hover:text-white flex items-center gap-2"><span>💰</span> Economy</button>
                    <button className="w-full text-left px-3 py-1.5 text-sm text-[#a1a1aa] hover:bg-[#222] hover:text-white flex items-center gap-2"><span>🏆</span> Sports</button>
                    <button className="w-full text-left px-3 py-1.5 text-sm text-[#a1a1aa] hover:bg-[#222] hover:text-white flex items-center gap-2"><span>🎬</span> Entertainment</button>
                    <button className="w-full text-left px-3 py-1.5 text-sm text-[#a1a1aa] hover:bg-[#222] hover:text-white flex items-center gap-2"><span>🚀</span> Tech & Crypto</button>
                  </div>
                )}
              </div>

              <button className="flex items-center gap-2 bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-sm text-[#a1a1aa] hover:text-white transition-colors">
                Trending
                <ChevronDown size={16} />
              </button>
              
              <button className="flex items-center gap-2 bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-sm text-[#a1a1aa] hover:text-white transition-colors">
                Liquidity
                <ChevronDown size={16} />
              </button>
            </div>

            <div className="grid grid-cols-[1fr_80px_80px_100px_80px] gap-4 px-6 py-3 text-[10px] font-bold text-[#71717a] uppercase tracking-wider border-b border-[#222]">
              <div>Event</div>
              <div className="text-center">Yes</div>
              <div className="text-center">No</div>
              <div className="text-right">Liquidity</div>
              <div></div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Event Row 1 */}
              <div className="grid grid-cols-[1fr_80px_80px_100px_80px] gap-4 px-6 py-4 border-b border-[#222]/50 hover:bg-[#111] transition-colors items-center bg-[#111]">
                <div className="flex gap-4">
                  <div className="text-3xl mt-1">🌍</div>
                  <div>
                    <div className="text-[10px] text-blue-400 font-bold tracking-wider uppercase mb-1">Geopolitics</div>
                    <div className="text-sm font-bold text-white">Will a ceasefire be reached in Ukraine before June 1, 2024?</div>
                    <div className="text-[10px] text-[#71717a] mt-1">$2.45M Vol.</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-500 font-bold text-lg">62%</div>
                  <div className="text-emerald-500 text-[10px]">▲ 4%</div>
                </div>
                <div className="text-center">
                  <div className="text-[#ef4444] font-bold text-lg">38%</div>
                  <div className="text-[#ef4444] text-[10px]">▼ 4%</div>
                </div>
                <div className="text-right text-[#a1a1aa] font-medium">$248K</div>
                <div className="text-right">
                  <button className="px-4 py-1.5 bg-[#222] hover:bg-[#333] text-white text-xs font-medium rounded transition-colors">Trade</button>
                </div>
              </div>

              {/* Event Row 2 */}
              <div className="grid grid-cols-[1fr_80px_80px_100px_80px] gap-4 px-6 py-4 border-b border-[#222]/50 hover:bg-[#111] transition-colors items-center">
                <div className="flex gap-4">
                  <div className="text-3xl mt-1">🇺🇸</div>
                  <div>
                    <div className="text-[10px] text-red-400 font-bold tracking-wider uppercase mb-1">Politics</div>
                    <div className="text-sm font-bold text-white">Will Donald Trump win the 2024 U.S. Presidential election?</div>
                    <div className="text-[10px] text-[#71717a] mt-1">$10.21M Vol.</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-500 font-bold text-lg">55%</div>
                  <div className="text-emerald-500 text-[10px]">▲ 3%</div>
                </div>
                <div className="text-center">
                  <div className="text-[#ef4444] font-bold text-lg">45%</div>
                  <div className="text-[#ef4444] text-[10px]">▼ 3%</div>
                </div>
                <div className="text-right text-[#a1a1aa] font-medium">$1.25M</div>
                <div className="text-right">
                  <button className="px-4 py-1.5 bg-[#222] hover:bg-[#333] text-white text-xs font-medium rounded transition-colors">Trade</button>
                </div>
              </div>

              {/* Event Row 3 */}
              <div className="grid grid-cols-[1fr_80px_80px_100px_80px] gap-4 px-6 py-4 border-b border-[#222]/50 hover:bg-[#111] transition-colors items-center">
                <div className="flex gap-4">
                  <div className="text-3xl mt-1">₿</div>
                  <div>
                    <div className="text-[10px] text-orange-400 font-bold tracking-wider uppercase mb-1">Crypto</div>
                    <div className="text-sm font-bold text-white">Will Bitcoin (BTC) be above $100,000 on June 30, 2024?</div>
                    <div className="text-[10px] text-[#71717a] mt-1">$4.12M Vol.</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-500 font-bold text-lg">48%</div>
                  <div className="text-emerald-500 text-[10px]">▲ 6%</div>
                </div>
                <div className="text-center">
                  <div className="text-[#ef4444] font-bold text-lg">52%</div>
                  <div className="text-[#ef4444] text-[10px]">▼ 6%</div>
                </div>
                <div className="text-right text-[#a1a1aa] font-medium">$512K</div>
                <div className="text-right">
                  <button className="px-4 py-1.5 bg-[#222] hover:bg-[#333] text-white text-xs font-medium rounded transition-colors">Trade</button>
                </div>
              </div>

              {/* Event Row 4 */}
              <div className="grid grid-cols-[1fr_80px_80px_100px_80px] gap-4 px-6 py-4 border-b border-[#222]/50 hover:bg-[#111] transition-colors items-center">
                <div className="flex gap-4">
                  <div className="text-3xl mt-1">⚽</div>
                  <div>
                    <div className="text-[10px] text-green-400 font-bold tracking-wider uppercase mb-1">Sports</div>
                    <div className="text-sm font-bold text-white">Will Real Madrid win the UEFA Champions League 23/24?</div>
                    <div className="text-[10px] text-[#71717a] mt-1">$1.33M Vol.</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-500 font-bold text-lg">71%</div>
                  <div className="text-emerald-500 text-[10px]">▲ 2%</div>
                </div>
                <div className="text-center">
                  <div className="text-[#ef4444] font-bold text-lg">29%</div>
                  <div className="text-[#ef4444] text-[10px]">▼ 2%</div>
                </div>
                <div className="text-right text-[#a1a1aa] font-medium">$182K</div>
                <div className="text-right">
                  <button className="px-4 py-1.5 bg-[#222] hover:bg-[#333] text-white text-xs font-medium rounded transition-colors">Trade</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Event */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col p-6">
              <h2 className="text-sm font-bold text-white mb-4">Selected Event</h2>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-3">
                  <div className="text-3xl">🌍</div>
                  <div>
                    <div className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider inline-block mb-2">Geopolitics</div>
                    <h3 className="text-lg font-bold text-white leading-tight">Will a ceasefire be reached in Ukraine before June 1, 2024?</h3>
                    <div className="flex items-center gap-2 text-xs text-[#71717a] mt-2">
                      <span>$2.45M Vol.</span>
                      <span>•</span>
                      <span>Closes May 31, 2024</span>
                    </div>
                  </div>
                </div>
                <button className="text-[#71717a] hover:text-yellow-500 transition-colors">
                  <Star size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111] border border-emerald-500/30 rounded-xl p-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-bold bg-emerald-500 text-black px-2 py-0.5 rounded uppercase">Yes</div>
                      <div className="text-emerald-500 text-xs font-bold flex items-center gap-1">▲ 4%</div>
                    </div>
                    <div className="text-4xl font-bold text-white mb-4">62%</div>
                    <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors">
                      Bet YES
                    </button>
                  </div>
                </div>

                <div className="bg-[#111] border border-[#ef4444]/30 rounded-xl p-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ef4444]/5 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-bold text-[#ef4444] px-2 py-0.5 uppercase">No</div>
                      <div className="text-[#ef4444] text-xs font-bold flex items-center gap-1">▼ 4%</div>
                    </div>
                    <div className="text-4xl font-bold text-white mb-4">38%</div>
                    <button className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-colors">
                      Bet NO
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Traders on this Event */}
            <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Top Traders on this Event</h3>
                <button className="text-xs text-[#ef4444] hover:text-[#dc2626] transition-colors flex items-center gap-1">
                  See all <span className="text-[10px]">→</span>
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => setActiveTab('top')}
                  className={`px-3 py-1.5 text-xs font-medium rounded border ${activeTab === 'top' ? 'bg-[#111] border-[#ef4444]/50 text-white' : 'border-transparent text-[#71717a] hover:text-white'}`}
                >
                  Top Performers
                </button>
                <button 
                  onClick={() => setActiveTab('losers')}
                  className={`px-3 py-1.5 text-xs font-medium rounded border ${activeTab === 'losers' ? 'bg-[#111] border-[#ef4444]/50 text-white' : 'border-transparent text-[#71717a] hover:text-white'}`}
                >
                  Serial Losers
                </button>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#71717a] border-b border-[#222]">
                    <th className="font-normal text-left py-2 px-1 w-6">#</th>
                    <th className="font-normal text-left py-2 px-1">Trader</th>
                    <th className="font-normal text-right py-2 px-1">PnL (All)</th>
                    <th className="font-normal text-right py-2 px-1">Win Rate</th>
                    <th className="font-normal text-right py-2 px-1">Followers</th>
                    <th className="font-normal text-center py-2 px-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'top' ? (
                    <>
                      <tr className="border-b border-[#222]/50">
                        <td className="py-2 px-1 text-[#71717a]">1</td>
                        <td className="py-2 px-1 flex items-center gap-2">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden"><span className="text-[8px] text-white">AW</span></div>
                          <span className="text-white font-medium">AlphaWolf</span>
                          <CheckCircle2 size={10} className="text-emerald-500" />
                        </td>
                        <td className="py-2 px-1 text-right text-emerald-500 font-medium">+124.5K</td>
                        <td className="py-2 px-1 text-right text-[#a1a1aa]">72%</td>
                        <td className="py-2 px-1 text-right text-[#a1a1aa]">2.1K</td>
                        <td className="py-2 px-1 flex justify-center gap-1">
                          <button className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded hover:bg-emerald-500 hover:text-white transition-colors">Follow</button>
                          <button className="px-2 py-1 bg-[#ef4444]/20 text-[#ef4444] text-[10px] font-bold rounded hover:bg-[#ef4444] hover:text-white transition-colors">Rebel</button>
                        </td>
                      </tr>
                      <tr className="border-b border-[#222]/50">
                        <td className="py-2 px-1 text-[#71717a]">2</td>
                        <td className="py-2 px-1 flex items-center gap-2">
                          <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center overflow-hidden"><span className="text-[8px] text-white">MM</span></div>
                          <span className="text-white font-medium">MarketMaestro</span>
                          <CheckCircle2 size={10} className="text-emerald-500" />
                        </td>
                        <td className="py-2 px-1 text-right text-emerald-500 font-medium">+98.2K</td>
                        <td className="py-2 px-1 text-right text-[#a1a1aa]">68%</td>
                        <td className="py-2 px-1 text-right text-[#a1a1aa]">1.3K</td>
                        <td className="py-2 px-1 flex justify-center gap-1">
                          <button className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded hover:bg-emerald-500 hover:text-white transition-colors">Follow</button>
                          <button className="px-2 py-1 bg-[#ef4444]/20 text-[#ef4444] text-[10px] font-bold rounded hover:bg-[#ef4444] hover:text-white transition-colors">Rebel</button>
                        </td>
                      </tr>
                      <tr className="border-b border-[#222]/50">
                        <td className="py-2 px-1 text-[#71717a]">3</td>
                        <td className="py-2 px-1 flex items-center gap-2">
                          <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center overflow-hidden"><span className="text-[8px] text-white">GI</span></div>
                          <span className="text-white font-medium">GeoInsight</span>
                        </td>
                        <td className="py-2 px-1 text-right text-emerald-500 font-medium">+76.1K</td>
                        <td className="py-2 px-1 text-right text-[#a1a1aa]">65%</td>
                        <td className="py-2 px-1 text-right text-[#a1a1aa]">892</td>
                        <td className="py-2 px-1 flex justify-center gap-1">
                          <button className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded hover:bg-emerald-500 hover:text-white transition-colors">Follow</button>
                          <button className="px-2 py-1 bg-[#ef4444]/20 text-[#ef4444] text-[10px] font-bold rounded hover:bg-[#ef4444] hover:text-white transition-colors">Rebel</button>
                        </td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr className="border-b border-[#222]/50">
                        <td className="py-2 px-1 text-[#71717a]">1</td>
                        <td className="py-2 px-1 flex items-center gap-2">
                          <div className="w-5 h-5 bg-orange-700 rounded-full flex items-center justify-center overflow-hidden"><span className="text-[8px] text-white">BH</span></div>
                          <span className="text-white font-medium">BearHunter</span>
                        </td>
                        <td className="py-2 px-1 text-right text-[#ef4444] font-medium">-54.3K</td>
                        <td className="py-2 px-1 text-right text-[#a1a1aa]">32%</td>
                        <td className="py-2 px-1 text-right text-[#a1a1aa]">456</td>
                        <td className="py-2 px-1 flex justify-center gap-1">
                          <button className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded hover:bg-emerald-500 hover:text-white transition-colors">Follow</button>
                          <button className="px-2 py-1 bg-[#ef4444]/20 text-[#ef4444] text-[10px] font-bold rounded hover:bg-[#ef4444] hover:text-white transition-colors">Rebel</button>
                        </td>
                      </tr>
                      <tr className="border-b border-[#222]/50">
                        <td className="py-2 px-1 text-[#71717a]">2</td>
                        <td className="py-2 px-1 flex items-center gap-2">
                          <div className="w-5 h-5 bg-red-700 rounded-full flex items-center justify-center overflow-hidden"><span className="text-[8px] text-white">CX</span></div>
                          <span className="text-white font-medium">ContrarianX</span>
                        </td>
                        <td className="py-2 px-1 text-right text-[#ef4444] font-medium">-61.2K</td>
                        <td className="py-2 px-1 text-right text-[#a1a1aa]">28%</td>
                        <td className="py-2 px-1 text-right text-[#a1a1aa]">612</td>
                        <td className="py-2 px-1 flex justify-center gap-1">
                          <button className="px-2 py-1 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded hover:bg-emerald-500 hover:text-white transition-colors">Follow</button>
                          <button className="px-2 py-1 bg-[#ef4444]/20 text-[#ef4444] text-[10px] font-bold rounded hover:bg-[#ef4444] hover:text-white transition-colors">Rebel</button>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Streak AI Agent section */}
            <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col p-6">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-white">StreakChaser AI Agent</h3>
                <span className="text-emerald-500 text-[10px] flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
              </div>
              <p className="text-xs text-[#71717a] mb-4">Your AI agent is monitoring this event and top traders 24/7.</p>

              <div className="bg-[#111] border border-[#222] rounded-lg p-4 flex items-center justify-between mb-4">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"><span className="text-xs text-white">AW</span></div>
                    <div>
                      <div className="text-[10px] text-[#71717a]">Copying</div>
                      <div className="text-xs font-bold text-white">AlphaWolf</div>
                    </div>
                  </div>
                  <div className="w-[1px] h-8 bg-[#333]"></div>
                  <div>
                    <div className="text-[10px] text-[#71717a]">Mode</div>
                    <div className="text-xs font-bold text-emerald-500">Follow</div>
                  </div>
                  <div className="w-[1px] h-8 bg-[#333]"></div>
                  <div>
                    <div className="text-[10px] text-[#71717a]">Allocation</div>
                    <div className="text-xs font-bold text-white">25%</div>
                  </div>
                </div>
                <button className="px-4 py-1.5 text-xs font-bold text-white bg-[#222] border border-[#333] rounded hover:bg-[#333] transition-colors">
                  Manage
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-bold text-white mb-1">AI Activity</h4>
                  <div className="text-[10px] text-[#71717a]">Last trade: 2m ago • Next check: 18s</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#71717a] mb-1">Total PnL (This Event)</div>
                  <div className="text-sm font-bold text-emerald-500">+18.42 USDC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
