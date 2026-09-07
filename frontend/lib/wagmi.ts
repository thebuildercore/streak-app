'use client'

import { http, createConfig } from 'wagmi'
import { type Chain } from 'viem'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// Somnia Shannon Testnet chain definition
export const somniaTestnet = {
  id: 50312,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://dream-rpc.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shannon Explorer',
      url: 'https://shannon.somnia.network',
    },
  },
  testnet: true,
} as const satisfies Chain

// Contract addresses from environment
export const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0xFE262580a526E4311970c92aE690650Fcbd79aD7') as `0x${string}`
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_TESTNET_USDC || '0xE9CC37904875B459Fa5D0FE37680d36F1ED55e38') as `0x${string}`
export const BOT_ADDRESS = (process.env.NEXT_PUBLIC_BOT_ADDRESS || '0xb297dcAD8Ca491b2c27401Cf5f1d99C73b392F46') as `0x${string}`
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

// Wagmi + RainbowKit config
export const config = getDefaultConfig({
  appName: 'StreakChaser',
  projectId: 'streakchaser-demo', // WalletConnect project ID — replace in production
  chains: [somniaTestnet],
  transports: {
    [somniaTestnet.id]: http(somniaTestnet.rpcUrls.default.http[0]),
  },
  ssr: true,
})
