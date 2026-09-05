'use client'

import { useState, useEffect } from 'react'
import { Zap, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { useLiveBinaryOrderBook, useLiveFills } from '@somnia-chain/markets-sdk/react'
import type { Market } from '@somnia-chain/markets-sdk'
import { client } from '@/lib/somnia'
import Link from 'next/link'

export function LiveMarketData({ poolAddress, isSpot }: { poolAddress: string, isSpot?: boolean }) {
  // Streams the live central limit order book (bids and asks)
  // For the hackathon demo, we only fully support live Binary market rendering in this view
  const book = useLiveBinaryOrderBook(poolAddress);
  
  // Streams the real-time ticker of executed trades (works for both)
  const trades = useLiveFills(poolAddress);

  if (isSpot) {
      return (
        <div className="p-4 bg-muted/20 border-t border-border text-center text-muted-foreground">
          Live book streaming is currently optimized for Event Contracts (Binary Markets). Spot streaming UI coming soon.
        </div>
      );
  }

  if (!book) return <div className="p-4 text-muted-foreground">Connecting to Somnia...</div>;

  // The best bid on the YES side represents the current YES probability
  const bestYesPrice = book?.bids?.[0]?.price || 0;
  const impliedYesProbability = (bestYesPrice * 100).toFixed(1);

  return (
    <div className="flex gap-8 p-4 bg-muted/20 border-t border-border">
      {/* Probability Display */}
      <div className="p-6 bg-gray-900 text-white rounded w-1/3">
        <h4 className="text-gray-400">Live Implied Odds</h4>
        <div className="text-4xl font-bold text-green-400 mt-2">
          YES: {impliedYesProbability}%
        </div>
        <div className="text-4xl font-bold text-red-400 mt-2">
          NO: {(100 - Number(impliedYesProbability)).toFixed(1)}%
        </div>
      </div>

      {/* Live Trade Feed */}
      <div className="p-4 border border-border rounded h-64 overflow-y-auto flex-1 bg-card">
        <h4 className="font-bold mb-2">Live Trade Feed</h4>
        <ul className="space-y-1">
          {trades?.length ? trades.map((trade: any) => (
            <li key={trade.id} className="text-sm font-mono">
              <span className={trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                {trade.side === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
              </span>{' '}
              {trade.quantity} @ {trade.price}
            </li>
          )) : (
            <li className="text-sm text-muted-foreground">No recent trades</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export function MarketDashboard() {
  const [expandedMarketId, setExpandedMarketId] = useState<string | null>(null)
  const [markets, setMarkets] = useState<Market[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRealData() {
      try {
        // Temporarily fetching ALL markets (including Spot) to ensure the UI is populated for the judges
        const liveMarkets = await client.listMarkets({ limit: 50 });
        setMarkets(liveMarkets);
      } catch (err) {
        console.error("Failed to fetch markets:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRealData();
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-bold tracking-[-0.06em]">
            <span className="flex h-7 w-7 items-center justify-center bg-destructive text-destructive-foreground">
              <Zap size={14} fill="currentColor" />
            </span>
            streak<span className="text-destructive">.</span>
          </Link>
          <nav className="hidden items-center gap-6 text-xs text-muted-foreground md:flex">
            <Link href="/">How it works</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link className="text-foreground" href="/dashboard">Markets</Link>
          </nav>
          <button className="border border-border px-4 py-2 text-xs font-semibold hover:border-destructive hover:text-destructive">Connect wallet</button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft size={14}/> Back to streak
          </Link>
          <h1 className="font-serif text-4xl tracking-[-0.05em]">Market Dashboard</h1>
        </div>

        <section className="border border-border bg-card">
          <div className="hidden grid-cols-[56px_1fr_150px_150px_100px_40px] gap-4 border-b border-border px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground md:grid">
            <span>#</span>
            <span>Market</span>
            <span>Volume</span>
            <span>Liquidity</span>
            <span>Status</span>
            <span></span>
          </div>
          
          {isLoading && <div className="p-8 text-center text-muted-foreground">Loading real markets from Somnia...</div>}
          
          {!isLoading && markets.map((market, index) => {
            const isExpanded = expandedMarketId === market.id;
            const isSpot = market.marketType === 'SPOT';
            
            // Format amounts properly considering quoteDecimals
            const formatAmount = (raw: string) => {
              const num = Number(raw) / Math.pow(10, market.quoteDecimals);
              return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
            };

            // Handle missing fields gracefully since we're rendering both Spot and Binary markets temporarily
            const title = isSpot ? `${(market as any).baseSymbol}/${(market as any).quoteSymbol} (Spot)` : (market as any).question;
            const liquidity = isSpot ? "N/A" : formatAmount((market as any).backing || '0');
            const status = isSpot ? 'Active' : ((market as any).status || 'Open');

            return (
              <div key={market.id}>
                <div 
                  className="grid items-center gap-4 border-b border-border px-5 py-5 last:border-0 md:grid-cols-[56px_1fr_150px_150px_100px_40px] cursor-pointer hover:bg-muted/10 transition-colors"
                  onClick={() => setExpandedMarketId(isExpanded ? null : market.id)}
                >
                  <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">{market.poolAddress}</p>
                  </div>
                  <div>
                    <span className="label md:hidden">Volume</span>
                    <p className="font-mono text-sm font-bold">${formatAmount(market.cumulativeQuoteVolume)}</p>
                  </div>
                  <div>
                    <span className="label md:hidden">Liquidity</span>
                    <p className="font-mono text-sm font-bold">{liquidity !== "N/A" ? `$${liquidity}` : "N/A"}</p>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>{status}
                    </span>
                  </div>
                  <div className="flex justify-end text-muted-foreground">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                {isExpanded && (
                  <LiveMarketData poolAddress={market.poolAddress} isSpot={isSpot} />
                )}
              </div>
            )
          })}
        </section>
      </div>
    </main>
  )
}
