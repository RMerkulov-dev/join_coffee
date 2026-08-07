import { createClient } from '@/lib/supabase/server'

export const SUGGEST_FIELDS = ['coffee_name', 'roaster', 'origin', 'brew_method', 'grinder'] as const
export type SuggestField = (typeof SUGGEST_FIELDS)[number]
export type Suggestions = Record<SuggestField, string[]>

const EMPTY: Suggestions = { coffee_name: [], roaster: [], origin: [], brew_method: [], grinder: [] }

/** Everything this user has typed before, most-used first, for the form's autocomplete. */
export async function loadSuggestions(): Promise<Suggestions> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('my_suggestions')
    .select('field, value, uses, last_used')
    .order('uses', { ascending: false })
    .order('last_used', { ascending: false })

  if (error || !data) return EMPTY

  const out: Suggestions = { coffee_name: [], roaster: [], origin: [], brew_method: [], grinder: [] }
  for (const row of data as { field: SuggestField; value: string }[]) {
    if (out[row.field] && !out[row.field].includes(row.value)) out[row.field].push(row.value)
  }
  return out
}
