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
    <div className="flex min-h-screen bg-transparent">
      <div className="hidden md:flex">
        <DashboardSidebar email={user.email ?? 'Signed in'} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col md:ml-72">
        <DashboardTopbar email={user.email ?? 'Signed in'} />
        <main className="flex-1 px-6 pb-10 pt-2 sm:px-10">
          <div className="stitch-page-shell px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
