import { Suspense } from 'react'
import { LoginForm } from '@/components/LoginForm'

export const metadata = { title: 'Sign in · Brew Log' }

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-9">
        <p className="eyebrow mb-3">Filter &amp; espresso</p>
        <h1 className="font-display text-[40px] leading-[0.95] font-bold tracking-[-0.02em] uppercase">
          Brew
          <br />
          Log
        </h1>
        <p className="mt-4 max-w-[30ch] text-[15px]" style={{ color: 'var(--muted)' }}>
          Write down what you did, then what it tasted like. The pattern shows up after a dozen cups.
        </p>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
