export type RoastType = 'filter' | 'espresso'

export type Brew = {
  id: string
  user_id: string
  brewed_on: string
  coffee_name: string
  roaster: string | null
  origin: string | null
  roast_type: RoastType
  grinder: string | null
  grind_setting: string | null
  brew_method: string
  dose_g: number
  water_g: number
  water_temp_c: number | null
  brew_time_s: number | null
  taste: string | null
  acidity: number | null
  bitterness: number | null
  sweetness: number | null
  body: number | null
  rating: number | null
  improve: string | null
  comments: string | null
  created_at: string
  updated_at: string
}

export type BrewDraft = Omit<Brew, 'id' | 'user_id' | 'created_at' | 'updated_at'>

/** Starting points for the method chips. The user's own past entries are merged in. */
export const METHODS: Record<RoastType, string[]> = {
  filter: ['V60', 'Chemex', 'Kalita Wave', 'AeroPress', 'French press', 'Switch', 'Moka pot', 'Cold brew'],
  espresso: ['Espresso', 'Ristretto', 'Lungo', 'Turbo shot'],
}

export const ROAST_LABEL: Record<RoastType, string> = {
  filter: 'Filter',
  espresso: 'Espresso',
}

/** Typical brew ratios, used to flag a shot or a cup that sits far outside the norm. */
export const RATIO_RANGE: Record<RoastType, [number, number]> = {
  filter: [14, 18],
  espresso: [1.5, 3],
}

export function ratio(dose: number, water: number): number | null {
  if (!dose || dose <= 0 || !water || water <= 0) return null
  return water / dose
}

export function formatRatio(dose: number, water: number): string {
  const r = ratio(dose, water)
  if (r === null) return '—'
  // One decimal matters when you're dialling in — 1:16.7 is not 1:17.
  return `1:${r.toFixed(1).replace(/\.0$/, '')}`
}

export function formatTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDate(iso: string): string {
  // Parsed as a plain calendar date — no timezone shifting.
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** The five-point taste scales, in the order they appear on the form. */
export const SCALES = [
  { key: 'acidity', label: 'Acidity', low: 'Flat', high: 'Sharp' },
  { key: 'sweetness', label: 'Sweetness', low: 'None', high: 'Syrupy' },
  { key: 'bitterness', label: 'Bitterness', low: 'None', high: 'Harsh' },
  { key: 'body', label: 'Body', low: 'Thin', high: 'Heavy' },
] as const

export type ScaleKey = (typeof SCALES)[number]['key']

export function emptyDraft(roast: RoastType = 'filter'): BrewDraft {
  return {
    brewed_on: today(),
    coffee_name: '',
    roaster: '',
    origin: '',
    roast_type: roast,
    grinder: '',
    grind_setting: '',
    brew_method: roast === 'filter' ? 'V60' : 'Espresso',
    dose_g: roast === 'filter' ? 15 : 18,
    water_g: roast === 'filter' ? 250 : 36,
    water_temp_c: roast === 'filter' ? 94 : null,
    brew_time_s: roast === 'filter' ? 150 : 28,
    taste: '',
    acidity: null,
    bitterness: null,
    sweetness: null,
    body: null,
    rating: null,
    improve: '',
    comments: '',
  }
}
