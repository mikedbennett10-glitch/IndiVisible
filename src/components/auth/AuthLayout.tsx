import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700 tracking-tight">
            Indivisible
          </h1>
          <p className="mt-2 text-warm-500 text-sm">
            Make it visible. Share the load.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg shadow-warm-200/50 p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
