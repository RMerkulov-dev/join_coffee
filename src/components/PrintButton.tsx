'use client'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border py-3 text-center text-[15px] font-medium"
    >
      Print
    </button>
  )
}
