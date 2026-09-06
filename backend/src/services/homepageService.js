import { prisma, withTimeout } from '../config/database.js'
import { contactService } from './contactService.js'
import { circularTabService } from './circularTabService.js'

async function getHomepage() {
    const results = await Promise.allSettled([
      withTimeout(prisma.portfolioProject.findMany({
        where: { published: true },
        orderBy: { displayOrder: 'asc' },
        take: 12,
        select: { id: true, title: true, imageUrl: true, featured: true, beforeImages: true, afterImages: true, homepageCircularImage: true, homepageCircularImageId: true },
      })),
      withTimeout(prisma.virtualDesign.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, title: true, imageUrl: true, mediaUrls: true, featured: true, homepageCircularImage: true, homepageCircularImageId: true },
      })),
      withTimeout(prisma.service.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        take: 6,
        select: { id: true, title: true, imageUrl: true, homepageCircularImage: true, homepageCircularImageId: true },
      })),
      withTimeout(prisma.about.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          subtitle: true,
          description: true,
          story: true,
          mission: true,
          vision: true,
          experience: true,
          values: true,
          buttonText: true,
          buttonUrl: true,
          projectsCompleted: true,
          happyClients: true,
          yearsExperience: true,
          countriesServed: true,
          imageUrl: true,
          socialImage: true,
          homepageCircularImage: true,
          homepageCircularImageId: true,
        },
      })),
      withTimeout(prisma.aboutImage.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        select: { id: true, imageUrl: true, displayOrder: true, isActive: true },
      })),
      withTimeout(prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        take: 10,
        select: { id: true, clientName: true, content: true, project: true, photoUrl: true, initial: true, homepageCircularImage: true, homepageCircularImageId: true },
      })),
      withTimeout(prisma.workWithUs.findMany({
        where: { type: 'content', isActive: true },
        orderBy: { displayOrder: 'asc' },
        take: 6,
        select: { id: true, title: true, description: true, imageUrl: true, mediaUrls: true, homepageCircularImage: true, homepageCircularImageId: true, displayOrder: true, isActive: true },
      })),
      withTimeout(prisma.heroMedia.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        take: 5,
        select: { id: true, title: true, subtitle: true, imageUrl: true, mediaUrls: true },
      })),
      withTimeout(prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, name: true, price: true, originalPrice: true, mainImage: true, images: true },
      })),
      withTimeout(prisma.siteSetting.findUnique({ where: { key: 'shopWithUsHomepageImage' } })),
      withTimeout(prisma.blog.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, title: true, image: true, video: true, description: true, category: true, homepageCircularImage: true, homepageCircularImageId: true },
      })),
      withTimeout(prisma.socialItem.findMany({
        orderBy: { displayOrder: 'asc' },
        select: { id: true, name: true, platform: true, imageUrl: true, link: true, isActive: true, homepageCircularImage: true },
      })),
      withTimeout(contactService.getContact()),
      circularTabService.getHomepageCircularTabs(),
    ])

    const allFailed = results.every((r) => r.status === 'rejected')
    if (allFailed) {
      const errors = results.map((r) => r.reason?.message || r.reason).filter(Boolean)
      console.error('[homepageService] All homepage queries failed:', errors)
      throw new Error('Database connection failed')
    }

    const getResult = (index, fallback) => {
      if (results[index]?.status === 'fulfilled') return results[index].value
      return fallback
    }

      const asArray = (val) => Array.isArray(val) ? val : []
      const portfolio = asArray(getResult(0, []))
      const virtualDesigns = asArray(getResult(1, []))
      const services = asArray(getResult(2, []))
      const about = getResult(3, null)
      const aboutImages = asArray(getResult(4, []))
      const testimonials = asArray(getResult(5, []))
      const workWithUs = asArray(getResult(6, []))
      const heroMedia = asArray(getResult(7, []))
      const featuredProducts = asArray(getResult(8, []))
      const shopWithUsImage = getResult(9, null)
      const blog = asArray(getResult(10, []))
      const socialItems = asArray(getResult(11, []))
      const contact = getResult(12, null)
      const circularTabs = getResult(13, {})

      const featuredPortfolio = portfolio.filter((p) => p.featured).slice(0, 3)

      const blogArray = Array.isArray(blog) ? blog : []

      const mappedBlog = blogArray.map((item) => ({
        ...item,
        imageUrl: item.image,
        mediaUrl: item.image,
        mediaUrls: item.video ? [item.video] : [],
        mediaType: item.video ? 'video' : 'image',
      }))

      const activeAboutImages = (aboutImages || []).filter((img) => img.isActive)

      const mappedWorkWithUs = (workWithUs || []).map((item) => ({
        ...item,
        imageUrl: item.imageUrl,
        mediaUrls: item.mediaUrls || [],
      }))

       return {
        portfolio,
        virtualDesigns,
        virtualInteriorDesign: virtualDesigns,
        services,
        about: about ? { ...about, aboutImages: activeAboutImages } : null,
        aboutImages: activeAboutImages,
        testimonials,
        featuredPortfolio,
        featuredVirtualDesigns: virtualDesigns.filter((v) => v.featured).slice(0, 3),
        heroImages: heroMedia,
        heroMedia,
        featuredProject: featuredPortfolio[0] || portfolio[0] || null,
        products: featuredProducts,
        blog: mappedBlog,
        socialItems: (socialItems || []).filter((item) => item.isActive),
        contact,
        workWithUs: mappedWorkWithUs,
        shopWithUsHomepageImage: shopWithUsImage?.value || null,
        circularTabs,
      }
}

export const homepageService = {
  getHomepage,
}
