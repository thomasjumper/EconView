import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  name?: string // for logging which boundary caught the error
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
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex items-center justify-center p-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-w-xs">
            <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider mb-1">
              {this.props.name || 'Component'} Error
            </div>
            <div className="text-[9px] font-mono text-red-300/60">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-2 text-[9px] font-mono text-red-400 hover:text-red-300 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
