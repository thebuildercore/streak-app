'use client'

import { Settings, Shield, Sliders, Bell, Key, Wallet, Cpu } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex-1 bg-[#0c0c0c] min-h-screen text-white p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Settings className="text-[#ef4444]" size={28} />
            Automation & Account Settings
          </h1>
          <p className="text-xs md:text-sm text-[#71717a] mt-1">
            Configure risk parameters, non-custodial wallet permissions, and AI agent execution rules.
          </p>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Risk & Allocation Controls */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="flex items-center gap-3 border-b border-[#222] pb-4 mb-4">
            <Sliders className="text-[#ef4444]" size={20} />
            <div>
              <h2 className="text-base font-bold text-white">Automated Risk & Sizing Controls</h2>
              <p className="text-xs text-[#71717a]">Set max allocation per signal and stop loss rules.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-2">Max Allocation per Signal (USDC)</label>
              <input type="text" defaultValue="$250.00" className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#ef4444]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-2">Global Max Drawdown Cutoff</label>
              <input type="text" defaultValue="15.0%" className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#ef4444]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-2">Slippage Tolerance</label>
              <select defaultValue="0.5%" className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#ef4444]">
                <option>0.1% (Strict)</option>
                <option>0.5% (Recommended)</option>
                <option>1.0% (High Volatility)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-2">Execution Priority Gas</label>
              <select defaultValue="fast" className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#ef4444]">
                <option value="standard">Standard Somnia Gas</option>
                <option value="fast">Fast (Sub-second execution)</option>
                <option value="turbo">Turbo MEV Shielded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Network & Wallet */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="flex items-center gap-3 border-b border-[#222] pb-4 mb-4">
            <Wallet className="text-emerald-400" size={20} />
            <div>
              <h2 className="text-base font-bold text-white">Network & Non-Custodial Vault</h2>
              <p className="text-xs text-[#71717a]">Connected wallet address and smart contract approvals.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between bg-[#0c0c0c] p-3 rounded-lg border border-[#222]">
              <span className="text-[#71717a]">Active Network</span>
              <span className="text-emerald-400 font-bold">Somnia Mainnet (Chain ID 50311)</span>
            </div>
            <div className="flex items-center justify-between bg-[#0c0c0c] p-3 rounded-lg border border-[#222]">
              <span className="text-[#71717a]">Vault Delegator Approval</span>
              <span className="text-white">0x742d...44e8 (ACTIVE)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="bg-[#ef4444] hover:bg-red-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold transition-colors">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}
