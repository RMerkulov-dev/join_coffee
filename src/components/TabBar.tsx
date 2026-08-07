'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Brews', icon: IconList },
  { href: '/insights', label: 'Insights', icon: IconInsights },
  { href: '/new', label: 'Log', icon: IconPlus, primary: true },
  { href: '/chat', label: 'Ask', icon: IconChat },
  { href: '/export', label: 'Export', icon: IconExport },
]

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur"
      style={{
        background: 'color-mix(in srgb, var(--paper) 88%, transparent)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map(({ href, label, icon: Icon, primary }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className="flex h-[68px] flex-col items-center justify-center gap-1"
                style={{ color: active ? 'var(--ink)' : 'var(--muted)' }}
              >
                <span
                  className="flex h-8 w-10 items-center justify-center rounded-full transition-colors"
                  style={
                    primary
                      ? { background: 'var(--balance)', color: 'var(--on-balance)' }
                      : { background: active ? 'var(--line-soft)' : 'transparent' }
                  }
                >
                  <Icon />
                </span>
                <span className="eyebrow" style={{ color: 'inherit', fontSize: 10 }}>
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const svg = {
  width: 19,
  height: 19,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function IconList() {
  return (
    <svg {...svg}>
      <path d="M4 7h16M4 12h16M4 17h9" />
    </svg>
  )
}

function IconInsights() {
  return (
    <svg {...svg}>
      <path d="M4 19V5M4 19h16M8 16v-4M13 16V8M18 16v-6" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg {...svg} strokeWidth={2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg {...svg}>
      <path d="M20 12a8 8 0 1 1-3.2-6.4M20 12v0" />
      <path d="M4.5 18.5 4 21l2.8-.9" />
    </svg>
  )
}

function IconExport() {
  return (
    <svg {...svg}>
      <path d="M12 15V3m0 0L8 7m4-4 4 4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  )
}
