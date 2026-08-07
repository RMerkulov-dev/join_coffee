import { Fragment, type ReactNode } from 'react'

/**
 * A deliberately small Markdown renderer for model output: headings, bullets,
 * numbered lists, bold, italic and inline code. No raw HTML is ever emitted,
 * so nothing the model writes can inject markup.
 */
export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let list: { ordered: boolean; items: string[] } | null = null
  let key = 0

  const flush = () => {
    if (!list) return
    const items = list.items.map((item, i) => (
      <li key={i} className="pl-1">
        {inline(item)}
      </li>
    ))
    blocks.push(
      list.ordered ? (
        <ol key={key++} className="ml-5 list-decimal space-y-1.5 marker:text-[13px] marker:opacity-60">
          {items}
        </ol>
      ) : (
        <ul key={key++} className="ml-5 list-disc space-y-1.5 marker:opacity-40">
          {items}
        </ul>
      ),
    )
    list = null
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (!line.trim()) {
      flush()
      continue
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      flush()
      blocks.push(
        <h3 key={key++} className="eyebrow mt-4 first:mt-0">
          {inline(heading[2])}
        </h3>,
      )
      continue
    }

    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line)
    if (bullet) {
      if (!list || list.ordered) {
        flush()
        list = { ordered: false, items: [] }
      }
      list.items.push(bullet[1])
      continue
    }

    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line)
    if (numbered) {
      if (!list || !list.ordered) {
        flush()
        list = { ordered: true, items: [] }
      }
      list.items.push(numbered[1])
      continue
    }

    flush()
    blocks.push(
      <p key={key++} className="leading-relaxed">
        {inline(line)}
      </p>,
    )
  }
  flush()

  return <div className="space-y-2.5 text-[15px]">{blocks}</div>
}

/** Bold, italic and inline code inside a single line. */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|(?<![*\w])\*[^*]+\*(?!\w))/g)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="num rounded px-1 py-0.5 text-[13px]"
          style={{ background: 'var(--line-soft)' }}
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}
