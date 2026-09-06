import { useState, useMemo, memo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getOptimizedUrl, buildSrcSet } from '../../utils/cloudinaryHelpers'
import { useIsMobile } from '../../hooks/useIsMobile'

const CIRCLE_SIZE = 300

const NAV_ITEMS_MOBILE = [
  {
    key: 'portfolio',
    label: 'Portfolio',
    path: '/portfolio',
    circularKey: 'portfolio',
  },
  {
    key: 'services',
    label: 'Services',
    path: '/services',
    circularKey: 'services',
  },
  {
    key: 'virtualDesigns',
    label: 'Virtual Designs',
    path: '/virtual-design',
    circularKey: 'virtual_design',
  },
  {
    key: 'shop',
    label: 'Shop With Us',
    path: '/shop',
    circularKey: 'shop_with_us',
  },
  {
    key: 'blog',
    label: 'Blog',
    path: '/blog',
    circularKey: 'blog',
  },
  {
    key: 'about',
    label: 'About Us',
    path: '/about',
    circularKey: 'about_us',
  },
  {
    key: 'socials',
    label: 'Socials',
    path: '/socials',
    circularKey: 'socials',
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    path: '/testimonials',
    circularKey: 'testimonials',
  },
  {
    key: 'workWithUs',
    label: 'Work With Us',
    path: '/work-with-us',
    circularKey: 'work_with_us',
  },
]

const PlaceholderIcons = {
  portfolio: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  services: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 4 9 9 0 1 1-9-9Z" />
      <line x1="21" y1="9" x2="15.5" y2="14.5" />
      <line x1="15" y1="15" x2="14" y2="16" />
    </svg>
  ),
  virtualDesigns: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  shop: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 6H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" />
      <path d="M3 12h18" />
      <path d="M9 6v6" />
      <path d="M15 6v6" />
    </svg>
  ),
  about: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  socials: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  blog: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2h10" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="13" y2="11" />
    </svg>
  ),
  workWithUs: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  testimonials: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
}

const CircleItemMobile = memo(({ item, data, reduceMotion }) => {
  const imageUrl = useMemo(() => {
    const circularTabs = data.circularTabs || {}
    const tab = circularTabs[item.circularKey]
    return tab?.imageUrl || null
  }, [item.circularKey, data.circularTabs])
  const [hasError, setHasError] = useState(false)
  const placeholder = PlaceholderIcons[item.key]

  return (
    <section className="bg-[var(--bg)] px-6 py-12">
      <div className="container-wide">
        <Link
          to={item.path}
          className="relative flex flex-col items-center group focus:outline-none w-full"
          aria-label={`${item.label} — tap to explore`}
        >
           <motion.div
             className="relative rounded-full overflow-hidden"
             style={{
               width: CIRCLE_SIZE,
               height: CIRCLE_SIZE,
               boxShadow: '0 8px 25px rgba(42,36,31,0.1)',
               border: '2px solid #E89A43',
               background: '#F5EFE8',
               animation: !reduceMotion ? 'float 6s ease-in-out infinite' : 'none',
             }}
             whileHover={reduceMotion ? {} : { scale: 1.03, y: -4 }}
             transition={reduceMotion ? { duration: 0.3 } : { type: 'spring', stiffness: 300, damping: 20 }}
           >
            {imageUrl && !hasError ? (
              <img
                src={getOptimizedUrl(imageUrl, { width: 600, crop: 'limit' })}
                srcSet={buildSrcSet(imageUrl) || undefined}
                sizes={buildSrcSet(imageUrl) ? '(max-width: 768px) 80vw, 300px' : undefined}
                alt={item.label}
                className="h-full w-full object-cover"
                loading={item.key === 'portfolio' ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={item.key === 'portfolio' ? 'high' : undefined}
                width={CIRCLE_SIZE}
                height={CIRCLE_SIZE}
                onError={() => setHasError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--primary)]/20">
                {placeholder}
              </div>
            )}
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 30px rgba(232,154,67,0.15)',
              }}
            />
          </motion.div>

          <div
            className="mt-6 w-full max-w-xs px-4"
            style={{ zIndex: 10 }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = item.path
              }}
              className="block w-full py-3 px-6 bg-[#E89A43] text-white text-base font-semibold uppercase tracking-wide rounded-full text-center whitespace-nowrap shadow-[0_4px_16px_rgba(232,154,67,0.4)] hover:shadow-[0_8px_24px_rgba(232,154,67,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              aria-label={`View ${item.label}`}
            >
              {item.label}
            </button>
          </div>
        </Link>
      </div>
    </section>
  )
})

CircleItemMobile.displayName = 'CircleItemMobile'

export const MobileCircularNavigation = memo(({ circularTabs = {} }) => {
  const data = useMemo(() => ({
    circularTabs,
  }), [circularTabs])
  const reduceMotion = useIsMobile()

  return (
    <div className="md:hidden">
      {NAV_ITEMS_MOBILE.map((item) => (
        <CircleItemMobile key={item.key} item={item} data={data} reduceMotion={reduceMotion} />
      ))}
    </div>
  )
})

MobileCircularNavigation.displayName = 'MobileCircularNavigation'

export default MobileCircularNavigation