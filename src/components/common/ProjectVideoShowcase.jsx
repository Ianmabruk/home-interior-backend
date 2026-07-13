import { useEffect, useMemo, useRef, useState } from 'react'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'
import PositionedImage from './PositionedImage'

const IMAGE_DURATION_MS = 6000
const MAX_PLAY_RETRIES = 8
const PLAY_RETRY_DELAYS = [100, 200, 400, 600, 800, 1000, 1200, 1500]

function resolveShowcaseItem(project) {
  if (!project) return null
  const mediaArr = Array.isArray(project.media) ? project.media : []
  const firstVideo = mediaArr.find((m) => m && m.type === 'video' && m.url)
  const firstMedia = mediaArr.find((m) => m && m.url)
  const url = project.videoUrl || firstVideo?.url || firstMedia?.url || project.coverImageUrl
  if (!url) return null
  const type = project.videoUrl || firstVideo ? 'video' : firstMedia?.type || 'image'
  return { type, url, mediaSettings: project.mediaSettings }
}

export default function ProjectVideoShowcase({ videos, className = '' }) {
  const list = useMemo(
    () => (videos || []).map(resolveShowcaseItem).filter(Boolean),
    [videos],
  )

  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(true)
  const [fadeKey, setFadeKey] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const playRetryRef = useRef(0)
  const playTimerRef = useRef(null)
  const lastLoadedUrlRef = useRef(null)
  const currentUrlRef = useRef(null)

  const safeIndex = list.length ? index % list.length : 0
  const current = list[safeIndex]
  const isVideo = current?.type === 'video'

  const clearPlayTimers = () => {
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current)
      playTimerRef.current = null
    }
    playRetryRef.current = 0
  }

  useEffect(() => {
    currentUrlRef.current = current?.url || null
  }, [current?.url])

  const attemptPlay = (v) => {
    if (!v || !v.paused) return
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current)
      playTimerRef.current = null
    }
    if (playRetryRef.current >= MAX_PLAY_RETRIES) {
      console.warn('[showcase] max play retries reached for', currentUrlRef.current)
      return
    }
    const attempt = playRetryRef.current
    playRetryRef.current += 1
    const timer = setTimeout(() => {
      const p = v.play()
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('[showcase] play attempt failed:', attempt, err?.message, currentUrlRef.current)
          if (attempt < MAX_PLAY_RETRIES - 1) {
            playTimerRef.current = setTimeout(() => attemptPlay(v), PLAY_RETRY_DELAYS[attempt] || 1000)
          }
        })
      }
    }, 0)
    playTimerRef.current = timer
  }

  const goNext = () => {
    if (isTransitioning || list.length <= 1) return
    setIsTransitioning(true)
    const nextIndex = (safeIndex + 1) % list.length
    console.log('[showcase] transitioning:', {
      current: { index: safeIndex, url: current?.url },
      next: { index: nextIndex, url: list[nextIndex]?.url },
    })
    setTimeout(() => {
      setIndex(nextIndex)
      setFadeKey((k) => k + 1)
      setIsTransitioning(false)
    }, 400)
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    clearPlayTimers()
    const v = videoRef.current
    if (!v || !isVideo || !current) return
    if (lastLoadedUrlRef.current === current.url) return
    lastLoadedUrlRef.current = current.url
    v.muted = true
    v.load()
    console.log('[showcase] video loaded:', current.url)
  }, [current, isVideo])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !isVideo || !current) return
    if (inView && !isTransitioning) {
      v.muted = true
      const wasPaused = v.paused
      attemptPlay(v)
      if (wasPaused) {
        console.log('[showcase] video started:', current.url)
      }
    } else {
      v.pause()
      clearPlayTimers()
    }
  }, [inView, current, isVideo, isTransitioning]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    clearPlayTimers()
    if (isVideo || !current || list.length < 2 || !inView) return undefined
    const t = setTimeout(goNext, IMAGE_DURATION_MS)
    return () => clearTimeout(t)
  }, [safeIndex, isVideo, inView, list.length, current]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null

  const nextItem = list.length > 1 ? list[(safeIndex + 1) % list.length] : null

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-black ${className || ''}`}
    >
      <div
        key={fadeKey}
        className="absolute inset-0 transition-opacity duration-400 ease-in-out"
        style={{ opacity: isTransitioning ? 0 : 1 }}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={getOptimizedVideoUrl(current.url, { width: 1280 })}
            poster={getVideoPosterUrl(current.url, { width: 1280 })}
            autoPlay
            muted
            loop={list.length === 1}
            playsInline
            preload="auto"
            fetchPriority="high"
            crossOrigin="anonymous"
            onEnded={() => {
              console.log('[showcase] video ended:', current.url)
              clearPlayTimers()
              goNext()
            }}
            onPlaying={() => {
              playRetryRef.current = 0
              console.log('[showcase] video playing:', current.url)
            }}
            onError={(e) => {
              console.warn('[showcase] video error:', current.url, e.currentTarget.error?.code, e.currentTarget.error?.message)
            }}
            onCanPlay={() => {
              if (inView && videoRef.current && !isTransitioning) {
                videoRef.current.muted = true
                attemptPlay(videoRef.current)
              }
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <PositionedImage
            src={current.url}
            alt=""
            settings={current.mediaSettings}
            className="h-full w-full"
            loading="eager"
          />
        )}
      </div>

      {nextItem && !isTransitioning && (
        <img
          src={nextItem.type === 'video' ? getVideoPosterUrl(nextItem.url, { width: 1280 }) : nextItem.url}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
        />
      )}

      {list.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/20 px-4 py-2 backdrop-blur-md">
          {list.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === safeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
