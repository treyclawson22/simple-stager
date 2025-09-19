import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { DashboardNav } from '@/components/dashboard-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  
  console.log('Layout user data:', user)

  // Temporarily allow access without authentication for testing
  // if (!user) {
  //   redirect('/auth/signin')
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-5 md:px-[60px] lg:px-[100px]">
          {children}
        </div>
      </main>
    </div>
  )
}