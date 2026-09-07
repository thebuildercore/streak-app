// Landing page — rendered as a Server Component (no client JS needed)

import { ArrowRight, Bot, Target, Flame, Shield, Sparkles } from 'lucide-react'

export function PredictionLanding() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-destructive/30">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="/" className="font-mono text-sm font-bold tracking-[-0.06em] flex items-center gap-2">
            StreakChaser<span className="text-destructive">.</span>
          </a>
          <a href="/dashboard" className="bg-white text-black px-5 py-2.5 rounded-lg text-xs font-bold transition-all hover:bg-gray-200 hover:scale-105 shadow-sm">
            Launch App
          </a>
        </div>
      </header>
      
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-32 lg:pt-28">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-3 py-1 rounded-full w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" /> 
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Prediction Market Automation</span>
          </div>
          
          <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Automate your <br />
            <span className="text-destructive">Prediction Trades.</span>
          </h1>
          
          <p className="mt-8 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground">
            StreakChaser is a non-custodial copy-trading platform for the Somnia Network. Deposit USDC into your secure vault, choose a top-performing trader from the leaderboard, and let our AI agent automatically mirror their winning trades 24/7.
          </p>
          
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="/dashboard" className="group flex items-center gap-3 bg-destructive rounded-lg px-7 py-4 text-sm font-bold text-destructive-foreground transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              Go to Dashboard <ArrowRight size={18} className="transition-transform group-hover:translate-x-1.5" />
            </a>
          </div>
          
          <div className="mt-14 flex flex-wrap gap-x-8 gap-y-4 border-t border-border/50 pt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><Shield size={14} className="text-emerald-500" /> <b className="font-mono text-foreground">100%</b> Non-custodial</span>
            <span className="flex items-center gap-2"><Bot size={14} className="text-blue-500" /> <b className="font-mono text-foreground">24/7</b> AI Execution</span>
            <span className="flex items-center gap-2"><Sparkles size={14} className="text-purple-500" /> <b className="font-mono text-foreground">Somnia</b> Testnet</span>
          </div>
        </div>
        
        <div className="relative flex min-h-[420px] flex-col justify-between border border-border/50 rounded-2xl p-7 lg:p-10 bg-[#0a0a0a] shadow-2xl overflow-hidden group">
          {/* Decorative background gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Agent Command Center</p>
              <p className="max-w-xs font-serif text-3xl sm:text-4xl leading-[1.1] tracking-[-0.03em] text-white">
                Your edge,<br /><span className="text-destructive">on autopilot.</span>
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <Bot className="text-destructive" size={28} />
            </div>
          </div>
          
          <div className="relative z-10 space-y-3.5 font-mono text-xs mt-10">
            <div className="flex items-center justify-between border border-border/60 bg-black/40 backdrop-blur-md p-4 rounded-xl">
              <span className="text-muted-foreground flex items-center gap-2.5"><Shield size={15}/> Vault Status</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> SECURE</span>
            </div>
            <div className="flex items-center justify-between border border-border/60 bg-black/40 backdrop-blur-md p-4 rounded-xl">
              <span className="text-muted-foreground flex items-center gap-2.5"><Target size={15}/> Active Strategy</span>
              <span className="text-white font-bold">FOLLOW LEADER</span>
            </div>
            <div className="flex items-center justify-between border border-destructive/30 bg-destructive/5 backdrop-blur-md p-4 rounded-xl">
              <span className="text-muted-foreground flex items-center gap-2.5"><Flame size={15} className="text-destructive"/> Last Execution</span>
              <span className="text-emerald-400 font-bold">BUY YES (+12.4%)</span>
            </div>
          </div>
          
          <div className="relative z-10 mt-8 flex justify-end">
            <div className="font-mono text-[10px] font-bold text-muted-foreground flex items-center gap-2 bg-[#111] px-3 py-1.5 rounded-lg border border-[#222]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              AGENT ONLINE
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 border-t border-border/30 bg-black/20">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl sm:text-5xl tracking-[-0.04em] mb-5 text-white">How it works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">Set up your automated trading vault in minutes and never miss a profitable signal again.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="border border-border/50 bg-[#0c0c0c] p-8 rounded-2xl relative overflow-hidden transition-colors hover:border-blue-500/30">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl flex items-center justify-center mb-6">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">1. Fund Your Vault</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">Deposit USDC into your secure, non-custodial smart contract vault. You retain 100% ownership and can withdraw your funds at any time.</p>
          </div>
          
          <div className="border border-border/50 bg-[#0c0c0c] p-8 rounded-2xl relative overflow-hidden transition-colors hover:border-emerald-500/30">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400"></div>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">2. Choose a Strategy</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">Browse the leaderboard of top DreamDEX traders. Choose to <b className="text-emerald-400 font-mono">FOLLOW</b> their winning trades or <b className="text-destructive font-mono">REBEL</b> against serial losers.</p>
          </div>
          
          <div className="border border-border/50 bg-[#0c0c0c] p-8 rounded-2xl relative overflow-hidden transition-colors hover:border-destructive/30">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive to-red-400"></div>
            <div className="w-12 h-12 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center justify-center mb-6">
              <Bot size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">3. Agent Takes Over</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">Your assigned AI bot constantly monitors the blockchain. When your chosen trader makes a move, your bot instantly copies it using your vault funds.</p>
          </div>
        </div>
      </section>
      
      <footer className="border-t border-border/30 bg-[#050505]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span className="font-mono font-bold text-foreground">StreakChaser<span className="text-destructive">.</span></span>
          <span className="flex items-center gap-2"><Sparkles size={14} className="text-purple-500" /> Built for the Somnia Network</span>
        </div>
      </footer>
    </main>
  )
}

export default PredictionLanding
