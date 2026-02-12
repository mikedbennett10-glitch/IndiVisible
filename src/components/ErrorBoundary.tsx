import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-warm-50 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-danger-500" />
          </div>
          <h2 className="text-lg font-semibold text-warm-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-warm-500 max-w-xs mb-6">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
