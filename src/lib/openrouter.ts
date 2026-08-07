export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

export const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-5'

/** Turns an OpenRouter failure into something that names the fix. */
function describe(status: number, body: string): string {
  switch (status) {
    case 401:
      return `OpenRouter rejected the API key. Check OPENROUTER_API_KEY — a full key is 73 characters and starts with a single "sk-or-v1-". On Vercel, redeploy after changing it: env changes don't reach an existing deployment.`
    case 402:
      return 'OpenRouter is out of credit. Top up under Credits on openrouter.ai.'
    case 404:
      return `OpenRouter doesn't know the model "${MODEL}". Check OPENROUTER_MODEL against openrouter.ai/models.`
    case 429:
      return 'OpenRouter is rate limiting the key. Wait a moment and try again.'
    default:
      return `OpenRouter returned ${status}. ${body.slice(0, 300)}`
  }
}

function headers() {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('OPENROUTER_API_KEY is not set')
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
    'X-Title': process.env.OPENROUTER_SITE_NAME || 'Brew Log',
  }
}

/**
 * Calls OpenRouter and re-emits the response as a plain UTF-8 text stream, so
 * the browser can append chunks straight to the page without an SSE parser.
 */
export async function streamCompletion(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      max_tokens: opts.maxTokens ?? 1200,
      temperature: opts.temperature ?? 0.4,
    }),
  })

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '')
    throw new Error(describe(res.status, detail))
  }

  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  return res.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const raw of lines) {
          const line = raw.trim()
          // OpenRouter sends ": OPENROUTER PROCESSING" keep-alive comments.
          if (!line || line.startsWith(':')) continue
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (payload === '[DONE]') continue
          try {
            const json = JSON.parse(payload)
            const text = json.choices?.[0]?.delta?.content
            if (text) controller.enqueue(encoder.encode(text))
          } catch {
            // Partial JSON across chunk boundaries — the buffer picks it up next round.
          }
        }
      },
    }),
  )
}

/** Non-streaming call, for the one-shot insights summary. */
export async function completion(messages: ChatMessage[], maxTokens = 1500): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature: 0.4 }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(describe(res.status, detail))
  }
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}
