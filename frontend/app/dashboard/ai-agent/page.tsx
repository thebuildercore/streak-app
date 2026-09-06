'use client'

import { useState } from 'react'
import { ChevronDown, Sun, Target, Flame, CheckCircle2, Circle, Clock, Zap, TrendingUp, Settings, Loader2 } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useSubscriptions, useUserStats } from '@/lib/hooks/useApi'
import { useAuthorizedBot } from '@/lib/hooks/useVault'
import { formatCompact } from '@/lib/hooks/usePrices'

export default function AIAgentPage() {
  const { isConnected } = useAccount()
  const { isActive, isLoading: botLoading } = useAuthorizedBot()
  const { data: subscriptions, loading: subsLoading, subscribe, unsubscribe } = useSubscriptions()
  const { data: stats, loading: statsLoading } = useUserStats()
  
  const [activeMode, setActiveMode] = useState<'follow' | 'rebel'>('follow')
  const isVerified = isConnected && isActive

  // For demo, just use the first active subscription for the selected mode
  const activeSubscription = subscriptions.find(s => s.mode === activeMode.toUpperCase() && s.is_active)

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-end py-6 px-8">
        <div className="flex items-center gap-4">
          <ConnectButton />
          <button className="p-2 text-[#a1a1aa] hover:text-white transition-colors">
            <Sun size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">AI Agent</h1>
          <p className="text-[#a1a1aa] mb-4">Your automated trading agent</p>
          <div className="flex items-center gap-2">
            {botLoading ? (
               <Loader2 size={16} className="animate-spin text-[#71717a]" />
            ) : isVerified ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-500 font-medium">Agent is Active</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
                <span className="text-[#ef4444] font-medium">Agent Setup Required</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-[1.5fr_1fr] gap-8">
          {/* Left Column */}
          <div className="flex flex-col gap-8">
            {/* Mode Section */}
            <div>
              <h2 className="text-sm font-bold text-white mb-4">Mode Configuration</h2>
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
              <h2 className="text-sm font-bold text-white mb-4">Active Strategy ({activeMode.toUpperCase()})</h2>
              {subsLoading ? (
                 <div className="bg-[#111] border border-[#222] rounded-xl p-8 flex items-center justify-center">
                   <Loader2 size={24} className="animate-spin text-[#71717a]" />
                 </div>
              ) : activeSubscription ? (
                <div className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${activeMode === 'follow' ? 'bg-blue-500' : 'bg-red-900'} rounded-full flex items-center justify-center overflow-hidden border border-[#333]`}>
                      <span className="text-sm font-bold text-white">
                        {activeSubscription.leader_address.substring(2, 4).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-white mb-1">
                        {activeSubscription.leader_address.substring(0, 8)}...{activeSubscription.leader_address.substring(38)}
                      </div>
                      <div className="text-xs text-[#71717a]">Allocation: {activeSubscription.allocation_per_trade} USDC/trade</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => unsubscribe(activeSubscription.leader_address)}
                    className="px-6 py-2 bg-[#222] hover:bg-[#333] text-white font-medium rounded border border-[#333] transition-colors"
                  >
                    Unsubscribe
                  </button>
                </div>
              ) : (
                <div className="bg-[#111] border border-[#222] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <div className="text-[#71717a] mb-2">No active subscriptions for {activeMode} mode.</div>
                  <div className="text-xs text-[#a1a1aa]">Go to the dashboard radar to subscribe to a trader.</div>
                </div>
              )}
            </div>

            {/* Global Stats Section */}
            <div>
              <h2 className="text-sm font-bold text-white mb-4">Agent Performance</h2>
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Zap size={16} className="text-[#71717a]" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">Total Trades</div>
                      <div className="text-xs font-medium text-white">
                        {statsLoading ? '...' : stats?.totalTrades || 0}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target size={16} className="text-[#71717a]" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">Win Rate</div>
                      <div className="text-xs font-medium text-white">
                        {statsLoading ? '...' : stats?.winRate || '0.00%'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp size={16} className="text-[#71717a]" />
                    <div>
                      <div className="text-[10px] text-[#71717a]">Total Volume</div>
                      <div className="text-xs font-bold text-emerald-500">
                        {statsLoading ? '...' : formatCompact(stats?.totalVolume || '0')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] text-white font-medium py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              Manage Agent Settings
              <Settings size={16} className="text-[#71717a]" />
            </button>
          </div>

          {/* Right Column */}
          <div>
            <div className="bg-[#0c0c0c] border border-[#222] rounded-2xl p-8 flex flex-col items-center h-full">
              <h2 className="text-sm font-bold text-white w-full text-left mb-12">Agent Status</h2>
              
              <div className="w-32 h-32 rounded-full border border-[#222] flex items-center justify-center relative mb-8">
                {isVerified && (
                  <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                )}
                <div className={`w-24 h-24 rounded-full border flex items-center justify-center relative ${isVerified ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'border-[#333] bg-[#111]'}`}>
                  <svg viewBox="0 0 24 24" className={`w-12 h-12 ${isVerified ? 'text-emerald-500' : 'text-[#71717a]'}`} fill="currentColor">
                    <path d="M12 2a2 2 0 0 1 2 2v2h3a3 3 0 0 1-3 3v8a3 3 0 0 1-3 3h-2.5l-1.5 1.5c-.3.3-.7.5-1.1.5s-.8-.2-1.1-.5l-1.5-1.5H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2zm0 2a.5.5 0 0 0-.5.5V6h1V4.5A.5.5 0 0 0 12 4zM7 8a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 7 19h2.9c.2 0 .4.1.6.2l1.5 1.5c.1.1.2.1.2.1h-.3l1.5-1.5c.2-.2.4-.3.6-.3H17a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17 8H7zm2.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
                  </svg>
                </div>
              </div>

              {isVerified ? (
                <>
                  <div className="text-emerald-500 font-bold mb-2">Active</div>
                  <div className="text-xs text-[#a1a1aa] mb-12">Scanning markets & executing trades</div>
                </>
              ) : (
                <>
                  <div className="text-[#ef4444] font-bold mb-2">Setup Required</div>
                  <div className="text-xs text-[#a1a1aa] mb-12">Authorize agent in Vault to enable</div>
                </>
              )}

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#a1a1aa]">
                    <span className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-[#333]'}`}></span>
                    Market Scan
                  </div>
                  <div className={`${isVerified ? 'text-emerald-500' : 'text-[#71717a]'} text-xs font-medium`}>
                    {isVerified ? 'Live' : 'Inactive'}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#a1a1aa]">
                    <span className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-[#333]'}`}></span>
                    Trade Execution
                  </div>
                  <div className={`${isVerified ? 'text-emerald-500' : 'text-[#71717a]'} text-xs font-medium`}>
                    {isVerified ? 'Live' : 'Inactive'}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#a1a1aa]">
                    <span className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-[#333]'}`}></span>
                    Risk Management
                  </div>
                  <div className={`${isVerified ? 'text-emerald-500' : 'text-[#71717a]'} text-xs font-medium`}>
                    {isVerified ? 'Live' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
