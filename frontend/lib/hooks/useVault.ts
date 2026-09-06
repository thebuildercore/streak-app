'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useState } from 'react'
import { VAULT_ADDRESS, USDC_ADDRESS, BOT_ADDRESS } from '../wagmi'

// Minimal ERC20 ABI for approve and balanceOf
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// CopyTradeVault ABI (minimal for frontend reads/writes)
const VAULT_ABI = [
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'authorizedBot',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'botAllowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tradingToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'authorizeBot',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_bot', type: 'address' },
      { name: '_allowance', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'revokeBot',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const

/**
 * Read the vault's USDC balance (total deposited)
 */
export function useVaultBalance() {
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [VAULT_ADDRESS],
  })

  const balance = data ? formatUnits(data, 6) : '0'
  return { balance, isLoading, refetch }
}

/**
 * Read user's USDC wallet balance
 */
export function useUserUsdcBalance(userAddress: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  })

  const balance = data ? formatUnits(data, 6) : '0'
  return { balance, isLoading, refetch }
}

/**
 * Read the vault's authorized bot address and allowance
 */
export function useAuthorizedBot() {
  const { data: botAddress, isLoading: loadingBot } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'authorizedBot',
  })

  const { data: allowance, isLoading: loadingAllowance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'botAllowance',
  })

  return {
    botAddress: botAddress as `0x${string}` | undefined,
    allowance: allowance ? formatUnits(allowance, 6) : '0',
    allowanceRaw: allowance,
    isActive: botAddress !== undefined && botAddress !== '0x0000000000000000000000000000000000000000',
    isLoading: loadingBot || loadingAllowance,
  }
}

/**
 * Deposit USDC into the vault (2-step: approve + deposit)
 */
export function useDeposit() {
  const { writeContractAsync, isPending } = useWriteContract()
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const deposit = async (amount: string) => {
    try {
      setError(null)
      const amountWei = parseUnits(amount, 6)

      // Step 1: Approve vault to spend USDC
      setStep('approving')
      await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [VAULT_ADDRESS, amountWei],
      })

      // Step 2: Deposit into vault
      setStep('depositing')
      await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [amountWei],
      })

      setStep('done')
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Transaction failed')
      setStep('error')
    }
  }

  return { deposit, step, isPending, error }
}

/**
 * Withdraw USDC from the vault
 */
export function useWithdraw() {
  const { writeContractAsync, isPending } = useWriteContract()
  const [error, setError] = useState<string | null>(null)

  const withdraw = async (amount: string) => {
    try {
      setError(null)
      const amountWei = parseUnits(amount, 6)
      await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [amountWei],
      })
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Transaction failed')
    }
  }

  return { withdraw, isPending, error }
}

/**
 * Authorize the bot with an allowance
 */
export function useAuthorizeBot() {
  const { writeContractAsync, isPending } = useWriteContract()
  const [error, setError] = useState<string | null>(null)

  const authorize = async (allowance: string) => {
    try {
      setError(null)
      const amountWei = parseUnits(allowance, 6)
      await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'authorizeBot',
        args: [BOT_ADDRESS, amountWei],
      })
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Transaction failed')
    }
  }

  return { authorize, isPending, error }
}

/**
 * Revoke the bot's permissions (emergency)
 */
export function useRevokeBot() {
  const { writeContractAsync, isPending } = useWriteContract()
  const [error, setError] = useState<string | null>(null)

  const revoke = async () => {
    try {
      setError(null)
      await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'revokeBot',
      })
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Transaction failed')
    }
  }

  return { revoke, isPending, error }
}
