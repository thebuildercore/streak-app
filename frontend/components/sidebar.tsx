'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  CalendarDays,
  Users,
  Wallet,
  Bot,
  History,
  Settings
} from 'lucide-react'
import { useVaultBalance } from '@/lib/hooks/useVault'
import { formatCompact } from '@/lib/hooks/usePrices'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Events', href: '/dashboard/events', icon: CalendarDays },
  { name: 'Leaders', href: '/dashboard/leaders', icon: Users },
  { name: 'Vault', href: '/dashboard/vault', icon: Wallet },
  { name: 'AI Agent', href: '/dashboard/ai-agent', icon: Bot },
  { name: 'History', href: '/dashboard/history', icon: History },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { balance, isLoading } = useVaultBalance()

  return (
    <div className="w-[240px] flex-shrink-0 border-r border-[#222] bg-[#0c0c0c] flex flex-col text-[#a1a1aa] text-sm">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white text-lg tracking-tight hover:text-white">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#ef4444]">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
          </svg>
          StreakChaser
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard') || (pathname.startsWith(item.href) && item.href !== '/dashboard')

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors w-full cursor-pointer ${isActive
                ? 'bg-[#111] text-white font-medium border border-[#333] shadow-sm'
                : 'hover:bg-white/5 hover:text-white border border-transparent'
                }`}
            >
              <item.icon size={18} className={isActive ? 'text-[#ef4444]' : 'opacity-70'} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 flex flex-col gap-3">
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <div className="text-xs text-[#a1a1aa] mb-1">Vault Balance</div>
          <div className="text-xl font-bold text-white flex items-baseline gap-1">
            {isLoading ? '...' : (parseFloat(balance) > 0 ? parseFloat(balance).toFixed(2) : '0.00')}
            <span className="text-[10px] text-[#71717a] font-normal">USDC</span>
          </div>
          <Link href="/dashboard/vault" className="w-full mt-3 bg-white hover:bg-gray-200 text-black text-xs font-bold py-2 rounded transition-colors text-center inline-block">
            Deposit
          </Link>
        </div>

        <button className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-sm text-white transition-colors w-full justify-center cursor-default">
          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
          </div>
          <span className="text-xs font-medium font-mono text-emerald-400">Somnia Devnet</span>
        </button>
      </div>
    </div>
  )
}

