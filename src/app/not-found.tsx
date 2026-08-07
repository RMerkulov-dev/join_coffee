import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
      <h1 className="font-display text-[28px] font-bold uppercase tracking-[-0.01em]">Not here</h1>
      <p className="mt-2 text-[15px]" style={{ color: 'var(--muted)' }}>
        That brew doesn&apos;t exist, or it isn&apos;t yours.
      </p>
      <Link
        href="/"
        className="mx-auto mt-6 rounded-full px-5 py-3 text-[15px] font-medium"
        style={{ background: 'var(--balance)', color: 'var(--on-balance)' }}
      >
        Back to brews
      </Link>
    </div>
  )
}
