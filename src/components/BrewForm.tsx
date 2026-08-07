'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deleteBrew, saveBrew } from '@/app/actions'
import { Chips, Label, Rating, Scale, Stepper, Suggest } from '@/components/fields'
import { RatioBar } from '@/components/RatioBar'
import { METHODS, SCALES, emptyDraft, formatTime, type BrewDraft, type RoastType } from '@/lib/brew'
import type { Suggestions } from '@/lib/suggestions'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card px-4 py-4">
      <h2 className="eyebrow mb-3.5 border-b pb-2.5">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function BrewForm({
  initial,
  brewId,
  suggestions,
}: {
  initial?: BrewDraft
  brewId?: string
  suggestions: Suggestions
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<BrewDraft>(initial ?? emptyDraft())
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = <K extends keyof BrewDraft>(key: K, value: BrewDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  /** Switching filter ↔ espresso is a different recipe entirely, so reset the numbers. */
  function switchRoast(roast: RoastType) {
    if (roast === draft.roast_type) return
    const base = emptyDraft(roast)
    setDraft((d) => ({
      ...d,
      roast_type: roast,
      brew_method: base.brew_method,
      dose_g: base.dose_g,
      water_g: base.water_g,
      water_temp_c: base.water_temp_c,
      brew_time_s: base.brew_time_s,
    }))
  }

  const methodOptions = Array.from(
    new Set([...METHODS[draft.roast_type], ...suggestions.brew_method, draft.brew_method].filter(Boolean)),
  )

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await saveBrew(draft, brewId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push(`/brew/${res.id}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3 pb-4">
      <Section title="The bag">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Date</Label>
            <input
              type="date"
              className="field num"
              value={draft.brewed_on}
              onChange={(e) => set('brewed_on', e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Roast</Label>
            <div className="flex gap-1 rounded-full border p-1">
              {(['filter', 'espresso'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={draft.roast_type === r}
                  onClick={() => switchRoast(r)}
                  className="flex-1 rounded-full py-1.5 text-[13px] capitalize"
                  style={{
                    background: draft.roast_type === r ? 'var(--balance)' : 'transparent',
                    color: draft.roast_type === r ? 'var(--on-balance)' : 'var(--muted)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label>Coffee</Label>
          <Suggest
            value={draft.coffee_name}
            onChange={(v) => set('coffee_name', v)}
            suggestions={suggestions.coffee_name}
            placeholder="Ethiopia Guji Natural"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Roaster</Label>
            <Suggest
              value={draft.roaster ?? ''}
              onChange={(v) => set('roaster', v)}
              suggestions={suggestions.roaster}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label>Origin</Label>
            <Suggest
              value={draft.origin ?? ''}
              onChange={(v) => set('origin', v)}
              suggestions={suggestions.origin}
              placeholder="Optional"
            />
          </div>
        </div>
      </Section>

      <Section title="The grind">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Grinder</Label>
            <Suggest
              value={draft.grinder ?? ''}
              onChange={(v) => set('grinder', v)}
              suggestions={suggestions.grinder}
              placeholder="1Zpresso J-Ultra"
            />
          </div>
          <div>
            <Label hint="clicks">Setting</Label>
            <input
              className="field num"
              value={draft.grind_setting ?? ''}
              onChange={(e) => set('grind_setting', e.target.value)}
              placeholder="4.2"
              inputMode="text"
            />
          </div>
        </div>
      </Section>

      <Section title="The brew">
        <div>
          <Label>Method</Label>
          <Chips
            options={methodOptions}
            value={draft.brew_method}
            onChange={(v) => set('brew_method', v)}
            ariaLabel="Brew method"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Dose</Label>
            <Stepper
              value={draft.dose_g}
              onChange={(v) => set('dose_g', v ?? 0)}
              step={0.5}
              decimals={1}
              min={0}
              unit="g"
            />
          </div>
          <div>
            <Label>{draft.roast_type === 'espresso' ? 'Yield' : 'Water'}</Label>
            <Stepper
              value={draft.water_g}
              onChange={(v) => set('water_g', v ?? 0)}
              step={draft.roast_type === 'espresso' ? 1 : 5}
              decimals={1}
              min={0}
              unit="g"
            />
          </div>
        </div>

        <div className="pt-1">
          <RatioBar dose={draft.dose_g} water={draft.water_g} roast={draft.roast_type} height={10} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Water temp</Label>
            <Stepper
              value={draft.water_temp_c}
              onChange={(v) => set('water_temp_c', v)}
              step={1}
              min={0}
              max={100}
              unit="°C"
            />
          </div>
          <div>
            <Label hint={formatTime(draft.brew_time_s)}>Time</Label>
            <Stepper
              value={draft.brew_time_s}
              onChange={(v) => set('brew_time_s', v === null ? null : Math.round(v))}
              step={draft.roast_type === 'espresso' ? 1 : 5}
              min={0}
              unit="s"
            />
          </div>
        </div>
      </Section>

      <Section title="The verdict">
        <div>
          <Label hint="what you actually tasted">Taste</Label>
          <textarea
            className="field min-h-[80px] resize-y"
            value={draft.taste ?? ''}
            onChange={(e) => set('taste', e.target.value)}
            placeholder="Blackcurrant up front, thin finish, a little papery"
          />
        </div>

        {SCALES.map((s) => (
          <div key={s.key}>
            <Label>{s.label}</Label>
            <Scale
              value={draft[s.key]}
              onChange={(v) => set(s.key, v)}
              low={s.low}
              high={s.high}
            />
          </div>
        ))}

        <div>
          <Label hint="would you make it again?">Overall</Label>
          <Rating value={draft.rating} onChange={(v) => set('rating', v)} />
        </div>

        <div>
          <Label hint="one change for next time">What to improve</Label>
          <textarea
            className="field min-h-[64px] resize-y"
            value={draft.improve ?? ''}
            onChange={(e) => set('improve', e.target.value)}
            placeholder="Grind two clicks finer"
          />
        </div>

        <div>
          <Label>Comments</Label>
          <textarea
            className="field min-h-[64px] resize-y"
            value={draft.comments ?? ''}
            onChange={(e) => set('comments', e.target.value)}
            placeholder="Anything else worth remembering"
          />
        </div>
      </Section>

      {error && (
        <p className="px-1 text-[14px]" style={{ color: 'var(--over)' }} role="alert">
          {error}
        </p>
      )}

      <div
        className="sticky z-30 -mx-4 px-4 pt-3 pb-3"
        style={{ bottom: 0, background: 'linear-gradient(to top, var(--paper) 70%, transparent)' }}
      >
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full py-3.5 text-[15px] font-medium disabled:opacity-60"
          style={{ background: 'var(--balance)', color: 'var(--on-balance)' }}
        >
          {pending ? 'Saving…' : brewId ? 'Save changes' : 'Save brew'}
        </button>
      </div>

      {brewId && (
        <div className="pt-2 text-center">
          {confirmDelete ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-[14px]" style={{ color: 'var(--muted)' }}>
                Delete this brew?
              </span>
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    const res = await deleteBrew(brewId)
                    if (!res.ok) return setError(res.error)
                    router.push('/')
                    router.refresh()
                  })
                }
                className="text-[14px] font-medium underline"
                style={{ color: 'var(--over)' }}
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-[14px] underline"
                style={{ color: 'var(--muted)' }}
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-[14px] underline"
              style={{ color: 'var(--muted)' }}
            >
              Delete brew
            </button>
          )}
        </div>
      )}
    </form>
  )
}
