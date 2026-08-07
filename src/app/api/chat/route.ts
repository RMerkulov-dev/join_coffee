import { after } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { loadBrewContext, SYSTEM_PROMPT } from '@/lib/ai-context'
import { streamCompletion, type ChatMessage } from '@/lib/openrouter'

export const runtime = 'nodejs'
export const maxDuration = 60

const HISTORY_LIMIT = 24

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Sign in first.', { status: 401 })

  if (!process.env.OPENROUTER_API_KEY) {
    return new Response('OPENROUTER_API_KEY is missing. Add it in your Vercel project settings.', { status: 500 })
  }

  const { message } = (await request.json()) as { message?: string }
  const question = (message ?? '').trim()
  if (!question) return new Response('Type a question first.', { status: 400 })

  const [{ text: logText }, { data: history }] = await Promise.all([
    loadBrewContext(),
    supabase
      .from('chat_messages')
      .select('role, content')
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT),
  ])

  const priorTurns = ((history ?? []) as ChatMessage[]).reverse()

  const messages: ChatMessage[] = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n---\n\n${logText}` },
    ...priorTurns,
    { role: 'user', content: question },
  ]

  const { error: saveError } = await supabase
    .from('chat_messages')
    .insert({ user_id: user.id, role: 'user', content: question })
  if (saveError) return new Response(saveError.message, { status: 500 })

  try {
    const stream = await streamCompletion(messages, { maxTokens: 1400 })
    const [toClient, toStore] = stream.tee()

    // Persist the reply once the response has been fully delivered. This runs
    // after the request scope is gone, so it uses a token-bearing client of its
    // own rather than the cookie-backed one.
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token

    after(async () => {
      const reader = toStore.getReader()
      const decoder = new TextDecoder()
      let full = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
      }
      if (!full.trim() || !accessToken) return

      const writer = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false } },
      )
      await writer.from('chat_messages').insert({ user_id: user.id, role: 'assistant', content: full })
    })

    return new Response(toClient, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (e) {
    return new Response(e instanceof Error ? e.message : 'The advisor is unavailable.', { status: 502 })
  }
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Sign in first.', { status: 401 })

  const { error } = await supabase.from('chat_messages').delete().eq('user_id', user.id)
  if (error) return new Response(error.message, { status: 500 })
  return new Response(null, { status: 204 })
}
