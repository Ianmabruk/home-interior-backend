import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// Lazily loads and autoplays a video only once it scrolls into (or near) the
// viewport, and pauses it when it leaves — so below-the-fold videos never
// download or decode until needed and don't burn CPU/battery on mobile.
//
// The poster always renders (even before the video loads), so there is no
// layout shift and the first frame paints instantly. Pass `eager` to keep the
// original above-the-fold behaviour (hero video plays immediately).
export default function LazyVideo({
  src,
  poster,
  className = '',
  eager = false,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  controls = false,
}) {
  const videoRef = useRef(null)
  const [active, setActive] = useState(eager)
  const reducedMotion = useReducedMotion()
  const shouldAutoPlay = autoPlay && !reducedMotion

  // Load (set src + autoplay) as soon as the element is near the viewport.
  useEffect(() => {
    if (eager) return undefined
    const el = videoRef.current
    if (!el) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [eager])

  // Pause when scrolled out of view to free the decoder (CPU/memory on mobile).
  useEffect(() => {
    if (eager || !shouldAutoPlay) return undefined
    const el = videoRef.current
    if (!el) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const p = el.play()
          if (p && typeof p.catch === 'function') p.catch(() => {})
        } else {
          el.pause()
        }
      },
      { rootMargin: '150px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [eager, shouldAutoPlay])

  const showVideo = eager || active

  return (
    <video
      ref={videoRef}
      poster={poster}
      className={className}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      controls={controls}
      preload={showVideo ? 'metadata' : 'none'}
      src={showVideo ? src : undefined}
      autoPlay={showVideo && shouldAutoPlay}
    />
  )
}
