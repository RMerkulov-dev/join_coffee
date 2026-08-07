import { BrewForm } from '@/components/BrewForm'
import { loadSuggestions } from '@/lib/suggestions'
import { createClient } from '@/lib/supabase/server'
import { emptyDraft, today, type Brew, type BrewDraft } from '@/lib/brew'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Log a brew · Brew Log' }

export default async function NewBrewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const { from } = await searchParams
  const suggestions = await loadSuggestions()

  let initial: BrewDraft = emptyDraft()
  let repeatOf: string | null = null

  if (from) {
    const supabase = await createClient()
    const { data } = await supabase.from('brews').select('*').eq('id', from).maybeSingle()
    if (data) {
      const b = data as Brew
      initial = {
        brewed_on: today(),
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
        // The verdict is what you're about to find out — start it blank.
        taste: '',
        acidity: null,
        bitterness: null,
        sweetness: null,
        body: null,
        rating: null,
        improve: '',
        comments: b.improve ? `Trying: ${b.improve}` : '',
      }
      repeatOf = b.coffee_name
    }
  }

  return (
    <>
      <div className="mb-3 pt-1">
        <h1 className="font-display text-[26px] font-bold uppercase tracking-[-0.01em]">
          {repeatOf ? 'Brew again' : 'Log a brew'}
        </h1>
        <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
          {repeatOf
            ? `Same recipe as your last ${repeatOf}. Adjust what you changed.`
            : 'Fill in what you can. Everything except the coffee, method, dose and water is optional.'}
        </p>
      </div>
      <BrewForm initial={initial} suggestions={suggestions} />
    </>
  )
}
