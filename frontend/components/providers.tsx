'use client'

import { SomniaMarketsProvider } from '@somnia-chain/markets-sdk/react'
import { client } from '@/lib/somnia'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SomniaMarketsProvider client={client}>
      {children}
    </SomniaMarketsProvider>
  )
}
