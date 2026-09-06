'use client'

import { useState, useEffect, useCallback } from 'react'
import { API_URL, VAULT_ADDRESS } from '../wagmi'

// ─── Generic fetcher ───────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ─── Leaderboard ───────────────────────────────────────────────
export interface TraderData {
  address: string
  total_trades: number
  wins: number
  losses: number
  current_streak: number
  best_streak: number
  win_rate: number
  reputation_score: number
  last_active: string
  market_trades?: number
}

export function useLeaderboard(filter?: 'top_performers' | 'serial_losers', marketPool?: string) {
  const [data, setData] = useState<TraderData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter) params.set('filter', filter)
    if (marketPool) params.set('market_pool', marketPool)
    const result = await apiFetch<{ leaderboard: TraderData[] }>(`/leaderboard?${params}`)
    setData(result?.leaderboard || [])
    setLoading(false)
  }, [filter, marketPool])

  useEffect(() => { fetchData() }, [fetchData])
  return { data, loading, refetch: fetchData }
}

// ─── User Stats ────────────────────────────────────────────────
export interface UserStats {
  totalTrades: number
  successfulTrades: number
  failedTrades: number
  winRate: string
  totalVolume: string
  followCount: number
  rebelCount: number
}

export function useUserStats(vaultAddress?: string) {
  const [data, setData] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  const vault = vaultAddress || VAULT_ADDRESS

  useEffect(() => {
    if (!vault) return
    apiFetch<{ stats: UserStats }>(`/user/stats?vault=${vault}`)
      .then(result => setData(result?.stats || null))
      .finally(() => setLoading(false))
  }, [vault])

  return { data, loading }
}

// ─── User Executions ───────────────────────────────────────────
export interface ExecutionData {
  id: string
  user_vault_address: string
  market_pool: string
  kind: number
  amount: string
  tx_hash: string
  status: string
  executed_at: string
  copy_subscriptions?: {
    leader_address: string
    mode: string
  }
}

export function useUserExecutions(limit = 10, vaultAddress?: string) {
  const [data, setData] = useState<ExecutionData[]>([])
  const [loading, setLoading] = useState(true)

  const vault = vaultAddress || VAULT_ADDRESS

  useEffect(() => {
    if (!vault) return
    apiFetch<{ executions: ExecutionData[] }>(`/user/executions?vault=${vault}&limit=${limit}`)
      .then(result => setData(result?.executions || []))
      .finally(() => setLoading(false))
  }, [vault, limit])

  return { data, loading }
}

// ─── Subscriptions ─────────────────────────────────────────────
export interface SubscriptionData {
  id: string
  user_vault_address: string
  leader_address: string
  mode: 'FOLLOW' | 'REBEL'
  allocation_per_trade: string
  is_active: boolean
}

export function useSubscriptions(vaultAddress?: string) {
  const [data, setData] = useState<SubscriptionData[]>([])
  const [loading, setLoading] = useState(true)

  const vault = vaultAddress || VAULT_ADDRESS

  const fetchData = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch<{ subscriptions: SubscriptionData[] }>(`/subscribe?vault=${vault}`)
    setData(result?.subscriptions || [])
    setLoading(false)
  }, [vault])

  useEffect(() => { fetchData() }, [fetchData])

  const subscribe = async (leaderAddress: string, mode: 'FOLLOW' | 'REBEL', allocationPerTrade: string) => {
    const result = await apiFetch<{ success: boolean }>('/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        userVaultAddress: vault,
        leaderAddress,
        mode,
        allocationPerTrade,
      }),
    })
    if (result?.success) await fetchData()
    return result?.success || false
  }

  const toggleMode = async (leaderAddress: string, mode: 'FOLLOW' | 'REBEL') => {
    const result = await apiFetch<{ success: boolean }>('/subscribe/mode', {
      method: 'PATCH',
      body: JSON.stringify({
        userVaultAddress: vault,
        leaderAddress,
        mode,
      }),
    })
    if (result?.success) await fetchData()
    return result?.success || false
  }

  const unsubscribe = async (leaderAddress: string) => {
    const result = await apiFetch<{ success: boolean }>('/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({
        userVaultAddress: vault,
        leaderAddress,
      }),
    })
    if (result?.success) await fetchData()
    return result?.success || false
  }

  return { data, loading, subscribe, toggleMode, unsubscribe, refetch: fetchData }
}

// ─── Settings ──────────────────────────────────────────────────
export interface UserSettings {
  max_drawdown: number
  max_allocation: number
  slippage_tolerance: number
}

export function useSettings(vaultAddress?: string) {
  const [data, setData] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const vault = vaultAddress || VAULT_ADDRESS

  useEffect(() => {
    if (!vault) return
    apiFetch<{ settings: UserSettings }>(`/settings?vault=${vault}`)
      .then(result => setData(result?.settings || null))
      .finally(() => setLoading(false))
  }, [vault])

  const saveSettings = async (settings: UserSettings) => {
    setSaving(true)
    try {
      const result = await apiFetch<{ success: boolean }>('/settings', {
        method: 'POST',
        body: JSON.stringify({
          userVaultAddress: vault,
          ...settings,
        }),
      })
      if (result?.success) setData(settings)
      return result?.success || false
    } finally {
      setSaving(false)
    }
  }

  return { data, loading, saving, saveSettings }
}
