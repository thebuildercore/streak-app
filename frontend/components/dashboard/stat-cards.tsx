import { Wallet, TrendingUp, Copy, Flame, Target } from 'lucide-react'

export function StatCards() {
  const cards = [
    {
      title: 'Vault Balance',
      value: '1,245.68',
      currency: 'USDC',
      subtext: '≈ $1,245.68',
      icon: Wallet,
      color: 'text-[#a1a1aa]',
      valueColor: 'text-white'
    },
    {
      title: 'Total PnL',
      value: '+245.68',
      currency: 'USDC',
      subtext: '+24.56%',
      subtextColor: 'text-emerald-500',
      icon: TrendingUp,
      color: 'text-emerald-500',
      valueColor: 'text-emerald-500',
      sparkline: 'emerald'
    },
    {
      title: 'Copying PnL',
      value: '+198.42',
      currency: 'USDC',
      subtext: '+19.84%',
      subtextColor: 'text-emerald-500',
      icon: Copy,
      color: 'text-emerald-500',
      valueColor: 'text-emerald-500',
      sparkline: 'emerald'
    },
    {
      title: 'Rebel PnL',
      value: '+47.26',
      currency: 'USDC',
      subtext: '+47.26%',
      subtextColor: 'text-emerald-500',
      icon: Flame,
      color: 'text-[#ef4444]',
      valueColor: 'text-[#ef4444]',
      sparkline: 'red'
    },
    {
      title: 'Win Rate',
      value: '68.3%',
      currency: '',
      subtext: 'Total Trades: 127',
      icon: Target,
      color: 'text-[#a1a1aa]',
      valueColor: 'text-white'
    }
  ]

  return (
    <div className="grid grid-cols-5 gap-4 px-8 py-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-[#0c0c0c] border border-[#222] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center gap-2 text-[#71717a] mb-2">
            <card.icon size={16} className={card.color} />
            <span className="text-sm font-medium">{card.title}</span>
          </div>
          
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</span>
              {card.currency && <span className="text-xs text-[#71717a] font-medium">{card.currency}</span>}
            </div>
            <div className={`text-xs mt-1 font-medium ${card.subtextColor || 'text-[#71717a]'}`}>
              {card.subtext}
            </div>
          </div>

          {card.sparkline && (
            <div className="absolute right-0 bottom-4 w-20 h-10 opacity-50">
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                <path 
                  d="M0,40 L10,35 L20,38 L30,25 L40,30 L50,15 L60,20 L70,5 L80,15 L90,0 L100,10" 
                  fill="none" 
                  stroke={card.sparkline === 'emerald' ? '#10b981' : '#ef4444'} 
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
