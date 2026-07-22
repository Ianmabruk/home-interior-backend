import { prisma } from '../config/database.js'

export const homepageService = {
  getHomepage,
}

async function getHomepage() {
  const [
    portfolio,
    virtualDesigns,
    services,
    about,
    testimonials,
    heroMedia,
  ] = await Promise.all([
    prisma.portfolioProject.findMany({
      where: { published: true },
      orderBy: { displayOrder: 'asc' },
      take: 6,
    }),
    prisma.virtualDesign.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      take: 6,
    }),
    prisma.about.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      take: 10,
    }),
    prisma.heroMedia.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      take: 5,
    }),
  ])

  const featuredPortfolio = portfolio.filter((p) => p.featured).slice(0, 3)

  return {
    portfolio,
    virtualDesigns,
    virtualInteriorDesign: virtualDesigns,
    services,
    about,
    testimonials,
    featuredPortfolio,
    featuredVirtualDesigns: virtualDesigns.filter((v) => v.featured).slice(0, 3),
    heroImages: heroMedia,
    heroMedia,
    featuredProject: featuredPortfolio[0] || portfolio[0] || null,
  }
}
