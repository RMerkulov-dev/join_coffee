'use client'

import { useRef, useState } from 'react'
import { Markdown } from '@/components/Markdown'

export function AdvicePanel({ hasBrews }: { hasBrews: boolean }) {
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const abort = useRef<AbortController | null>(null)

  async function run() {
    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller

    setText('')
    setError(null)
    setState('streaming')

    try {
      const res = await fetch('/api/insights', { method: 'POST', signal: controller.signal })
      if (!res.ok || !res.body) {
        setError((await res.text()) || `The advisor returned ${res.status}.`)
        setState('error')
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        setText((t) => t + decoder.decode(value, { stream: true }))
      }
      setState('done')
    } catch (e) {
      if (controller.signal.aborted) return
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setState('error')
    }
  }

  return (
    <section className="card mt-3 px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="eyebrow">The read</h2>
        {state !== 'idle' && state !== 'streaming' && (
          <button type="button" onClick={run} className="eyebrow no-print underline" style={{ color: 'var(--muted)' }}>
            Run again
          </button>
        )}
      </div>

      {state === 'idle' && (
        <>
          <p className="mt-2 text-[15px]" style={{ color: 'var(--muted)' }}>
            Read the whole log and get three experiments to run next.
          </p>
          <button
            type="button"
            onClick={run}
            disabled={!hasBrews}
            className="no-print mt-3 w-full rounded-full py-3 text-[15px] font-medium disabled:opacity-50"
            style={{ background: 'var(--balance)', color: 'var(--on-balance)' }}
          >
            {hasBrews ? 'Read my log' : 'Log a brew first'}
          </button>
        </>
      )}

      {state === 'streaming' && text === '' && (
        <p className="mt-3 text-[15px]" style={{ color: 'var(--muted)' }}>
          Reading your log<span className="animate-pulse">…</span>
        </p>
      )}

      {text && (
        <div className="mt-3">
          <Markdown text={text} />
        </div>
      )}

      {error && (
        <p className="mt-3 text-[14px]" style={{ color: 'var(--over)' }} role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
