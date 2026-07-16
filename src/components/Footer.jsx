import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SocialIcons } from './common/SocialIcons'
import { api } from '../services/api'
import { Instagram, Facebook, Youtube, Twitter } from 'lucide-react'

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

  const socialItems = [
    { key: 'instagram', icon: Instagram, label: 'Instagram' },
    { key: 'facebook', icon: Facebook, label: 'Facebook' },
    { key: 'youtube', icon: Youtube, label: 'YouTube' },
    { key: 'twitter', icon: Twitter, label: 'Twitter' },
  ]

  return (
    <footer className="bg-cream px-6 md:px-12 lg:px-20">
      <div className="container-wide py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <p className="font-['Playfair_Display'] text-3xl font-semibold tracking-wide text-espresso">HOK</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Interior Designs</p>
            </Link>
            <p className="text-sm text-brown/60 leading-relaxed">
              Creating elegant interiors that blend comfort, beauty, and functionality.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialItems.map((item) => {
                const Icon = item.icon
                const url = socials[item.key]
                return (
                  <a
                    key={item.key}
                    href={url || '#'}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={item.label}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      url
                        ? 'border-beige bg-cream text-espresso hover:bg-gold hover:border-gold hover:text-cream'
                        : 'border-beige/40 bg-cream/50 text-espresso/40 opacity-40 cursor-default'
                    }`}
                  >
                    <Icon size={16} />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold mb-6">Quick Links</h4>
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
                    className="text-sm text-espresso/60 transition-colors duration-300 hover:text-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold mb-6">Contact</h4>
            <ul className="space-y-3 text-sm text-brown/60">
              <li>{contact.email}</li>
              <li>{contact.phone}</li>
              <li>{contact.address}</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold mb-4">Newsletter</h4>
            <p className="text-sm text-brown/50 mb-4">Design Notes & Curated Inspiration</p>
            <p className="text-sm text-brown/40">
              Subscribe to receive design inspiration and exclusive collections.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-beige/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-brown/40">
            &copy; {new Date().getFullYear()} HOK Interior Designs. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-[11px] text-brown/40 hover:text-gold transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-[11px] text-brown/40 hover:text-gold transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}