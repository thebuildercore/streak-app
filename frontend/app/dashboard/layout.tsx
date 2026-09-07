import { Sidebar } from '@/components/sidebar'
import { Providers } from '@/components/providers'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <div className="flex h-screen bg-black overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </Providers>
  )
}
