import { Component } from 'react'
import { Link } from 'react-router-dom'
import { Home, RefreshCw, AlertTriangle } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4 bg-primary-bg text-charcoal">
          <div className="text-center max-w-md">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-error/10 text-error">
              <AlertTriangle size={32} strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-3xl font-semibold text-charcoal mb-3">Something went wrong</h1>
            <p className="text-sm text-stone mb-6">
              We encountered an unexpected error. Our team has been notified.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="group inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:bg-forestDark hover:shadow-[0_8px_30px_rgba(31,77,58,0.15)] hover:-translate-y-0.5"
              >
                <RefreshCw size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:rotate-12" />
                Try Again
              </button>
              <Link
                to="/"
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal transition-all duration-300 hover:border-bronze hover:text-bronze"
              >
                <Home size={14} strokeWidth={1.5} />
                Go Home
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left p-4 bg-white/50 rounded-xl border border-border">
                <summary className="font-medium text-sm text-charcoal cursor-pointer">Error Details</summary>
                <pre className="mt-3 text-[10px] text-error overflow-auto max-h-64">{this.state.error?.toString()}</pre>
                {this.state.errorInfo && (
                  <pre className="mt-3 text-[10px] text-stone overflow-auto max-h-64">{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
