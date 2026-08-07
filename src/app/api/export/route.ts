import { createClient } from '@/lib/supabase/server'
import { formatRatio, type Brew } from '@/lib/brew'

export const dynamic = 'force-dynamic'

const COLUMNS: { key: string; label: string; get: (b: Brew) => string | number | null }[] = [
  { key: 'brewed_on', label: 'Date', get: (b) => b.brewed_on },
  { key: 'roast_type', label: 'Roast', get: (b) => b.roast_type },
  { key: 'coffee_name', label: 'Coffee', get: (b) => b.coffee_name },
  { key: 'roaster', label: 'Roaster', get: (b) => b.roaster },
  { key: 'origin', label: 'Origin', get: (b) => b.origin },
  { key: 'brew_method', label: 'Method', get: (b) => b.brew_method },
  { key: 'grinder', label: 'Grinder', get: (b) => b.grinder },
  { key: 'grind_setting', label: 'Grind', get: (b) => b.grind_setting },
  { key: 'dose_g', label: 'Coffee (g)', get: (b) => b.dose_g },
  { key: 'water_g', label: 'Water (g)', get: (b) => b.water_g },
  { key: 'ratio', label: 'Ratio', get: (b) => formatRatio(b.dose_g, b.water_g) },
  { key: 'water_temp_c', label: 'Temp (C)', get: (b) => b.water_temp_c },
  { key: 'brew_time_s', label: 'Time (s)', get: (b) => b.brew_time_s },
  { key: 'acidity', label: 'Acidity', get: (b) => b.acidity },
  { key: 'sweetness', label: 'Sweetness', get: (b) => b.sweetness },
  { key: 'bitterness', label: 'Bitterness', get: (b) => b.bitterness },
  { key: 'body', label: 'Body', get: (b) => b.body },
  { key: 'rating', label: 'Rating', get: (b) => b.rating },
  { key: 'taste', label: 'Taste', get: (b) => b.taste },
  { key: 'improve', label: 'To improve', get: (b) => b.improve },
  { key: 'comments', label: 'Comments', get: (b) => b.comments },
]

function csvCell(value: string | number | null): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Sign in first.', { status: 401 })

  const format = new URL(request.url).searchParams.get('format') === 'json' ? 'json' : 'csv'

  const { data, error } = await supabase
    .from('brews')
    .select('*')
    .order('brewed_on', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return new Response(error.message, { status: 500 })
  const brews = (data ?? []) as Brew[]

  const stamp = brews[0]?.brewed_on ?? 'empty'
  const filename = `brew-log-${stamp}.${format}`

  if (format === 'json') {
    return new Response(JSON.stringify(brews, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const lines = [
    COLUMNS.map((c) => c.label).join(','),
    ...brews.map((b) => COLUMNS.map((c) => csvCell(c.get(b))).join(',')),
  ]

  // The BOM makes Excel open UTF-8 correctly on Windows.
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
