import { createClient } from '@/lib/supabase/server'
import { loadBrewContext, SYSTEM_PROMPT } from '@/lib/ai-context'
import { streamCompletion } from '@/lib/openrouter'

export const runtime = 'nodejs'
export const maxDuration = 60

const ASK = `Review my brew log and tell me what to do next.

Cover, in this order and nothing else:
1. **What's working** — the recipes that scored well and what they have in common.
2. **What's off** — the clearest pattern behind the brews I rated low, tied to specific entries.
3. **Next three brews** — three concrete experiments, each a single named change with the exact new value, and what result would confirm it.

If I have fewer than five entries, say the log is still thin, then give the best read you can plus the fastest way to make it useful.`

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Sign in first.', { status: 401 })

  if (!process.env.OPENROUTER_API_KEY) {
    return new Response('OPENROUTER_API_KEY is missing. Add it in your Vercel project settings.', { status: 500 })
  }

  const { text, count } = await loadBrewContext()
  if (count === 0) {
    return new Response('Log a brew or two first — there is nothing to read yet.', { status: 400 })
  }

  try {
    const stream = await streamCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${text}\n\n---\n\n${ASK}` },
      ],
      { maxTokens: 1600 },
    )

    return new Response(stream, {
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
