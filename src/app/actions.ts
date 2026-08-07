'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { BrewDraft } from '@/lib/brew'

type Result = { ok: true; id: string } | { ok: false; error: string }

/** A number, or null if it is missing, blank or not finite. */
function num(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** An integer, or null. Range is checked separately so the message can name the field. */
function int(v: number | null | undefined): number | null {
  const n = num(v)
  return n === null ? null : Math.round(n)
}

function clean(draft: BrewDraft) {
  const text = (v: string | null | undefined) => {
    const t = (v ?? '').trim()
    return t === '' ? null : t
  }
  return {
    brewed_on: draft.brewed_on,
    coffee_name: (draft.coffee_name ?? '').trim(),
    roaster: text(draft.roaster),
    origin: text(draft.origin),
    roast_type: draft.roast_type,
    grinder: text(draft.grinder),
    grind_setting: text(draft.grind_setting),
    brew_method: (draft.brew_method ?? '').trim(),
    dose_g: num(draft.dose_g),
    water_g: num(draft.water_g),
    water_temp_c: num(draft.water_temp_c),
    brew_time_s: int(draft.brew_time_s),
    taste: text(draft.taste),
    acidity: int(draft.acidity),
    bitterness: int(draft.bitterness),
    sweetness: int(draft.sweetness),
    body: int(draft.body),
    rating: int(draft.rating),
    improve: text(draft.improve),
    comments: text(draft.comments),
  }
}

/**
 * Everything the database would reject, caught here so the user reads a
 * sentence instead of a constraint name.
 */
function firstProblem(row: ReturnType<typeof clean>): string | null {
  if (!row.coffee_name) return 'Give the coffee a name so you can find it later.'
  if (!row.brew_method) return 'Pick a brew method.'
  if (row.dose_g === null || row.dose_g <= 0) return 'Dose needs a number above zero.'
  if (row.water_g === null || row.water_g <= 0) {
    return 'Water needs a number above zero.'
  }
  if (row.brew_time_s !== null && row.brew_time_s < 0) return 'Time can’t be negative.'
  if (row.water_temp_c !== null && (row.water_temp_c < 0 || row.water_temp_c > 100)) {
    return 'Water temperature has to be between 0 and 100 °C.'
  }
  for (const key of ['acidity', 'sweetness', 'bitterness', 'body'] as const) {
    const v = row[key]
    if (v !== null && (v < 1 || v > 5)) {
      return `${key[0].toUpperCase()}${key.slice(1)} has to be between 1 and 5.`
    }
  }
  if (row.rating !== null && (row.rating < 1 || row.rating > 10)) {
    return 'Overall score has to be between 1 and 10.'
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.brewed_on)) return 'Pick a valid date.'
  return null
}

export async function saveBrew(draft: BrewDraft, id?: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Your session expired. Sign in again.' }

  const row = clean(draft)
  const problem = firstProblem(row)
  if (problem) return { ok: false, error: problem }

  const query = id
    ? supabase.from('brews').update(row).eq('id', id).eq('user_id', user.id).select('id').single()
    : supabase.from('brews').insert({ ...row, user_id: user.id }).select('id').single()

  const { data, error } = await query
  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/insights')
  revalidatePath('/export')
  if (id) revalidatePath(`/brew/${id}`)

  return { ok: true, id: data.id }
}

export async function deleteBrew(id: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Your session expired. Sign in again.' }

  const { error } = await supabase.from('brews').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/insights')
  revalidatePath('/export')
  return { ok: true, id }
}
