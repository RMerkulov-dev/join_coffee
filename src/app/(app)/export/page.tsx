import { createClient } from '@/lib/supabase/server'
import { PrintButton } from '@/components/PrintButton'
import { formatDate, formatRatio, formatTime, type Brew } from '@/lib/brew'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Export · Brew Log' }

export default async function ExportPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('brews')
    .select('*')
    .order('brewed_on', { ascending: false })
    .order('created_at', { ascending: false })

  const brews = (data ?? []) as Brew[]

  return (
    <div className="pt-1">
      <h1 className="font-display text-[26px] font-bold uppercase tracking-[-0.01em]">Export</h1>
      <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
        {brews.length} entr{brews.length === 1 ? 'y' : 'ies'}. Take the whole log with you.
      </p>

      <div className="no-print mt-4 grid grid-cols-3 gap-2">
        <a
          href="/api/export?format=csv"
          className="rounded-full py-3 text-center text-[15px] font-medium"
          style={{ background: 'var(--balance)', color: 'var(--on-balance)' }}
        >
          CSV
        </a>
        <a href="/api/export?format=json" className="rounded-full border py-3 text-center text-[15px] font-medium">
          JSON
        </a>
        <PrintButton />
      </div>
      <p className="no-print mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
        CSV opens in Excel, Numbers and Google Sheets. Print gives you the table below on paper or as a PDF.
      </p>

      <div className="mt-5">
        <div className="mb-3 hidden print:block">
          <h2 className="font-display text-[20px] font-bold uppercase">Brew Log</h2>
          <p className="num text-[11px]">{brews.length} entries</p>
        </div>

        {brews.length === 0 ? (
          <p className="card px-4 py-8 text-center text-[15px]" style={{ color: 'var(--muted)' }}>
            Nothing to export yet.
          </p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[640px] border-collapse text-[12px]">
              <thead>
                <tr className="eyebrow border-b" style={{ fontSize: 9 }}>
                  <th className="py-2 pr-2 text-left font-semibold">Date</th>
                  <th className="py-2 pr-2 text-left font-semibold">Coffee</th>
                  <th className="py-2 pr-2 text-left font-semibold">Method</th>
                  <th className="py-2 pr-2 text-right font-semibold">Grind</th>
                  <th className="py-2 pr-2 text-right font-semibold">Dose</th>
                  <th className="py-2 pr-2 text-right font-semibold">Water</th>
                  <th className="py-2 pr-2 text-right font-semibold">Ratio</th>
                  <th className="py-2 pr-2 text-right font-semibold">Temp</th>
                  <th className="py-2 pr-2 text-right font-semibold">Time</th>
                  <th className="py-2 pr-2 text-right font-semibold">Score</th>
                  <th className="py-2 text-left font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {brews.map((b) => (
                  <tr key={b.id} className="border-b align-top print-break">
                    <td className="num py-2 pr-2 whitespace-nowrap">{formatDate(b.brewed_on)}</td>
                    <td className="py-2 pr-2">
                      <span className="block font-medium">{b.coffee_name}</span>
                      {b.roaster && <span style={{ color: 'var(--muted)' }}>{b.roaster}</span>}
                    </td>
                    <td className="py-2 pr-2 whitespace-nowrap">{b.brew_method}</td>
                    <td className="num py-2 pr-2 text-right">{b.grind_setting ?? '—'}</td>
                    <td className="num py-2 pr-2 text-right">{b.dose_g}</td>
                    <td className="num py-2 pr-2 text-right">{b.water_g}</td>
                    <td className="num py-2 pr-2 text-right">{formatRatio(b.dose_g, b.water_g)}</td>
                    <td className="num py-2 pr-2 text-right">{b.water_temp_c ?? '—'}</td>
                    <td className="num py-2 pr-2 text-right">{formatTime(b.brew_time_s)}</td>
                    <td className="num py-2 pr-2 text-right">{b.rating ?? '—'}</td>
                    <td className="py-2" style={{ minWidth: 160 }}>
                      {b.taste && <span className="block">{b.taste}</span>}
                      {b.improve && (
                        <span className="block" style={{ color: 'var(--muted)' }}>
                          → {b.improve}
                        </span>
                      )}
                      {b.comments && (
                        <span className="block" style={{ color: 'var(--muted)' }}>
                          {b.comments}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
