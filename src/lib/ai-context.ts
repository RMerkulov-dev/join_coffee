import { createClient } from '@/lib/supabase/server'
import { formatRatio, formatTime, type Brew } from '@/lib/brew'

export const SYSTEM_PROMPT = `You are the resident brewing advisor inside Brew Log, a personal coffee journal. The user is learning filter and espresso and is trying to dial in each coffee they buy.

You are given their complete brew log. Ground every claim in it — cite the specific entries you are reasoning from by date and coffee name. Never invent a brew that is not in the log.

How to advise:
- Change one variable at a time and say which one, in what direction, by how much. "Grind two clicks finer" beats "grind finer".
- Read the taste notes against the numbers. Sour, thin, and fast usually means under-extraction: grind finer, raise temperature, extend contact time, or raise the ratio. Bitter, drying, and slow usually means over-extraction: coarser, cooler, shorter, lower ratio.
- Respect what they already wrote in "what to improve" — if they planned a change, check whether the next brew actually tested it.
- Filter typically lands between 1:14 and 1:18; espresso between 1:1.5 and 1:3. Flag anything far outside, but treat their own high-rated brews as the real target.
- If the log is too thin to support a conclusion, say so and name the one experiment that would settle it.

How to write:
- Plain English, metric units, no preamble, no flattery.
- Short paragraphs or tight bullets. Markdown headings only when the answer has more than one section.
- Be concrete and brief. The user is reading this on a phone.`

/** A compact, model-readable dump of the log. One line per brew. */
export async function loadBrewContext(limit = 250): Promise<{ text: string; count: number }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('brews')
    .select('*')
    .order('brewed_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  const brews = (data ?? []) as Brew[]
  if (brews.length === 0) {
    return { text: 'The brew log is empty. The user has not recorded any brews yet.', count: 0 }
  }

  const rows = brews.map((b) => {
    const parts = [
      b.brewed_on,
      b.roast_type,
      b.coffee_name + (b.roaster ? ` (${b.roaster})` : ''),
      b.origin,
      b.brew_method,
      b.grinder && b.grind_setting ? `${b.grinder} @ ${b.grind_setting}` : b.grind_setting ? `grind ${b.grind_setting}` : null,
      `${b.dose_g}g -> ${b.water_g}g (${formatRatio(b.dose_g, b.water_g)})`,
      b.water_temp_c !== null ? `${b.water_temp_c}C` : null,
      b.brew_time_s !== null ? formatTime(b.brew_time_s) : null,
      scaleSummary(b),
      b.rating !== null ? `rating ${b.rating}/10` : null,
      b.taste ? `taste: ${b.taste}` : null,
      b.improve ? `to improve: ${b.improve}` : null,
      b.comments ? `note: ${b.comments}` : null,
    ].filter(Boolean)
    return `- ${parts.join(' | ')}`
  })

  const byCoffee = new Map<string, Brew[]>()
  for (const b of brews) {
    const key = b.coffee_name.trim().toLowerCase()
    byCoffee.set(key, [...(byCoffee.get(key) ?? []), b])
  }

  const summary = [...byCoffee.entries()]
    .map(([, list]) => {
      const rated = list.filter((b) => b.rating !== null)
      const best = rated.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]
      return `- ${list[0].coffee_name}: ${list.length} brew(s)${
        best ? `, best ${best.rating}/10 on ${best.brewed_on} (${best.dose_g}g/${best.water_g}g, ${best.brew_method}, grind ${best.grind_setting ?? 'n/a'})` : ', none rated yet'
      }`
    })
    .join('\n')

  const text = [
    `BREW LOG — ${brews.length} entr${brews.length === 1 ? 'y' : 'ies'}, newest first.`,
    '',
    'PER COFFEE:',
    summary,
    '',
    'ALL ENTRIES:',
    ...rows,
  ].join('\n')

  return { text, count: brews.length }
}

function scaleSummary(b: Brew): string | null {
  const parts = [
    b.acidity !== null ? `acidity ${b.acidity}/5` : null,
    b.sweetness !== null ? `sweetness ${b.sweetness}/5` : null,
    b.bitterness !== null ? `bitterness ${b.bitterness}/5` : null,
    b.body !== null ? `body ${b.body}/5` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}
