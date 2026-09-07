'use client'

import { Info, Flame, Copy, Loader2, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { useVaultBalance, useAuthorizedBot } from '@/lib/hooks/useVault'
import { formatCompact } from '@/lib/hooks/usePrices'
import Link from 'next/link'
import { useAccount } from 'wagmi'


export function AIVaultSection() {
  const { isConnected } = useAccount()
  const { balance, isLoading: balanceLoading } = useVaultBalance()
  const { isActive, isLoading: botLoading } = useAuthorizedBot()

  const isVerified = isConnected && isActive
  const displayBalance = balanceLoading ? '...' : parseFloat(balance).toFixed(2)

  return (
    <div className="bg-[#0c0c0c] border border-[#222] rounded-xl p-6 h-full flex flex-col">
      <h2 className="text-lg font-bold text-white mb-6">Your Vault & AI Agent</h2>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#71717a] mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-sm font-medium">Vault Balance</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-white">
              {displayBalance}
            </span>
            <span className="text-sm text-[#71717a] font-medium">USDC</span>
          </div>
          <div className="text-xs text-[#71717a] mt-1">≈ ${displayBalance}</div>

        </div>

        <div className="text-right">
          <div className="text-sm font-medium text-[#71717a] mb-1">Available to Deploy</div>
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-xl font-bold text-white">
              {displayBalance}
            </span>
            <span className="text-xs text-[#71717a] font-medium">USDC</span>
          </div>
          <Link
            href="/dashboard/vault"
            className="inline-block mt-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold py-2 px-5 rounded transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            Manage Funds
          </Link>
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-lg p-4 mb-6 relative overflow-hidden group">
        <div className={`absolute right-0 top-0 w-32 h-32 blur-3xl -mr-10 -mt-10 rounded-full transition-colors ${isVerified ? 'bg-emerald-500/10' : 'bg-[#ef4444]/10'
          }`}></div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white">AI Agent Status</span>
              {botLoading ? (
                <Loader2 size={12} className="animate-spin text-[#71717a]" />
              ) : isVerified ? (
                <span className="text-emerald-500 text-xs flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>
                  Active
                </span>
              ) : (
                <span className="text-[#ef4444] text-xs flex items-center gap-1.5 bg-[#ef4444]/10 px-2 py-0.5 rounded-full border border-[#ef4444]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
                  Setup Required
                </span>
              )}
            </div>
            <p className="text-xs text-[#71717a] max-w-[200px]">
              {isVerified
                ? 'Your agent is authorized and ready to execute trades.'
                : 'Authorize your agent in the Vault to enable automated trading.'}
            </p>
          </div>

          <div className={`w-14 h-14 bg-black border border-[#333] rounded-full flex items-center justify-center relative ${isVerified ? 'shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}`}>
            {isVerified && (
              <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" style={{ animationDuration: '3s' }}></div>
            )}
            <svg viewBox="0 0 24 24" className={`w-8 h-8 ${isVerified ? 'text-emerald-500' : 'text-[#71717a]'}`} fill="currentColor">
              <path d="M12 2a2 2 0 0 1 2 2v2h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2.5l-1.5 1.5c-.3.3-.7.5-1.1.5s-.8-.2-1.1-.5l-1.5-1.5H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2zm0 2a.5.5 0 0 0-.5.5V6h1V4.5A.5.5 0 0 0 12 4zM7 8a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 7 19h2.9c.2 0 .4.1.6.2l1.5 1.5c.1.1.2.1.2.1h-.3l1.5-1.5c.2-.2.4-.3.6-.3H17a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17 8H7zm2.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-sm font-bold text-white">Trading Setup</span>
          <Info size={14} className="text-[#71717a]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/ai-agent" className="bg-[#111] border border-[#222] rounded-lg p-3 text-left transition-all hover:border-emerald-500/50 group block">
            <div className="flex items-center gap-2 text-emerald-500 font-bold mb-1">
              <Copy size={16} />
              Follow Mode
            </div>
            <div className="text-[10px] text-[#71717a] group-hover:text-[#a1a1aa] transition-colors mb-3">Configure mirror strategies</div>
            <div className="flex items-center justify-end text-[#71717a] group-hover:text-emerald-500 transition-colors">
              <ExternalLink size={14} />
            </div>
          </Link>

          <Link href="/dashboard/ai-agent" className="bg-[#111] border border-[#222] rounded-lg p-3 text-left transition-all hover:border-[#ef4444]/50 group block">
            <div className="flex items-center gap-2 text-[#ef4444] font-bold mb-1">
              <Flame size={16} />
              Rebel Mode
            </div>
            <div className="text-[10px] text-[#71717a] group-hover:text-[#a1a1aa] transition-colors mb-3">Configure invert strategies</div>
            <div className="flex items-center justify-end text-[#71717a] group-hover:text-[#ef4444] transition-colors">
              <ExternalLink size={14} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
