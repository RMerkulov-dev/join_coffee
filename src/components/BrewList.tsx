'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { RatioBar } from '@/components/RatioBar'
import { formatDate, formatTime, type Brew, type RoastType } from '@/lib/brew'

type Filter = 'all' | RoastType

export function BrewList({ brews }: { brews: Brew[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return brews.filter((b) => {
      if (filter !== 'all' && b.roast_type !== filter) return false
      if (!q) return true
      return [b.coffee_name, b.roaster, b.origin, b.brew_method, b.taste, b.comments, b.improve]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [brews, query, filter])

  if (brews.length === 0) {
    return (
      <div className="card mt-4 px-5 py-10 text-center">
        <p className="font-display text-[22px] font-semibold uppercase tracking-[0.04em]">No brews yet</p>
        <p className="mx-auto mt-2 max-w-[32ch] text-[15px]" style={{ color: 'var(--muted)' }}>
          Log the next cup you make — dose, water, grind, and what it tasted like. Two entries are enough to start
          comparing.
        </p>
        <Link
          href="/new"
          className="mt-5 inline-block rounded-full px-5 py-3 text-[15px] font-medium"
          style={{ background: 'var(--balance)', color: 'var(--on-balance)' }}
        >
          Log your first brew
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-1 pb-3" style={{ background: 'var(--paper)' }}>
        <input
          type="search"
          className="field"
          placeholder="Search coffee, roaster, notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search brews"
        />
        <div className="mt-2 flex gap-2">
          {(['all', 'filter', 'espresso'] as const).map((f) => {
            const on = filter === f
            const count = f === 'all' ? brews.length : brews.filter((b) => b.roast_type === f).length
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={on}
                className="rounded-full border px-3 py-1.5 text-[13px] capitalize"
                style={{
                  background: on ? 'var(--ink)' : 'transparent',
                  color: on ? 'var(--paper)' : 'var(--muted)',
                  borderColor: on ? 'var(--ink)' : 'var(--line)',
                }}
              >
                {f} <span className="num opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-1 py-8 text-center text-[15px]" style={{ color: 'var(--muted)' }}>
          Nothing matches that. Try a shorter search.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((b) => (
            <li key={b.id}>
              <BrewCard brew={b} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function BrewCard({ brew: b }: { brew: Brew }) {
  return (
    <Link href={`/brew/${b.id}`} className="card block px-4 py-3.5 print-break">
      <div className="flex items-baseline justify-between gap-3">
        <span className="num text-[11px]" style={{ color: 'var(--muted)' }}>
          {formatDate(b.brewed_on)}
        </span>
        <span className="eyebrow" style={{ color: b.roast_type === 'espresso' ? 'var(--over)' : 'var(--balance)' }}>
          {b.roast_type}
        </span>
      </div>

      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-[19px] font-semibold leading-tight">{b.coffee_name}</h2>
          <p className="truncate text-[13px]" style={{ color: 'var(--muted)' }}>
            {[b.roaster, b.brew_method, b.grind_setting && `grind ${b.grind_setting}`].filter(Boolean).join(' · ')}
          </p>
        </div>
        {b.rating !== null && (
          <span
            className="num shrink-0 rounded-md px-2 py-1 text-[13px] font-semibold"
            style={{
              background: b.rating >= 7 ? 'var(--balance-soft)' : 'transparent',
              color: b.rating >= 7 ? 'var(--balance)' : 'var(--muted)',
              border: b.rating >= 7 ? 'none' : '1px solid var(--line)',
            }}
          >
            {b.rating}/10
          </span>
        )}
      </div>

      <div className="mt-3">
        <RatioBar dose={b.dose_g} water={b.water_g} roast={b.roast_type} />
      </div>

      {(b.brew_time_s !== null || b.water_temp_c !== null || b.taste) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: 'var(--muted)' }}>
          {b.brew_time_s !== null && <span className="num">{formatTime(b.brew_time_s)}</span>}
          {b.water_temp_c !== null && <span className="num">{b.water_temp_c}°C</span>}
          {b.taste && <span className="min-w-0 flex-1 truncate italic">{b.taste}</span>}
        </div>
      )}
    </Link>
  )
}
