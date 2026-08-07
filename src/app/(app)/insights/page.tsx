import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdvicePanel } from '@/components/AdvicePanel'
import { bestPerCoffee, goodVsRest, headline } from '@/lib/stats'
import { ROAST_LABEL, formatRatio, type Brew, type RoastType } from '@/lib/brew'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Insights · Brew Log' }

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card px-3 py-3">
      <div className="eyebrow" style={{ fontSize: 10 }}>{label}</div>
      <div className="num mt-1 text-[24px] leading-none font-semibold">{value}</div>
      {sub && (
        <div className="num mt-1 text-[11px]" style={{ color: 'var(--muted)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Comparison({ brews, roast }: { brews: Brew[]; roast: RoastType }) {
  const data = goodVsRest(brews, roast)
  if (!data) return null

  return (
    <section className="card mt-3 px-4 py-4">
      <h2 className="eyebrow border-b pb-2.5">{ROAST_LABEL[roast]} — what the good ones share</h2>
      <p className="mt-2.5 text-[13px]" style={{ color: 'var(--muted)' }}>
        Averages across {data.good} brew{data.good === 1 ? '' : 's'} you scored 7 or higher, against the other{' '}
        {data.rest}.
      </p>
      <table className="mt-3 w-full text-[14px]">
        <thead>
          <tr className="eyebrow" style={{ fontSize: 10 }}>
            <th className="pb-2 text-left font-semibold"> </th>
            <th className="pb-2 text-right font-semibold" style={{ color: 'var(--balance)' }}>
              7+
            </th>
            <th className="pb-2 text-right font-semibold">Rest</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.metric} className="border-t">
              <td className="py-2">{r.metric}</td>
              <td className="num py-2 text-right font-medium" style={{ color: 'var(--balance)' }}>
                {r.metric === 'Ratio' ? `1:${r.good!.toFixed(1)}` : `${r.good!.toFixed(r.decimals)}${r.unit}`}
              </td>
              <td className="num py-2 text-right" style={{ color: 'var(--muted)' }}>
                {r.metric === 'Ratio' ? `1:${r.rest!.toFixed(1)}` : `${r.rest!.toFixed(r.decimals)}${r.unit}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('brews')
    .select('*')
    .order('brewed_on', { ascending: false })
    .order('created_at', { ascending: false })

  const brews = (data ?? []) as Brew[]
  const h = headline(brews)
  const best = bestPerCoffee(brews).filter((r) => r.best)

  return (
    <div className="pt-1">
      <h1 className="font-display text-[26px] font-bold uppercase tracking-[-0.01em]">Insights</h1>
      <p className="mb-3 text-[14px]" style={{ color: 'var(--muted)' }}>
        The numbers come from your log. The read comes from the assistant.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Tile label="Brews" value={String(h.total)} sub={`${h.filter} filter · ${h.espresso} espresso`} />
        <Tile label="Coffees" value={String(h.coffees)} sub="distinct bags" />
        <Tile
          label="Average score"
          value={h.avgRating !== null ? h.avgRating.toFixed(1) : '—'}
          sub={h.avgRating !== null ? 'out of 10' : 'nothing rated yet'}
        />
        <Tile label="Best score" value={h.bestRating !== null ? `${h.bestRating}` : '—'} sub="out of 10" />
      </div>

      <Comparison brews={brews} roast="filter" />
      <Comparison brews={brews} roast="espresso" />

      {brews.length > 0 && !goodVsRest(brews, 'filter') && !goodVsRest(brews, 'espresso') && (
        <p className="mt-3 px-1 text-[14px]" style={{ color: 'var(--muted)' }}>
          Comparisons appear once you have at least two brews scored 7 or higher and two scored lower, within the same
          category. One of each would only show noise.
        </p>
      )}

      {best.length > 0 && (
        <section className="card mt-3 px-4 py-4">
          <h2 className="eyebrow border-b pb-2.5">Your best of each coffee</h2>
          <ul className="mt-1 divide-y">
            {best.map(({ coffee, brews: n, best: b }) => (
              <li key={coffee}>
                <Link href={`/brew/${b!.id}`} className="flex items-center gap-3 py-3">
                  <span
                    className="num w-9 shrink-0 rounded-md py-1 text-center text-[13px] font-semibold"
                    style={{ background: 'var(--balance-soft)', color: 'var(--balance)' }}
                  >
                    {b!.rating}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{coffee}</span>
                    <span className="num block truncate text-[12px]" style={{ color: 'var(--muted)' }}>
                      {formatRatio(b!.dose_g, b!.water_g)} · {b!.brew_method}
                      {b!.grind_setting ? ` · grind ${b!.grind_setting}` : ''} · {n} brew{n === 1 ? '' : 's'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AdvicePanel hasBrews={brews.length > 0} />
    </div>
  )
}
