import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <p className="font-display text-2xl text-ink">Something went wrong</p>
          <p className="mt-2 text-sm text-ink/60">{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6 rounded-full bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-charcoal"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
