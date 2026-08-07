import { createClient } from '@/lib/supabase/server'
import { BrewList } from '@/components/BrewList'
import type { Brew } from '@/lib/brew'

export const dynamic = 'force-dynamic'

export default async function BrewsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brews')
    .select('*')
    .order('brewed_on', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <p className="card mt-4 px-4 py-6 text-[15px]" style={{ color: 'var(--over)' }}>
        Couldn&apos;t load your brews: {error.message}
      </p>
    )
  }

  return <BrewList brews={(data ?? []) as Brew[]} />
}
