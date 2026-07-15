import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Sparkles } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/about', label: 'About' },
  { to: '/virtual-interior-design', label: 'Virtual Interior Design' },
  { to: '/shop', label: 'Shop' },
  { to: '/portfolio', label: 'Portfolio' },
]

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-cream/95 backdrop-blur-md shadow-[0_1px_0_rgba(31,77,58,0.06)]'
          : 'bg-transparent'
      }`}
    >
      <div className="container-wide flex items-center justify-between px-6 md:px-12 lg:px-20">
        <Link to="/" className="flex-shrink-0 leading-tight group">
          <p className="font-['Playfair_Display'] text-2xl font-semibold tracking-wide text-charcoal md:text-3xl transition-colors duration-300 group-hover:text-forest">
            HOK
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bronze transition-colors duration-300 group-hover:text-bronzeDark">
            Interior Designs
          </p>
        </Link>

        <nav className="hidden items-center gap-8 md:flex lg:gap-10">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-300 hover:text-bronze text-charcoal/70"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/virtual-interior-design"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:bg-forestDark hover:shadow-[0_8px_30px_rgba(31,77,58,0.15)] hover:-translate-y-0.5"
            style={{ height: '48px' }}
          >
            <Sparkles size={14} strokeWidth={1.5} />
            Book Consultation
          </Link>
        </div>

        <button
          className="flex items-center justify-center p-2 text-charcoal md:hidden transition-colors duration-200 hover:text-bronze"
          onClick={() => setMobileOpen((p) => !p)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
        </button>
      </div>

      <div className={`fixed inset-0 z-40 bg-forest/30 backdrop-blur-sm transition-all duration-300 md:hidden ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileOpen(false)} />
      <div className={`fixed right-0 top-0 bottom-0 z-50 w-80 bg-cream shadow-2xl transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="font-['Playfair_Display'] text-xl font-semibold text-charcoal">HOK</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bronze">Interior Designs</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-2 text-charcoal hover:text-bronze transition-colors" aria-label="Close menu">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>
        <nav className="flex flex-col px-6 py-8 gap-6">
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className="text-lg font-['Playfair_Display'] font-medium text-charcoal hover:text-bronze transition-colors">
              {item.label}
            </Link>
          ))}
          <div className="mt-4 pt-4 border-t border-border">
            <Link to="/virtual-interior-design" onClick={() => setMobileOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-200 hover:bg-forestDark w-full" style={{ height: '48px' }}>
              <Sparkles size={14} strokeWidth={1.5} />
              Book Consultation
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
