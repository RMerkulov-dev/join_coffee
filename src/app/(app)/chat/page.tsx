import { Suspense } from 'react'
import { Chat } from '@/components/Chat'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ask · Brew Log' }

export default async function ChatPage() {
  const supabase = await createClient()

  const [{ data: history }, { count }] = await Promise.all([
    supabase.from('chat_messages').select('role, content').order('created_at', { ascending: true }).limit(200),
    supabase.from('brews').select('id', { count: 'exact', head: true }),
  ])

  return (
    <Suspense>
      <Chat
        initial={(history ?? []) as { role: 'user' | 'assistant'; content: string }[]}
        hasBrews={(count ?? 0) > 0}
      />
    </Suspense>
  )
}
