import { DashboardSidebar } from '@/components/app/sidebar'
import { DashboardTopbar } from '@/components/app/topbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  let user = null

  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase auth timeout in app layout.')), 3000)
      }),
    ])

    user = result.data.user
  } catch {
    user = null
  }

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden beach-shell">
      {/* Sidebar — hidden on mobile, handled by topbar overlay */}
      <div className="hidden md:flex">
        <DashboardSidebar email={user.email ?? 'Signed in'} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden md:ml-72">
        <DashboardTopbar email={user.email ?? 'Signed in'} />
        <main className="flex-1 overflow-y-auto px-6 pb-10 sm:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}
