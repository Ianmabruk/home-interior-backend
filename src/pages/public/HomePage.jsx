import { useState } from 'react'
import { Hero } from '../../components/Hero'
import { FeaturedProjects } from '../../components/FeaturedProjects'
import { AboutPreview } from '../../components/AboutPreview'
import { ConsultationModal } from '../../components/ConsultationModal'

export const HomePage = () => {
  const [showModal, setShowModal] = useState(false)

  return (
    <main>
      <Hero onBookConsultation={() => setShowModal(true)} />
      <FeaturedProjects />
      <AboutPreview />
      <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </main>
  )
}