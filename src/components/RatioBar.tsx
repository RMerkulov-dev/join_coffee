import { RATIO_RANGE, formatRatio, ratio, type RoastType } from '@/lib/brew'

/**
 * The signature reading of any recipe: how much coffee sits against how much
 * water, drawn to scale. A 1:16 pour-over is a sliver against a long band; a
 * 1:2 espresso is a third of the bar. You can tell the two apart at a glance
 * in a list without reading a single number.
 */
export function RatioBar({
  dose,
  water,
  roast,
  height = 8,
  showLabel = true,
}: {
  dose: number
  water: number
  roast: RoastType
  height?: number
  showLabel?: boolean
}) {
  const r = ratio(dose, water)
  const total = dose + water
  const dosePct = total > 0 ? (dose / total) * 100 : 0
  const [lo, hi] = RATIO_RANGE[roast]
  const outside = r !== null && (r < lo || r > hi)

  return (
    <div className="w-full">
      <div
        className="flex w-full overflow-hidden rounded-full"
        style={{ height, background: 'var(--water)' }}
        role="img"
        aria-label={`Brew ratio ${formatRatio(dose, water)}, ${dose} g coffee to ${water} g water`}
      >
        <div style={{ width: `${dosePct}%`, background: 'var(--ink)' }} />
      </div>
      {showLabel && (
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="num text-[13px] font-medium">{formatRatio(dose, water)}</span>
          <span className="num text-[12px]" style={{ color: outside ? 'var(--over)' : 'var(--muted)' }}>
            {dose} g · {water} g
          </span>
        </div>
      )}
    </div>
  )
}
