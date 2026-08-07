'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Markdown } from '@/components/Markdown'

type Msg = { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  'What should I change to make my filter sweeter?',
  'Which coffee am I dialling in best, and why?',
  'Is my espresso ratio in a sensible range?',
  'What single experiment would teach me the most right now?',
]

export function Chat({ initial, hasBrews }: { initial: Msg[]; hasBrews: boolean }) {
  const params = useSearchParams()
  const [messages, setMessages] = useState<Msg[]>(initial)
  const [input, setInput] = useState(params.get('q') ?? '')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, streaming])

  async function send(question: string) {
    const text = question.trim()
    if (!text || streaming) return

    setInput('')
    setError(null)
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: '' }])
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok || !res.body) {
        setError((await res.text()) || `The advisor returned ${res.status}.`)
        setMessages((m) => m.slice(0, -1))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((m) => {
          const next = [...m]
          next[next.length - 1] = { role: 'assistant', content: next[next.length - 1].content + chunk }
          return next
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setMessages((m) => (m[m.length - 1]?.content === '' ? m.slice(0, -1) : m))
    } finally {
      setStreaming(false)
    }
  }

  async function clearChat() {
    const res = await fetch('/api/chat', { method: 'DELETE' })
    if (res.ok) setMessages([])
  }

  return (
    <div className="flex min-h-[calc(100dvh-190px)] flex-col">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-[26px] font-bold uppercase tracking-[-0.01em]">Ask</h1>
        {messages.length > 0 && (
          <button type="button" onClick={clearChat} className="eyebrow underline" style={{ color: 'var(--muted)' }}>
            Clear
          </button>
        )}
      </div>
      <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
        The assistant reads your whole log before answering.
      </p>

      <div className="flex-1 space-y-3 py-4">
        {messages.length === 0 && (
          <div className="pt-2">
            {!hasBrews && (
              <p className="card mb-4 px-4 py-3 text-[14px]" style={{ color: 'var(--muted)' }}>
                Your log is empty, so answers will be generic. Record a brew or two first.
              </p>
            )}
            <p className="eyebrow mb-2">Try asking</p>
            <div className="space-y-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="card w-full px-3.5 py-3 text-left text-[14px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <p
                className="max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-[15px]"
                style={{ background: 'var(--ink)', color: 'var(--paper)' }}
              >
                {m.content}
              </p>
            </div>
          ) : (
            <div key={i} className="card px-4 py-3.5">
              {m.content ? (
                <Markdown text={m.content} />
              ) : (
                <span className="animate-pulse text-[15px]" style={{ color: 'var(--muted)' }}>
                  Thinking…
                </span>
              )}
            </div>
          ),
        )}

        {error && (
          <p className="text-[14px]" style={{ color: 'var(--over)' }} role="alert">
            {error}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="sticky -mx-4 flex items-end gap-2 px-4 pt-3 pb-3"
        style={{ bottom: 0, background: 'linear-gradient(to top, var(--paper) 75%, transparent)' }}
      >
        <textarea
          className="field max-h-40 min-h-[46px] flex-1 resize-none py-3"
          rows={1}
          value={input}
          placeholder="Ask about your brews…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          aria-label="Send"
          className="h-[46px] w-[46px] shrink-0 rounded-full disabled:opacity-40"
          style={{ background: 'var(--balance)', color: 'var(--on-balance)' }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto"
            aria-hidden
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </form>
    </div>
  )
}
