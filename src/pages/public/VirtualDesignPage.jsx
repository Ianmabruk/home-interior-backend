import { useState, useEffect, useCallback } from 'react'
import { api } from '@services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { EDesignPackages } from '@components/home/EDesignPackages'
import { SectionErrorBoundary } from '@components/home/SectionErrorBoundary'

const SkeletonVirtualDesign = () => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--secondary)]/20 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">E-Design Packages</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          E-Design Packages
        </h2>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="group">
            <div className="skeleton aspect-[4/3] w-full rounded-3xl" />
            <div className="mt-4 space-y-2">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-6 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

const EmptySection = () => (
  <div className="py-20 text-center text-[var(--primary)]/40">
    <p>No content available</p>
  </div>
)

export const VirtualDesignPage = () => {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDesigns = useCallback(async () => {
    setError(null)
    try {
      const res = await api.get('/virtual-design')
      setDesigns(res.data || [])
    } catch (err) {
      console.warn('[VIRTUAL DESIGN] Failed to load:', err?.message)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const retry = useCallback(() => {
    setLoading(true)
    loadDesigns()
  }, [loadDesigns])

  useEffect(() => {
    loadDesigns()
  }, [loadDesigns])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'virtual-changed') loadDesigns()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadDesigns])

  useEffect(() => {
    const handleOnline = () => {
      if (error) loadDesigns()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [error, loadDesigns])

  if (loading) {
    return <main><SkeletonVirtualDesign /></main>
  }

  if (error && designs.length === 0) {
    return (
      <main>
        <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--secondary)]/20 via-[var(--bg)] to-[var(--accent)]/5 px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide text-center">
            <p className="text-[var(--primary)]/60 mb-4">Unable to load designs. Please check your connection.</p>
            <button onClick={retry} className="btn-luxury-primary">Retry</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main>
         <PageMeta
          title="E-Design Packages — HOK Interior Designs"
          description="Browse our E-Design packages for renters and homeowners. Renter-friendly online interior design delivered in days with shopping lists and 3D renders."
        />

      {/* E-DESIGN PACKAGES */}
      <SectionErrorBoundary sectionName="EDesignPackages" fallback={<EmptySection />}>
        <EDesignPackages packages={designs} />
      </SectionErrorBoundary>
    </main>
  )
}

export default VirtualDesignPage