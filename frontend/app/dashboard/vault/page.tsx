'use client'

import { useState } from 'react'
import { ChevronDown, Sun, ShieldCheck, DollarSign, Wallet, Lock, ShieldAlert, LockKeyhole, Loader2 } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { 
  useVaultBalance, 
  useUserUsdcBalance, 
  useAuthorizedBot,
  useDeposit,
  useWithdraw,
  useAuthorizeBot,
  useRevokeBot
} from '@/lib/hooks/useVault'
import { formatCompact } from '@/lib/hooks/usePrices'

export default function VaultPage() {
  const { address, isConnected } = useAccount()
  const { balance: vaultBalance, isLoading: vaultLoading } = useVaultBalance()
  const { balance: userBalance } = useUserUsdcBalance(address)
  const { botAddress, allowance, isActive, isLoading: botLoading } = useAuthorizedBot()
  
  const { deposit, step: depositStep, isPending: depositPending, error: depositError } = useDeposit()
  const { withdraw, isPending: withdrawPending, error: withdrawError } = useWithdraw()
  const { authorize, isPending: authorizePending } = useAuthorizeBot()
  const { revoke, isPending: revokePending } = useRevokeBot()

  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [allowanceInput, setAllowanceInput] = useState(allowance)

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount))) return
    await deposit(depositAmount)
    setDepositAmount('')
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return
    await withdraw(withdrawAmount)
    setWithdrawAmount('')
  }

  const handleAuthorize = async () => {
    if (!allowanceInput || isNaN(Number(allowanceInput))) return
    await authorize(allowanceInput)
  }

  const isVerified = isConnected && isActive

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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">My Vault</h1>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} />
              Non-Custodial
            </div>
          </div>
          <p className="text-[#a1a1aa] text-sm">You keep full custody. StreakChaser never holds your funds.</p>
        </div>

        <div className="flex flex-col gap-6 max-w-5xl">
          {/* Balances Section */}
          <div className="bg-[#0c0c0c] border border-[#222] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-6">Balances</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex justify-between items-start">
                <div>
                  <div className="text-[#71717a] text-xs mb-2">Total Balance</div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-2xl font-bold text-white">
                      {vaultLoading ? '...' : parseFloat(vaultBalance).toFixed(2)}
                    </span>
                    <span className="text-xs text-[#a1a1aa] font-medium">USDC</span>
                  </div>
                  <div className="text-[10px] text-[#71717a]">≈ ${vaultLoading ? '...' : formatCompact(vaultBalance)}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <DollarSign size={20} />
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex justify-between items-start">
                <div>
                  <div className="text-[#71717a] text-xs mb-2">Available to Trade</div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-2xl font-bold text-emerald-500">
                      {vaultLoading ? '...' : parseFloat(vaultBalance).toFixed(2)}
                    </span>
                    <span className="text-xs text-[#a1a1aa] font-medium">USDC</span>
                  </div>
                  <div className="text-[10px] text-[#71717a]">≈ ${vaultLoading ? '...' : formatCompact(vaultBalance)}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Wallet size={20} />
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex justify-between items-start">
                <div>
                  <div className="text-[#71717a] text-xs mb-2">In Active Positions</div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-2xl font-bold text-white">0.00</span>
                    <span className="text-xs text-[#a1a1aa] font-medium">USDC</span>
                  </div>
                  <div className="text-[10px] text-[#71717a]">≈ $0.00</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[#71717a]">
                  <Lock size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Agent Permissions Section */}
          <div className="bg-[#0c0c0c] border border-[#222] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-6">Agent Permissions</h2>
            
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="text-[#71717a] text-[10px] uppercase tracking-wider mb-2">Authorized Agent</div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${isVerified ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-[#333] bg-[#111]'}`}>
                    <svg viewBox="0 0 24 24" className={`w-5 h-5 ${isVerified ? 'text-emerald-500' : 'text-[#71717a]'}`} fill="currentColor">
                      <path d="M12 2a2 2 0 0 1 2 2v2h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2.5l-1.5 1.5c-.3.3-.7.5-1.1.5s-.8-.2-1.1-.5l-1.5-1.5H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2zm0 2a.5.5 0 0 0-.5.5V6h1V4.5A.5.5 0 0 0 12 4zM7 8a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 7 19h2.9c.2 0 .4.1.6.2l1.5 1.5c.1.1.2.1.2.1h-.3l1.5-1.5c.2-.2.4-.3.6-.3H17a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17 8H7zm2.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                      StreakChaser AI Bot 
                    </div>
                    <div className="text-[10px] text-[#71717a] mt-0.5">
                      {botLoading ? '...' : botAddress === '0x0000000000000000000000000000000000000000' ? 'Not Authorized' : botAddress}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div>
                  <div className="text-[#71717a] text-[10px] uppercase tracking-wider mb-2">Allowance (Spending Limit)</div>
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-lg font-bold text-white">
                      {botLoading ? '...' : parseFloat(allowance).toFixed(2)}
                    </span>
                    <span className="text-xs text-white font-medium">USDC</span>
                  </div>
                </div>
                
                <button 
                  onClick={revoke}
                  disabled={revokePending || !isVerified}
                  className="flex items-center gap-2 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {revokePending ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                  Emergency Revoke
                </button>
              </div>
            </div>

            <div className="mb-2 text-xs text-[#a1a1aa]">Adjust Allowance</div>
            <div className="flex items-center gap-6">
              <div className="flex-1 relative pt-2">
                <input 
                  type="range"
                  min="0"
                  max="10000"
                  value={allowanceInput || allowance}
                  onChange={(e) => setAllowanceInput(e.target.value)}
                  className="w-full h-1 bg-[#222] rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between mt-3 text-[10px] text-[#71717a]">
                  <span>0 USDC</span>
                  <span>10,000.00 USDC</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-32 bg-[#111] border border-[#333] rounded-lg px-3 py-2 flex items-center justify-between self-start">
                  <input 
                    type="number" 
                    value={allowanceInput || allowance} 
                    onChange={(e) => setAllowanceInput(e.target.value)}
                    className="bg-transparent text-white text-xs w-full focus:outline-none"
                  />
                  <span className="text-[10px] text-[#71717a]">USDC</span>
                </div>
                <button 
                  onClick={handleAuthorize}
                  disabled={authorizePending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                >
                  {authorizePending ? <Loader2 size={14} className="animate-spin" /> : 'Set'}
                </button>
              </div>
            </div>
          </div>

          {/* Deposit/Withdraw Section */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#0c0c0c] border border-[#222] rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-4">Deposit USDC</h2>
              <div className="bg-[#111] border border-[#333] rounded-lg p-3 mb-2 flex items-center justify-between">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="bg-transparent text-white w-full focus:outline-none text-sm placeholder:text-[#333]"
                />
                <span className="text-[#71717a] text-xs font-medium px-2">USDC</span>
              </div>
              <div className="text-[10px] text-[#71717a] mb-6 flex justify-between">
                <span>Wallet Balance: {parseFloat(userBalance).toFixed(2)} USDC</span>
                {depositError && <span className="text-[#ef4444] truncate max-w-[150px]" title={depositError}>{depositError}</span>}
              </div>
              <button 
                onClick={handleDeposit}
                disabled={depositPending || !depositAmount}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {depositPending && <Loader2 size={16} className="animate-spin" />}
                {depositStep === 'approving' ? 'Approving...' : depositStep === 'depositing' ? 'Depositing...' : 'Deposit'}
              </button>
            </div>

            <div className="bg-[#0c0c0c] border border-[#222] rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-4">Withdraw USDC</h2>
              <div className="bg-[#111] border border-[#333] rounded-lg p-3 mb-2 flex items-center justify-between">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="bg-transparent text-white w-full focus:outline-none text-sm placeholder:text-[#333]"
                />
                <span className="text-[#71717a] text-xs font-medium px-2">USDC</span>
              </div>
              <div className="text-[10px] text-[#71717a] mb-6 flex justify-between">
                <span>Vault Balance: {parseFloat(vaultBalance).toFixed(2)} USDC</span>
                {withdrawError && <span className="text-[#ef4444] truncate max-w-[150px]" title={withdrawError}>{withdrawError}</span>}
              </div>
              <button 
                onClick={handleWithdraw}
                disabled={withdrawPending || !withdrawAmount}
                className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#333] text-white font-bold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {withdrawPending && <Loader2 size={16} className="animate-spin" />}
                Withdraw
              </button>
            </div>
          </div>
          
          <div className="text-center mt-4 flex items-center justify-center gap-2 text-[#71717a] text-[10px]">
            <LockKeyhole size={12} />
            100% Non-Custodial • You control your funds at all times.
          </div>
        </div>
      </div>
    </div>
  )
}
