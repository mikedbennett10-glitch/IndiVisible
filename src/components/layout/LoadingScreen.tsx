import { Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-warm-50">
      <h1 className="text-2xl font-bold text-primary-700 mb-4">Indivisible</h1>
      <Loader2 className="animate-spin text-primary-500" size={32} />
    </div>
  )
}
