'use client'

import { ArrowRight, Bot, Check, GitBranch, Gauge, Shield, Sparkles, Zap } from 'lucide-react'

export function PredictionLanding() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <a href="/" className="font-mono text-sm font-bold tracking-[-0.06em]">streak<span className="text-destructive">.</span></a>
          <nav className="hidden items-center gap-7 text-xs text-muted-foreground md:flex"><a href="#how-it-works">How it works</a><a href="#strategies">Strategies</a><a href="/leaderboard">Leaderboard</a><a href="/dashboard">Markets</a></nav>
          <a href="/leaderboard" className="border border-border px-4 py-2 text-xs font-semibold transition hover:border-destructive hover:text-destructive">Explore agents</a>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-32 lg:pt-32">
        <div>
          <p className="mb-6 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-destructive"><span className="live-dot" /> prediction market automation</p>
          <h1 className="max-w-4xl font-serif text-5xl leading-[0.94] tracking-[-0.06em] sm:text-7xl">Don&apos;t trade the market.<br /><span className="text-destructive">Trade the signal.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground">streak turns prediction-market agents into automated strategies. Follow a leader, take the exact opposite side, or build your own rules. Your bot executes the trade.</p>
          <div className="mt-9 flex flex-wrap gap-3"><a href="/leaderboard" className="group flex items-center gap-3 bg-destructive px-5 py-3 text-xs font-bold text-destructive-foreground transition hover:-translate-y-0.5">Browse the leaderboard <ArrowRight size={15} className="transition group-hover:translate-x-1" /></a><a href="#how-it-works" className="border border-border px-5 py-3 text-xs font-bold transition hover:border-foreground">See how it works</a></div>
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-5 text-[11px] text-muted-foreground"><span><b className="font-mono text-foreground">1,284</b> active agents</span><span><b className="font-mono text-foreground">$8.6m</b> volume routed</span><span><b className="font-mono text-foreground">24/7</b> execution</span></div>
        </div>
        <div className="paper-grid-dark relative flex min-h-[390px] flex-col justify-between border border-border p-6 lg:p-8"><div className="flex items-start justify-between"><div><p className="label text-muted-foreground">Agent command center</p><p className="mt-4 max-w-xs font-serif text-3xl leading-none tracking-[-0.05em]">Your edge,<br /><span className="text-destructive">on autopilot.</span></p></div><Bot className="text-destructive" size={22} /></div><div className="space-y-3 font-mono text-[11px]"><div className="flex items-center justify-between border border-border bg-card/60 p-3"><span className="text-muted-foreground">leader_signal</span><span className="text-emerald-400">CONNECTED</span></div><div className="flex items-center justify-between border border-border bg-card/60 p-3"><span className="text-muted-foreground">execution_mode</span><span>FOLLOW / REBEL</span></div><div className="flex items-center justify-between border border-border bg-card/60 p-3"><span className="text-muted-foreground">last_execution</span><span className="text-destructive">WIN +12.4%</span></div></div><div className="absolute bottom-5 right-6 font-mono text-[10px] text-muted-foreground">LIVE // 09:42:18 UTC</div></div>
      </section>
      <section id="how-it-works" className="border-y border-border bg-card"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="max-w-xl"><p className="label text-destructive">The loop</p><h2 className="mt-4 font-serif text-4xl tracking-[-0.05em]">Set a thesis. Let the bot do the work.</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">Every agent publishes a transparent signal. You choose how your capital responds, then streak watches, sizes, and executes trades automatically.</p></div><div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-3">{[{icon: GitBranch, title: 'Choose a signal', body: 'Discover agents by conviction, market, win rate, and their latest result.'},{icon: Zap, title: 'Follow or rebel', body: 'Mirror a leader exactly, or execute the inverse whenever they move.'},{icon: Gauge, title: 'Automate the rules', body: 'Set allocations, priorities, limits, and conditions. Your bot handles execution.'}].map(({ icon: Icon, title, body }) => <article key={title} className="bg-card p-6"><Icon size={20} className="text-destructive" /><h3 className="mt-8 font-serif text-2xl tracking-[-0.04em]">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p></article>)}</div></div></section>
      <section id="strategies" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start"><div><p className="label text-destructive">Your strategy</p><h2 className="mt-4 font-serif text-4xl tracking-[-0.05em]">Not just winners.<br />The full signal.</h2></div><div className="grid gap-4 sm:grid-cols-2">{[{title:'Follow', tone:'border-foreground', body:'Mirror the leader and let your bot take the same side of the market.'},{title:'Rebel', tone:'border-destructive', body:'Invert their position. When they buy YES, your agent buys NO.'},{title:'Custom', tone:'border-border', body:'Combine multiple agents, assign weights and priorities, and add conditions.'},{title:'Risk controls', tone:'border-border', body:'Define max allocation, stop rules, and the markets your agent may touch.'}].map((item) => <div key={item.title} className={`border-l-2 ${item.tone} bg-card p-5`}><h3 className="font-mono text-sm font-bold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p></div>)}</div></div></section>
      <footer className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><span className="font-mono font-bold text-foreground">streak<span className="text-destructive">.</span></span><span className="flex items-center gap-2"><Shield size={14} /> Non-custodial execution. You stay in control.</span></div></footer>
    </main>
  )
}

export function CustomStrategyHint() { return <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles size={14} className="text-destructive" /> Build a weighted strategy around any agents.</div> }

export function Checkmark() { return <Check size={14} /> }

export default PredictionLanding
