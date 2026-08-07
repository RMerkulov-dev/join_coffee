import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TabBar } from '@/components/TabBar'
import { SignOut } from '@/components/SignOut'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  const name = profile?.display_name || user.email?.split('@')[0] || 'you'

  return (
    <div className="mx-auto max-w-2xl">
      <header className="no-print flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[15px] font-bold tracking-[0.16em] uppercase">Brew Log</span>
          <span className="num text-[11px]" style={{ color: 'var(--muted)' }}>
            {name}
          </span>
        </div>
        <SignOut />
      </header>
      <main className="px-4 pb-6">{children}</main>
      <TabBar />
    </div>
  )
}
