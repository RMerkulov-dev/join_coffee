'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="eyebrow">{children}</span>
      {hint && <span className="num text-[11px]" style={{ color: 'var(--muted)' }}>{hint}</span>}
    </div>
  )
}

/** Horizontal pills. One choice, always visible — faster on a phone than a select. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly T[]
  value: T | null
  onChange: (v: T) => void
  ariaLabel: string
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2" role="radiogroup" aria-label={ariaLabel}>
        {options.map((opt) => {
          const on = opt === value
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(opt)}
              className="shrink-0 rounded-full border px-3.5 py-2 text-[14px] transition-colors"
              style={{
                background: on ? 'var(--balance)' : 'transparent',
                color: on ? 'var(--on-balance)' : 'var(--ink)',
                borderColor: on ? 'var(--balance)' : 'var(--line)',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** A five-point tick scale, laid out like the row of a cupping form. */
export function Scale({
  value,
  onChange,
  low,
  high,
}: {
  value: number | null
  onChange: (v: number | null) => void
  low: string
  high: string
}) {
  return (
    <div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = value !== null && n <= value
          const exact = value === n
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} of 5`}
              aria-pressed={exact}
              onClick={() => onChange(exact ? null : n)}
              className="num h-11 flex-1 rounded-lg border text-[13px] transition-colors"
              style={{
                background: on ? 'var(--balance)' : 'transparent',
                color: on ? 'var(--on-balance)' : 'var(--muted)',
                borderColor: on ? 'var(--balance)' : 'var(--line)',
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-[11px]" style={{ color: 'var(--muted)' }}>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

/** Overall score, 1–10. Wider than the taste scales because it carries more. */
export function Rating({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const on = value !== null && n <= value
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} out of 10`}
            aria-pressed={value === n}
            onClick={() => onChange(value === n ? null : n)}
            className="num h-11 flex-1 rounded-md border text-[12px] transition-colors"
            style={{
              background: on ? 'var(--ink)' : 'transparent',
              color: on ? 'var(--paper)' : 'var(--muted)',
              borderColor: on ? 'var(--ink)' : 'var(--line)',
            }}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

/** Number entry with thumb-sized steppers, for one-handed use at the counter. */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  unit,
  decimals = 0,
}: {
  value: number | null
  onChange: (v: number | null) => void
  step?: number
  min?: number
  max?: number
  unit?: string
  decimals?: number
}) {
  const clamp = (n: number) => {
    let v = n
    if (min !== undefined) v = Math.max(min, v)
    if (max !== undefined) v = Math.min(max, v)
    return Number(v.toFixed(decimals))
  }

  const bump = (delta: number) => onChange(clamp((value ?? 0) + delta))

  return (
    <div className="flex items-stretch overflow-hidden border" style={{ borderRadius: 10 }}>
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => bump(-step)}
        className="w-10 shrink-0 border-r text-[20px] leading-none"
        style={{ color: 'var(--muted)' }}
      >
        −
      </button>
      <div className="flex min-w-0 flex-1 items-baseline gap-1 px-1.5">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={value ?? ''}
          onChange={(e) => {
            if (e.target.value === '') return onChange(null)
            const n = Number(e.target.value)
            // Let the value be typed freely; onBlur pulls it back into range.
            if (!Number.isNaN(n)) onChange(n)
          }}
          onBlur={() => {
            if (value !== null && clamp(value) !== value) onChange(clamp(value))
          }}
          className="num min-w-0 flex-1 bg-transparent py-3 text-right text-[17px] font-medium outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {unit && (
          <span className="num shrink-0 text-[12px]" style={{ color: 'var(--muted)' }}>
            {unit}
          </span>
        )}
      </div>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => bump(step)}
        className="w-10 shrink-0 border-l text-[20px] leading-none"
        style={{ color: 'var(--muted)' }}
      >
        +
      </button>
    </div>
  )
}

/**
 * Free text that remembers. Every name you've entered before is offered back
 * as you type, so the same bag is spelled the same way every time.
 */
export function Suggest({
  value,
  onChange,
  suggestions,
  placeholder,
  autoFocus,
  name,
}: {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
  autoFocus?: boolean
  name?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const wrap = useRef<HTMLDivElement>(null)
  const listId = useId()

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    const pool = suggestions.filter((s) => s.toLowerCase() !== q)
    if (!q) return pool.slice(0, 8)
    return pool.filter((s) => s.toLowerCase().includes(q)).slice(0, 8)
  }, [value, suggestions])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const pick = (s: string) => {
    onChange(s)
    setOpen(false)
    setActive(-1)
  }

  return (
    <div ref={wrap} className="relative">
      <input
        name={name}
        type="text"
        className="field"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => (a + 1) % matches.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => (a <= 0 ? matches.length - 1 : a - 1))
          } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault()
            pick(matches[active])
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
      />
      {open && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="card absolute z-30 mt-1 max-h-64 w-full overflow-y-auto py-1 shadow-lg"
        >
          {matches.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className="w-full px-3 py-2.5 text-left text-[15px]"
                style={{ background: i === active ? 'var(--line-soft)' : 'transparent' }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
