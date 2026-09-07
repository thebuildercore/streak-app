'use client'

import { useState, useEffect } from 'react'
import { Settings, Shield, Sliders, Bell, Key, Wallet, Cpu, Loader2 } from 'lucide-react'
import { useSettings } from '@/lib/hooks/useApi'
import { useAuthorizedBot } from '@/lib/hooks/useVault'
import { useAccount } from 'wagmi'

export default function SettingsPage() {
  const { data: settings, loading: settingsLoading, saveSettings, saving } = useSettings()
  const { botAddress, isActive } = useAuthorizedBot()
  const { address } = useAccount()

  const [formState, setFormState] = useState({
    max_allocation_per_trade: '250.00',
    global_max_drawdown: '15.0',
    slippage_tolerance: '0.5',
    gas_priority: 'fast'
  })

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setFormState({
        max_allocation_per_trade: (settings.max_allocation_per_trade ?? settings.max_allocation ?? 250).toString(),
        global_max_drawdown: (settings.global_max_drawdown ?? settings.max_drawdown ?? 15).toString(),
        slippage_tolerance: (settings.slippage_tolerance ?? 0.5).toString(),
        gas_priority: settings.gas_priority || 'fast'
      })
    }
  }, [settings])


  const handleSave = async () => {
    await saveSettings({
      max_allocation_per_trade: parseFloat(formState.max_allocation_per_trade),
      global_max_drawdown: parseFloat(formState.global_max_drawdown),
      slippage_tolerance: parseFloat(formState.slippage_tolerance),
      gas_priority: formState.gas_priority
    })
  }

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
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 relative">
          {settingsLoading && (
            <div className="absolute inset-0 bg-[#111]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <Loader2 className="w-8 h-8 animate-spin text-[#71717a]" />
            </div>
          )}
          
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
              <input 
                type="number" 
                value={formState.max_allocation_per_trade}
                onChange={(e) => setFormState(s => ({ ...s, max_allocation_per_trade: e.target.value }))}
                className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#ef4444]" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-2">Global Max Drawdown Cutoff (%)</label>
              <input 
                type="number" 
                value={formState.global_max_drawdown}
                onChange={(e) => setFormState(s => ({ ...s, global_max_drawdown: e.target.value }))}
                className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#ef4444]" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-2">Slippage Tolerance (%)</label>
              <select 
                value={formState.slippage_tolerance}
                onChange={(e) => setFormState(s => ({ ...s, slippage_tolerance: e.target.value }))}
                className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#ef4444]"
              >
                <option value="0.1">0.1% (Strict)</option>
                <option value="0.5">0.5% (Recommended)</option>
                <option value="1.0">1.0% (High Volatility)</option>
                <option value="2.0">2.0% (Degen)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-2">Execution Priority Gas</label>
              <select 
                value={formState.gas_priority}
                onChange={(e) => setFormState(s => ({ ...s, gas_priority: e.target.value }))}
                className="w-full bg-[#0c0c0c] border border-[#333] rounded-lg px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#ef4444]"
              >
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
              <span className="text-[#71717a]">Connected User Wallet</span>
              <span className="text-white">
                {address ? `${address.substring(0,6)}...${address.substring(38)}` : 'Not connected'}
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#0c0c0c] p-3 rounded-lg border border-[#222]">
              <span className="text-[#71717a]">Vault Delegator Approval</span>
              {isActive ? (
                <span className="text-emerald-400 font-bold">{botAddress?.substring(0, 8)}... (ACTIVE)</span>
              ) : (
                <span className="text-[#ef4444] font-bold">NOT APPROVED</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving || settingsLoading}
            className="flex items-center justify-center gap-2 bg-[#ef4444] hover:bg-red-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 min-w-[160px]"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}
