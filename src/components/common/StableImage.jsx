import { useState } from 'react'

export function StableImage({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  ...props
}) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  if (!src || error) {
    return (
      <div className={`inline-flex items-center justify-center bg-[var(--secondary)]/20 text-[var(--primary)]/30 ${fallbackClassName || className}`}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        setError(true)
        setLoading(false)
      }}
      onLoad={() => setLoading(false)}
      style={loading ? { opacity: 0 } : { opacity: 1 }}
      {...props}
    />
  )
}
