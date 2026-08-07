'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SignOut() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await createClient().auth.signOut()
        router.push('/login')
        router.refresh()
      }}
      className="eyebrow"
      style={{ color: 'var(--muted)' }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
