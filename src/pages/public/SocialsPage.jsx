import { useState, useEffect, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { SiInstagram, SiFacebook, SiTiktok, SiPinterest, SiYoutube, SiWhatsapp, SiX, SiGlobus } from 'react-icons/si'
import { SOCIAL_LINKS } from '@constants/socialLinks'

const platformIconMap = {
  instagram: SiInstagram,
  facebook: SiFacebook,
  tiktok: SiTiktok,
  pinterest: SiPinterest,
  youtube: SiYoutube,
  whatsapp: SiWhatsapp,
  x: SiX,
  custom: SiGlobus,
}

const SkeletonSocials = () => (
  <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 md:px-12 lg:px-20 py-20 md:py-32">
    <div className="container-wide">
      <div className="mb-16 md:mb-24 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Socials</p>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
          Follow Our Journey
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group flex flex-col items-center"
          >
            <div className="relative w-full max-w-sm mx-auto mb-6">
              <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30 skeleton aspect-square" />
            </div>
            <div className="skeleton h-6 w-3/4 mb-2" />
            <div className="skeleton h-10 w-full" />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

export const SocialsPage = memo(() => {
  const [socialItems, setSocialItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadSocials = useCallback(async () => {
    setError(null)
    try {
      const res = await api.get('/socials')
      setSocialItems(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.warn('[SOCIALS] Failed to load:', err?.message)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const retry = useCallback(() => {
    setLoading(true)
    loadSocials()
  }, [loadSocials])

  useEffect(() => {
    loadSocials()
  }, [loadSocials])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'socials-changed') loadSocials()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadSocials])

  useEffect(() => {
    const handleOnline = () => {
      if (error) loadSocials()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [error, loadSocials])

  const activeItems = socialItems.filter((item) => item.isActive !== false && item.link && item.link.trim() !== '')

  const displayItems = activeItems.length > 0 ? activeItems : SOCIAL_LINKS.map((link, index) => ({
    id: `default-${index}`,
    name: link.name,
    platform: link.platform,
    link: link.link,
    imageUrl: null,
    isActive: true,
  }))

  if (loading) {
    return <main><SkeletonSocials /></main>
  }

  if (error && socialItems.length === 0) {
    return (
      <main>
        <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-[var(--bg)]" />
          <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 text-center">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight">Socials</h1>
            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto">Unable to load social links. Please check your connection.</p>
            <button onClick={retry} className="mt-6 btn-luxury-primary">Retry</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title="Socials — HOK Interior Designs"
        description="Follow HOK Interior Designs on social media."
      />
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-[var(--bg)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight"
          >
            Socials
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          >
            Stay inspired with our latest projects, design tips, and behind-the-scenes moments from the HOK Interiors studio.
          </motion.p>
        </div>
      </section>

      <section className="bg-[var(--bg)]/40 bg-gradient-to-b from-[var(--primary)]/5 via-[var(--bg)] to-[var(--secondary)]/20 px-6 md:px-12 lg:px-20 py-20 md:py-32">
        <div className="container-wide">
          <div className="mb-16 md:mb-24 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Socials</p>
            <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
              Follow Our Journey
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[var(--primary)]/60 leading-relaxed">
              Stay inspired with our latest projects, design tips, and behind-the-scenes moments.
            </p>
          </div>

          {displayItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[var(--primary)]/30 text-lg">No social links configured yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
              {displayItems.map((platform, index) => (
                <motion.div
                  key={platform.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex flex-col items-center"
                >
                  <div className="relative w-full max-w-sm mx-auto mb-6">
                    <div className="relative rounded-full overflow-hidden bg-[var(--secondary)]/30">
                      {platform.imageUrl ? (
                        <img
                          src={getOptimizedUrl(platform.imageUrl, { width: 400, crop: 'limit' })}
                          alt={platform.name}
                          className="h-[320px] w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="h-[320px] w-full flex items-center justify-center bg-[var(--secondary)]/30">
                          {(() => {
                            const Icon = platformIconMap[(platform.platform || '').toLowerCase()] || SiGlobus
                            return <Icon size={64} className="text-[var(--primary)]/20" />
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <h3 className="font-display text-xl font-medium text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors">
                      {platform.name}
                    </h3>
                  </div>
                  <div className="w-full max-w-xs">
                    <a
                      href={platform.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-4 bg-[var(--primary)] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(42,36,31,0.2)] hover:bg-[var(--primary)]/90 hover:shadow-[0_8px_24px_rgba(42,36,31,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                      Give Us a Follow
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
})

SocialsPage.displayName = 'SocialsPage'

export default SocialsPage
