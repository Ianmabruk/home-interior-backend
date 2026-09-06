import { useState, useEffect, useCallback, memo, Suspense, lazy, useRef } from 'react'
import { Link } from 'react-router-dom'
import { HeroSection } from '@components/home/HeroSection'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'
import { api, clearApiCache } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'

const CircularNavigationGrid = lazy(() => import('@components/home/CircularNavigationGrid'))
const MobileCircularNavigation = lazy(() => import('@components/home/MobileCircularNavigation'))

const SkeletonHero = memo(() => (
  <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[var(--primary)]" role="region" aria-label="Hero image">
    <div className="absolute inset-0 bg-[var(--primary)]" />
  </section>
))

SkeletonHero.displayName = 'SkeletonHero'

const EmptySection = memo(() => (
  <div className="py-20 text-center text-[var(--primary)]/40">
    <p>No content available</p>
  </div>
))

EmptySection.displayName = 'EmptySection'

export const HomePage = memo(() => {
    const [heroImages, setHeroImages] = useState([])
    const [circularTabs, setCircularTabs] = useState({})
    const [error, setError] = useState(null)
    const retryCountRef = useRef(0)
    const hasLoadedData = useRef(false)

  const loadData = useCallback(async (signal) => {
    setError(null)
    try {
      const [homeRes, circularRes] = await Promise.allSettled([
        api.get('/homepage', { signal }),
        api.get('/circular-tabs', { signal }),
      ])

      if (homeRes.status === 'fulfilled') {
        const data = homeRes.value.data || {}
        const homeHeroImages = data.heroImages || data.heroMedia || []
        if (Array.isArray(homeHeroImages) && homeHeroImages.length > 0) {
          setHeroImages(homeHeroImages)
          hasLoadedData.current = true
        } else {
          const heroRes2 = await api.get('/hero-media', { signal })
          const heroData = heroRes2.data
          const heroList = Array.isArray(heroData) ? heroData : []
          setHeroImages(heroList)
          if (heroList.length > 0) hasLoadedData.current = true
        }
      } else {
        const heroRes2 = await api.get('/hero-media', { signal })
        const heroData = heroRes2.data
        const heroList = Array.isArray(heroData) ? heroData : (heroData || [])
        setHeroImages(heroList)
        if (heroList.length > 0) hasLoadedData.current = true
      }

      if (circularRes.status === 'fulfilled') {
        setCircularTabs(circularRes.value.data || {})
        hasLoadedData.current = true
      }
    } catch (err) {
      if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
        console.warn('[HOME] Failed to load data:', err?.message)
        setError(err)
      }
    }
  }, [])

  const retry = useCallback(() => {
    retryCountRef.current += 1
    setError(null)
    const controller = new AbortController()
    loadData(controller.signal)
  }, [loadData])

  useEffect(() => {
    const controller = new AbortController()
    loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (
        payload?.type === 'hero-images-changed' ||
        payload?.type === 'settings-changed' ||
        payload?.type === 'circular-tabs-changed'
      ) {
        clearApiCache('/homepage')
        clearApiCache('/circular-tabs')
        const controller = new AbortController()
        loadData(controller.signal)
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadData])

  useEffect(() => {
    const handleOnline = () => {
      if (error) {
        const controller = new AbortController()
        loadData(controller.signal)
      }
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [error, loadData])

  return (
    <main>
      <PageMeta
        title="HOK INTERIOR DESIGNS — Timeless Interiors, Designed for a Life Well Lived"
        description="Luxury interior design, curated furniture, and premium e-design packages."
        image={heroImages?.[0]?.imageUrl || heroImages?.[0]?.url || undefined}
      />

      {error && !hasLoadedData.current && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <p className="text-[var(--primary)]/60 mb-4">Unable to load content. Please check your connection.</p>
          <button onClick={retry} className="btn-luxury-primary">Retry</button>
        </div>
      )}

      {/* HERO - Full Width */}
      <SectionErrorBoundary sectionName="Hero" fallback={<SkeletonHero />}>
        <HeroSection heroImages={heroImages} className="w-full" />
      </SectionErrorBoundary>

       {/* CIRCULAR NAVIGATION */}
       <SectionErrorBoundary sectionName="CircularNavigation" fallback={<EmptySection />}>
          <Suspense fallback={<EmptySection />}>
            <CircularNavigationGrid circularTabs={circularTabs} />
          </Suspense>
        </SectionErrorBoundary>

        {/* MOBILE CIRCULAR NAVIGATION */}
        <SectionErrorBoundary sectionName="MobileCircularNavigation" fallback={<EmptySection />}>
          <Suspense fallback={<EmptySection />}>
            <MobileCircularNavigation circularTabs={circularTabs} />
          </Suspense>
        </SectionErrorBoundary>

      {/* INTERNAL LINKS */}
      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-12">
        <div className="container-wide">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/portfolio" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Portfolio</Link>
            <Link to="/services" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Services</Link>
            <Link to="/shop" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Shop</Link>
            <Link to="/blog" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Blog</Link>
            <Link to="/virtual-design" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">E-Design Packages</Link>
            <Link to="/about" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">About</Link>
            <Link to="/signup" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Sign Up</Link>
            <Link to="/login" className="text-[var(--primary)]/60 hover:text-[var(--accent)] transition-colors">Login</Link>
          </div>
        </div>
      </section>
    </main>
  )
})

HomePage.displayName = 'HomePage'

export default HomePage
