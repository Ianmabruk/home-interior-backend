import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { MobileNav } from './MobileNav'

export const Layout = () => {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Navbar />
      <main className="pt-[88px] md:pt-[108px] pb-[72px] md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
