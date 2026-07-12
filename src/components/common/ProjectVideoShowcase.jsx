import { useEffect, useRef, useState } from 'react'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'

// Auto-advancing, infinitely looping showcase of project videos.
//  - Only the active video downloads/decodes; the next video's poster is
//    preloaded underneath so switching is instant with NO black flash.
//  - Pauses when scrolled out of view (IntersectionObserver) to save CPU on
//    mobile, and resumes when it returns.
//  - Poster shows immediately on switch, so there is never a blank frame.
//  - No text/buttons/overlays — video only (per design).
export default function ProjectVideoShowcase({ videos, className = '' }) {
  const list = (videos || []).filter((v) => v && v.url)
  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(true)
  const videoRef = useRef(null)
  const current = list[index]

  // Pause decoding work when the section is offscreen.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return undefined
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // (Re)load whenever the active video changes.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !current) return
    v.load()
  }, [current])

  // Play/pause on visibility change.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !current) return
    if (inView) {
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } else {
      v.pause()
    }
  }, [inView, current])

  if (!current) return null

  const goNext = () => setIndex((i) => (i + 1) % list.length)

  return (
    <div className={`relative overflow-hidden bg-linen ${className}`}>
      <video
        ref={videoRef}
        src={getOptimizedVideoUrl(current.url, { width: 1280 })}
        poster={getVideoPosterUrl(current.url, { width: 1280 })}
        autoPlay
        muted
        loop={false}
        playsInline
        preload="metadata"
        fetchPriority="high"
        onEnded={goNext}
        onCanPlay={() => {
          if (inView) {
            videoRef.current?.play().catch(() => {})
          }
        }}
        className="h-full w-full object-cover"
      />

      {/* Preload the next video's poster so the transition is seamless. */}
      {list.length > 1 && (
        <img
          src={getVideoPosterUrl(list[(index + 1) % list.length].url, { width: 1280 })}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
        />
      )}

      {/* Progress dots (no text) */}
      {list.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {list.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full bg-white transition-all duration-300 ${
                i === index ? 'w-6' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
