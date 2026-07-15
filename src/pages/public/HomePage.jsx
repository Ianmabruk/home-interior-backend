import { useState } from 'react'
import { Navbar } from '../../components/Navbar'
import { Hero } from '../../components/Hero'
import { FeaturedProjects } from '../../components/FeaturedProjects'
import { Services } from '../../components/Services'
import { ShopCollection } from '../../components/ShopCollection'
import { AboutPreview } from '../../components/AboutPreview'
import { NewsletterForm } from '../../components/common/NewsletterForm'
import { Footer } from '../../components/Footer'
import { ConsultationModal } from '../../components/ConsultationModal'

export const HomePage = () => {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-primary-bg text-dark-luxury">
      <Navbar />
      <main>
        <Hero onBookConsultation={() => setShowModal(true)} />
        <FeaturedProjects />
        <Services />
        <ShopCollection />
        <AboutPreview />
        <NewsletterForm />
      </main>
      <Footer />
      <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
