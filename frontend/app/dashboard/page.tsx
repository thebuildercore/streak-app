import { DashboardHeader } from '@/components/dashboard/header'
import { StatCards } from '@/components/dashboard/stat-cards'
import { LiveRadar } from '@/components/dashboard/live-radar'
import { AIVaultSection } from '@/components/dashboard/ai-vault-section'
import { BottomWidgets } from '@/components/dashboard/bottom-widgets'
import { FooterStats } from '@/components/dashboard/footer-stats'

export const metadata = {
  title: 'Dashboard — StreakChaser',
  description: 'Live prediction markets dashboard on Somnia.',
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden">
      <DashboardHeader />
      
      <div className="flex-1 overflow-y-auto">
        <StatCards />
        
        <div className="px-8 pb-6 flex flex-col gap-6">
          <div className="grid grid-cols-[1fr_380px] gap-6 min-h-[400px]">
            <LiveRadar />
            <AIVaultSection />
          </div>
          
          <BottomWidgets />
        </div>
      </div>

      <FooterStats />
    </div>
  )
}
