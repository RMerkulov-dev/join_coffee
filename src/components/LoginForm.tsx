'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/fields'

type Mode = 'signin' | 'signup'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/'

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    const supabase = createClient()

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name || email.split('@')[0] } },
      })
      if (error) {
        setError(error.message)
        setBusy(false)
        return
      }
      if (!data.session) {
        setNotice('Check your inbox to confirm the address, then sign in.')
        setMode('signin')
        setBusy(false)
        return
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setBusy(false)
        return
      }
    }

    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div
        className="flex gap-1 rounded-full border p-1"
        role="tablist"
        aria-label="Sign in or create an account"
      >
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m)
              setError(null)
            }}
            className="flex-1 rounded-full py-2 text-[14px] transition-colors"
            style={{
              background: mode === m ? 'var(--balance)' : 'transparent',
              color: mode === m ? 'var(--on-balance)' : 'var(--muted)',
            }}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {mode === 'signup' && (
        <div>
          <Label>Name</Label>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should the app call you?"
            autoComplete="name"
          />
        </div>
      )}

      <div>
        <Label>Email</Label>
        <input
          className="field"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
        />
      </div>

      <div>
        <Label hint={mode === 'signup' ? '8 characters or more' : undefined}>Password</Label>
        <input
          className="field"
          type="password"
          required
          minLength={mode === 'signup' ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />
      </div>

      {error && (
        <p className="text-[14px]" style={{ color: 'var(--over)' }} role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="text-[14px]" style={{ color: 'var(--balance)' }} role="status">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full py-3.5 text-[15px] font-medium disabled:opacity-60"
        style={{ background: 'var(--ink)', color: 'var(--paper)' }}
      >
        {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  )
}
