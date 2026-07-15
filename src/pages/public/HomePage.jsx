import { useState } from 'react'
import { Hero } from '../../components/Hero'
import { FeaturedProjects } from '../../components/FeaturedProjects'
import { Services } from '../../components/Services'
import { AboutPreview } from '../../components/AboutPreview'
import { NewsletterForm } from '../../components/common/NewsletterForm'
import { ConsultationModal } from '../../components/ConsultationModal'

export const HomePage = () => {
  const [showModal, setShowModal] = useState(false)

  return (
    <main>
      <Hero onBookConsultation={() => setShowModal(true)} />
      <FeaturedProjects />
      <Services />
      <AboutPreview />
      <NewsletterForm />
      <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </main>
  )
}