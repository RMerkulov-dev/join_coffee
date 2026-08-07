import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RatioBar } from '@/components/RatioBar'
import { SCALES, formatDate, formatRatio, formatTime, type Brew } from '@/lib/brew'

export const dynamic = 'force-dynamic'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l pl-3">
      <div className="eyebrow" style={{ fontSize: 10 }}>{label}</div>
      <div className="num mt-0.5 text-[17px] font-medium">{value}</div>
    </div>
  )
}

function ReadScale({ label, value, low, high }: { label: string; value: number | null; low: string; high: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[74px] shrink-0 text-[13px]" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className="h-2 flex-1 rounded-full"
            style={{ background: value !== null && n <= value ? 'var(--ink)' : 'var(--line-soft)' }}
          />
        ))}
      </div>
      <span className="num w-8 shrink-0 text-right text-[13px]" style={{ color: 'var(--muted)' }}>
        {value ?? '—'}
      </span>
      <span className="sr-only">
        {value === null ? 'not rated' : `${value} of 5, from ${low} to ${high}`}
      </span>
    </div>
  )
}

function Note({ label, text }: { label: string; text: string | null }) {
  if (!text) return null
  return (
    <div>
      <div className="eyebrow mb-1">{label}</div>
      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  )
}

export default async function BrewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('brews').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  const b = data as Brew

  const hasScales = SCALES.some((s) => b[s.key] !== null) || b.rating !== null

  return (
    <article className="pt-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="num text-[12px]" style={{ color: 'var(--muted)' }}>
          {formatDate(b.brewed_on)}
        </span>
        <span className="eyebrow" style={{ color: b.roast_type === 'espresso' ? 'var(--over)' : 'var(--balance)' }}>
          {b.roast_type} · {b.brew_method}
        </span>
      </div>

      <h1 className="mt-1 font-display text-[30px] leading-[1.05] font-bold tracking-[-0.01em]">{b.coffee_name}</h1>
      {(b.roaster || b.origin) && (
        <p className="mt-1 text-[14px]" style={{ color: 'var(--muted)' }}>
          {[b.roaster, b.origin].filter(Boolean).join(' · ')}
        </p>
      )}

      <div className="card mt-4 px-4 py-4 print-break">
        <RatioBar dose={b.dose_g} water={b.water_g} roast={b.roast_type} height={12} showLabel={false} />
        <div className="mt-4 grid grid-cols-3 gap-y-4">
          <Stat label="Ratio" value={formatRatio(b.dose_g, b.water_g)} />
          <Stat label="Dose" value={`${b.dose_g} g`} />
          <Stat label={b.roast_type === 'espresso' ? 'Yield' : 'Water'} value={`${b.water_g} g`} />
          <Stat label="Time" value={formatTime(b.brew_time_s)} />
          <Stat label="Temp" value={b.water_temp_c !== null ? `${b.water_temp_c} °C` : '—'} />
          <Stat label="Grind" value={b.grind_setting || '—'} />
        </div>
        {b.grinder && (
          <p className="mt-3 border-t pt-3 text-[13px]" style={{ color: 'var(--muted)' }}>
            Ground on {b.grinder}
          </p>
        )}
      </div>

      {hasScales && (
        <div className="card mt-3 px-4 py-4 print-break">
          <h2 className="eyebrow mb-3 border-b pb-2.5">Verdict</h2>
          <div className="space-y-2.5">
            {SCALES.map((s) => (
              <ReadScale key={s.key} label={s.label} value={b[s.key]} low={s.low} high={s.high} />
            ))}
          </div>
          {b.rating !== null && (
            <div className="mt-4 flex items-baseline gap-2 border-t pt-3">
              <span className="eyebrow">Overall</span>
              <span className="num text-[22px] font-semibold">{b.rating}</span>
              <span className="num text-[13px]" style={{ color: 'var(--muted)' }}>
                / 10
              </span>
            </div>
          )}
        </div>
      )}

      {(b.taste || b.improve || b.comments) && (
        <div className="card mt-3 space-y-4 px-4 py-4 print-break">
          <Note label="Taste" text={b.taste} />
          <Note label="What to improve" text={b.improve} />
          <Note label="Comments" text={b.comments} />
        </div>
      )}

      <div className="no-print mt-5 grid grid-cols-2 gap-3">
        <Link
          href={`/new?from=${b.id}`}
          className="rounded-full py-3 text-center text-[15px] font-medium"
          style={{ background: 'var(--balance)', color: 'var(--on-balance)' }}
        >
          Brew again
        </Link>
        <Link
          href={`/brew/${b.id}/edit`}
          className="rounded-full border py-3 text-center text-[15px] font-medium"
        >
          Edit
        </Link>
      </div>

      <div className="no-print mt-3 flex justify-between">
        <Link href="/" className="text-[14px] underline" style={{ color: 'var(--muted)' }}>
          Back to brews
        </Link>
        <Link
          href={`/chat?q=${encodeURIComponent(`What should I change about my ${b.coffee_name} on ${b.brew_method}?`)}`}
          className="text-[14px] underline"
          style={{ color: 'var(--muted)' }}
        >
          Ask about this cup
        </Link>
      </div>
    </article>
  )
}
