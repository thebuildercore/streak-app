import { ChevronDown, ArrowRight } from 'lucide-react'

export function BottomWidgets() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Recent Activity */}
      <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col h-full">
        <div className="p-4 border-b border-[#222]">
          <h3 className="text-sm font-bold text-white">Recent Activity</h3>
        </div>
        <div className="p-2 flex-1">
          <div className="flex gap-3 p-2 hover:bg-[#111] rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#333]">
              <span className="text-[10px] text-white font-bold">CR</span>
            </div>
            <div>
              <div className="text-xs text-white">
                <span className="text-[#a1a1aa]">Copied</span> CryptoPhoenix <span className="text-emerald-500 font-bold ml-1 text-[10px] uppercase">FOLLOW</span>
              </div>
              <div className="text-[10px] text-[#71717a] mt-0.5">YES on "Will Bitcoin hit $100k before May?"</div>
            </div>
          </div>
          <div className="flex gap-3 p-2 hover:bg-[#111] rounded-lg transition-colors mt-1">
            <div className="w-8 h-8 rounded-full bg-red-900 flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#333]">
              <span className="text-[10px] text-[#ef4444] font-bold">BB</span>
            </div>
            <div>
              <div className="text-xs text-white">
                <span className="text-[#a1a1aa]">Rebeled against</span> BadBettor99 <span className="text-[#ef4444] font-bold ml-1 text-[10px] uppercase">REBEL</span>
              </div>
              <div className="text-[10px] text-[#71717a] mt-0.5">NO on "Will Trump win the 2024 election?"</div>
            </div>
          </div>
          <div className="flex gap-3 p-2 hover:bg-[#111] rounded-lg transition-colors mt-1">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#333]">
              <span className="text-[10px] text-white font-bold">EV</span>
            </div>
            <div>
              <div className="text-xs text-white">
                <span className="text-[#a1a1aa]">Copied</span> EventOracle <span className="text-emerald-500 font-bold ml-1 text-[10px] uppercase">FOLLOW</span>
              </div>
              <div className="text-[10px] text-[#71717a] mt-0.5">YES on "Will ETH ETF get approved in May?"</div>
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-[#222] text-center">
          <button className="text-xs text-[#a1a1aa] hover:text-white transition-colors flex items-center gap-1 mx-auto">
            View all activity <ArrowRight size={14} className="text-[#a1a1aa]" />
          </button>
        </div>
      </div>

      {/* Market Heatmap */}
      <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col h-full">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Market Heatmap</h3>
            <p className="text-[10px] text-[#71717a] mt-0.5">Top opportunities on DreamDEX</p>
          </div>
          <button className="flex items-center gap-1 text-xs text-white bg-[#111] border border-[#333] px-2 py-1 rounded">
            24H <ChevronDown size={14} />
          </button>
        </div>
        <div className="p-2 flex-1">
          <div className="p-3 hover:bg-[#111] rounded-lg transition-colors flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white mb-1">Will BTC hit $100k before May?</div>
              <div className="flex gap-3 text-[10px] font-bold">
                <span className="text-emerald-500">YES 68%</span>
                <span className="text-[#ef4444]">NO 32%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#a1a1aa] mb-1">Vol. $1.2M</div>
              <div className="text-[10px] text-emerald-500 flex items-center justify-end gap-0.5">↑ 12.4%</div>
            </div>
          </div>
          <div className="p-3 hover:bg-[#111] rounded-lg transition-colors flex items-center justify-between mt-1">
            <div>
              <div className="text-xs font-bold text-white mb-1">Will ETH ETF be approved in May?</div>
              <div className="flex gap-3 text-[10px] font-bold">
                <span className="text-emerald-500">YES 55%</span>
                <span className="text-[#ef4444]">NO 45%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#a1a1aa] mb-1">Vol. $845K</div>
              <div className="text-[10px] text-emerald-500 flex items-center justify-end gap-0.5">↑ 8.7%</div>
            </div>
          </div>
          <div className="p-3 hover:bg-[#111] rounded-lg transition-colors flex items-center justify-between mt-1">
            <div>
              <div className="text-xs font-bold text-white mb-1">Will Solana hit $200 by June?</div>
              <div className="flex gap-3 text-[10px] font-bold">
                <span className="text-emerald-500">YES 61%</span>
                <span className="text-[#ef4444]">NO 39%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#a1a1aa] mb-1">Vol. $612K</div>
              <div className="text-[10px] text-[#ef4444] flex items-center justify-end gap-0.5">↓ 3.2%</div>
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-[#222] text-center">
          <button className="text-xs text-[#a1a1aa] hover:text-white transition-colors flex items-center gap-1 mx-auto">
            Explore markets <ArrowRight size={14} className="text-[#a1a1aa]" />
          </button>
        </div>
      </div>

      {/* Active Positions */}
      <div className="bg-[#0c0c0c] border border-[#222] rounded-xl flex flex-col h-full">
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Active Positions</h3>
          <button className="text-xs text-[#a1a1aa] hover:text-white transition-colors flex items-center gap-1">
            View all <ArrowRight size={14} />
          </button>
        </div>
        <div className="px-4 py-2 border-b border-[#222] flex gap-4 text-xs">
          <button className="text-white font-medium border-b-2 border-white pb-1">All</button>
          <button className="text-[#71717a] hover:text-white transition-colors pb-1">Following (4)</button>
          <button className="text-[#71717a] hover:text-white transition-colors pb-1">Rebeling (2)</button>
        </div>
        <div className="flex-1 p-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#71717a]">
                <th className="font-normal py-2 px-2">Market</th>
                <th className="font-normal py-2 px-2 text-center">Trader</th>
                <th className="font-normal py-2 px-2 text-center">Side</th>
                <th className="font-normal py-2 px-2 text-right">Invested</th>
                <th className="font-normal py-2 px-2 text-right">PnL</th>
                <th className="font-normal py-2 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-[#111] transition-colors group border-b border-[#222]/50">
                <td className="py-2 px-2 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold">₿</div>
                  <span className="text-white truncate max-w-[80px]">BTC $100k before May?</span>
                </td>
                <td className="py-2 px-2">
                  <div className="w-5 h-5 rounded-full bg-blue-600 mx-auto overflow-hidden">
                    <span className="text-[8px] text-white font-bold flex items-center justify-center h-full">CR</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center font-bold text-emerald-500">YES</td>
                <td className="py-2 px-2 text-right text-white">
                  300.00 <span className="text-[10px] text-[#71717a]">USDC</span>
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="text-emerald-500 font-medium">+45.68</div>
                  <div className="text-emerald-500/70 text-[10px]">USDC</div>
                </td>
                <td className="py-2 px-2 text-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_4px_#10b981]"></span>
                </td>
              </tr>
              <tr className="hover:bg-[#111] transition-colors group border-b border-[#222]/50">
                <td className="py-2 px-2 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-300 text-black flex items-center justify-center font-bold">E</div>
                  <span className="text-white truncate max-w-[80px]">ETH ETF approved?</span>
                </td>
                <td className="py-2 px-2">
                  <div className="w-5 h-5 rounded-full bg-purple-600 mx-auto overflow-hidden">
                    <span className="text-[8px] text-white font-bold flex items-center justify-center h-full">EV</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center font-bold text-emerald-500">YES</td>
                <td className="py-2 px-2 text-right text-white">
                  250.00 <span className="text-[10px] text-[#71717a]">USDC</span>
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="text-emerald-500 font-medium">+32.11</div>
                  <div className="text-emerald-500/70 text-[10px]">USDC</div>
                </td>
                <td className="py-2 px-2 text-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_4px_#10b981]"></span>
                </td>
              </tr>
              <tr className="hover:bg-[#111] transition-colors group">
                <td className="py-2 px-2 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">🇺🇸</div>
                  <span className="text-white truncate max-w-[80px]">Trump win 2024?</span>
                </td>
                <td className="py-2 px-2">
                  <div className="w-5 h-5 rounded-full bg-red-900 mx-auto overflow-hidden">
                    <span className="text-[8px] text-[#ef4444] font-bold flex items-center justify-center h-full">BB</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center font-bold text-[#ef4444]">NO</td>
                <td className="py-2 px-2 text-right text-white">
                  200.00 <span className="text-[10px] text-[#71717a]">USDC</span>
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="text-emerald-500 font-medium">+28.45</div>
                  <div className="text-emerald-500/70 text-[10px]">USDC</div>
                </td>
                <td className="py-2 px-2 text-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_4px_#10b981]"></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-[#222] text-center">
          <button className="text-xs text-[#a1a1aa] hover:text-white transition-colors flex items-center gap-1 mx-auto">
            Manage positions <ArrowRight size={14} className="text-[#a1a1aa]" />
          </button>
        </div>
      </div>
    </div>
  )
}
