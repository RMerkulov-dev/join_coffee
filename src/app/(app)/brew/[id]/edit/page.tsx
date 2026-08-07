import { notFound } from 'next/navigation'
import { BrewForm } from '@/components/BrewForm'
import { createClient } from '@/lib/supabase/server'
import { loadSuggestions } from '@/lib/suggestions'
import type { Brew, BrewDraft } from '@/lib/brew'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Edit brew · Brew Log' }

export default async function EditBrewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('brews').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  const b = data as Brew

  const initial: BrewDraft = {
    brewed_on: b.brewed_on,
    coffee_name: b.coffee_name,
    roaster: b.roaster,
    origin: b.origin,
    roast_type: b.roast_type,
    grinder: b.grinder,
    grind_setting: b.grind_setting,
    brew_method: b.brew_method,
    dose_g: Number(b.dose_g),
    water_g: Number(b.water_g),
    water_temp_c: b.water_temp_c === null ? null : Number(b.water_temp_c),
    brew_time_s: b.brew_time_s,
    taste: b.taste,
    acidity: b.acidity,
    bitterness: b.bitterness,
    sweetness: b.sweetness,
    body: b.body,
    rating: b.rating,
    improve: b.improve,
    comments: b.comments,
  }

  const suggestions = await loadSuggestions()

  return (
    <>
      <h1 className="mb-3 pt-1 font-display text-[26px] font-bold uppercase tracking-[-0.01em]">Edit brew</h1>
      <BrewForm initial={initial} brewId={b.id} suggestions={suggestions} />
    </>
  )
}
