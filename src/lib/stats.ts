import { ratio, type Brew, type RoastType } from '@/lib/brew'

const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null)

export type BestOf = {
  coffee: string
  brews: number
  best: Brew | null
}

export function bestPerCoffee(brews: Brew[]): BestOf[] {
  const groups = new Map<string, Brew[]>()
  for (const b of brews) {
    const key = b.coffee_name.trim().toLowerCase()
    groups.set(key, [...(groups.get(key) ?? []), b])
  }
  return [...groups.values()]
    .map((list) => {
      const rated = list.filter((b) => b.rating !== null)
      const best = rated.length
        ? rated.reduce((a, b) => ((b.rating ?? 0) > (a.rating ?? 0) ? b : a))
        : null
      return { coffee: list[0].coffee_name, brews: list.length, best }
    })
    .sort((a, b) => (b.best?.rating ?? -1) - (a.best?.rating ?? -1) || b.brews - a.brews)
}

export type Comparison = {
  metric: string
  unit: string
  good: number | null
  rest: number | null
  decimals: number
}

/**
 * What separates the cups worth repeating from the rest. Only shown when both
 * sides have entries, because a one-sided average says nothing.
 */
export function goodVsRest(brews: Brew[], roast: RoastType): { good: number; rest: number; rows: Comparison[] } | null {
  const scoped = brews.filter((b) => b.roast_type === roast && b.rating !== null)
  const good = scoped.filter((b) => (b.rating ?? 0) >= 7)
  const rest = scoped.filter((b) => (b.rating ?? 0) < 7)
  if (good.length === 0 || rest.length === 0) return null

  const pick = (list: Brew[], fn: (b: Brew) => number | null) =>
    avg(list.map(fn).filter((n): n is number => n !== null && !Number.isNaN(n)))

  const rows: Comparison[] = [
    {
      metric: 'Ratio',
      unit: ':1',
      good: pick(good, (b) => ratio(b.dose_g, b.water_g)),
      rest: pick(rest, (b) => ratio(b.dose_g, b.water_g)),
      decimals: 1,
    },
    {
      metric: 'Dose',
      unit: 'g',
      good: pick(good, (b) => Number(b.dose_g)),
      rest: pick(rest, (b) => Number(b.dose_g)),
      decimals: 1,
    },
    {
      metric: 'Temp',
      unit: '°C',
      good: pick(good, (b) => (b.water_temp_c === null ? null : Number(b.water_temp_c))),
      rest: pick(rest, (b) => (b.water_temp_c === null ? null : Number(b.water_temp_c))),
      decimals: 0,
    },
    {
      metric: 'Time',
      unit: 's',
      good: pick(good, (b) => b.brew_time_s),
      rest: pick(rest, (b) => b.brew_time_s),
      decimals: 0,
    },
    {
      metric: 'Acidity',
      unit: '/5',
      good: pick(good, (b) => b.acidity),
      rest: pick(rest, (b) => b.acidity),
      decimals: 1,
    },
    {
      metric: 'Bitterness',
      unit: '/5',
      good: pick(good, (b) => b.bitterness),
      rest: pick(rest, (b) => b.bitterness),
      decimals: 1,
    },
  ].filter((r) => r.good !== null && r.rest !== null)

  return { good: good.length, rest: rest.length, rows }
}

export function headline(brews: Brew[]) {
  const rated = brews.filter((b) => b.rating !== null)
  const coffees = new Set(brews.map((b) => b.coffee_name.trim().toLowerCase()))
  return {
    total: brews.length,
    filter: brews.filter((b) => b.roast_type === 'filter').length,
    espresso: brews.filter((b) => b.roast_type === 'espresso').length,
    coffees: coffees.size,
    avgRating: avg(rated.map((b) => b.rating as number)),
    bestRating: rated.length ? Math.max(...rated.map((b) => b.rating as number)) : null,
  }
}
