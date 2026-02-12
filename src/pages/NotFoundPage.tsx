import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-warm-50 dark:bg-warm-900 px-4">
      <p className="text-6xl font-bold text-warm-200 dark:text-warm-700">404</p>
      <h1 className="mt-2 text-xl font-semibold text-warm-800 dark:text-warm-200">
        Page not found
      </h1>
      <p className="mt-1 text-sm text-warm-500 dark:text-warm-400 text-center max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-warm-600 dark:text-warm-300 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Go back
        </button>
        <Link
          to="/"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors"
        >
          <Home size={16} />
          Home
        </Link>
      </div>
    </div>
  )
}
