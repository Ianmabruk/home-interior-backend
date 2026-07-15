import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SocialIcons } from './common/SocialIcons'
import { api } from '../services/api'

export const Footer = () => {
  const [socials, setSocials] = useState({})
  const [contact, setContact] = useState({})

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/about')
        setSocials(res.data?.socials || {})
        setContact({
          email: res.data?.contactEmail || 'info@hokinterior.com',
          phone: res.data?.phone || '+254 712 345 678',
          address: res.data?.location || 'Nairobi, Kenya',
        })
      } catch {
        setContact({
          email: 'info@hokinterior.com',
          phone: '+254 712 345 678',
          address: 'Nairobi, Kenya',
        })
      }
    }
    load()
  }, [])

  return (
    <footer className="bg-charcoal px-6 md:px-12 lg:px-20">
      <div className="container-wide py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <p className="font-['Playfair_Display'] text-3xl font-semibold tracking-wide text-white">HOK</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bronze">Interior Designs</p>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed">
              Creating elegant interiors that blend comfort, beauty, and functionality.
            </p>
            <div className="mt-6">
              <SocialIcons socials={socials} dark />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-bronze mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { to: '/about', label: 'About' },
                { to: '/portfolio', label: 'Portfolio' },
                { to: '/shop', label: 'Shop' },
                { to: '/virtual-interior-design', label: 'Virtual Interior Design' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-white/60 transition-colors duration-300 hover:text-bronze"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-bronze mb-6">Contact</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>{contact.email}</li>
              <li>{contact.phone}</li>
              <li>{contact.address}</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-bronze mb-4">Newsletter</h4>
            <p className="text-sm text-white/50 mb-4">Design Notes & Curated Inspiration</p>
            <p className="text-sm text-white/40">
              Subscribe to receive design inspiration and exclusive collections.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/30">
            &copy; {new Date().getFullYear()} HOK Interior Designs. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
