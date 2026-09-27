import bcrypt from 'bcryptjs'
import { prisma } from '../config/database.js'
import { env } from '../config/env.js'

// ---------------------------------------------------------------------------
// SAFETY GUARD
// The Render build command runs `npm run seed` on every deploy. Run unguarded
// against an empty production database, this script inserts default content
// (services, testimonials, hero, circular tabs, virtual designs) and creates an
// admin account with the fallback password `admin123` — which would make a
// failed or partial database import look like a working site full of
// placeholder data.
//
// Seeding is therefore opt-in. To seed deliberately:
//   ALLOW_PRODUCTION_SEED=true npm run seed
// or locally:
//   npm run seed:unsafe
// ---------------------------------------------------------------------------
if (process.env.ALLOW_PRODUCTION_SEED !== 'true' && env?.nodeEnv === 'production') {
  console.warn(
    '[seed] SKIPPED: seeding is disabled in production because it would insert ' +
    'placeholder content over real data. Set ALLOW_PRODUCTION_SEED=true to override.',
  )
  process.exit(0)
}

import { CIRCULAR_TAB_DEFINITIONS } from '../constants/circularTabs.js'

async function seed() {
  let critical = true
  try {
    await prisma.$connect()
  } catch (err) {
    console.error('Seeding: database connection failed:', err?.message || err)
    process.exit(1)
  }

  const forceSeed = process.env.FORCE_SEED === 'true'
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction && !forceSeed) {
    console.log('Seeding: skipped in production (set FORCE_SEED=true to override)')
    console.log('Seeding complete')
    await prisma.$disconnect()
    return
  }

  try {
    const existingAdmin = await prisma.admin.findFirst()
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(env.seedAdminPassword || 'admin123', 12)
      await prisma.admin.create({
        data: {
          email: env.seedAdminEmail || 'info@hokinteriors.co.ke',
          passwordHash,
          fullName: 'Admin',
          role: 'ADMIN',
        },
      })
      console.log('Default admin created')
    } else {
      console.log('Default admin already exists — skipping admin seed to preserve existing credentials')
    }
  } catch (err) {
    console.error('Seeding: admin seed failed:', err?.message || err)
    critical = false
  }

  try {
    const settingsToSeed = [
      { key: 'siteName', value: 'HOK Interiors' },
      { key: 'supportEmail', value: 'info@hokinteriors.co.ke' },
      { key: 'currency', value: 'USD' },
      { key: 'maintenanceMode', value: 'false' },
      { key: 'shippingPolicy', value: '' },
      { key: 'returnPolicy', value: '' },
      { key: 'socialLinks', value: '' },
    ]

    for (const s of settingsToSeed) {
      const existing = await prisma.siteSetting.findUnique({ where: { key: s.key } })
      if (!existing) {
        await prisma.siteSetting.create({ data: s })
      }
    }
    console.log('Default settings created')
  } catch (err) {
    console.warn('Seeding: settings seed skipped:', err?.message || err)
  }

  try {
    const serviceCount = await prisma.service.count()
    if (serviceCount === 0) {
      await prisma.service.createMany({
        data: [
          { title: 'Interior Design', description: 'Full-service interior design tailored to your lifestyle.', icon: 'LayoutGrid', displayOrder: 0 },
          { title: 'Virtual Consultation', description: 'Online design consultations from anywhere in the world.', icon: 'MonitorSmartphone', displayOrder: 1 },
          { title: 'Furniture Curation', description: 'Handpicked furniture and decor for timeless elegance.', icon: 'Armchair', displayOrder: 2 },
        ],
      })
      console.log('Default services created')
    }
  } catch (err) {
    console.warn('Seeding: services seed skipped:', err?.message || err)
  }

  try {
    const testimonialCount = await prisma.testimonial.count()
    if (testimonialCount === 0) {
      await prisma.testimonial.createMany({
        data: [
          { clientName: 'Sarah Mitchell', content: 'HOK transformed our home into a sanctuary. Absolutely stunning work!', displayOrder: 0 },
          { clientName: 'James Chen', content: 'Professional, creative, and detail-oriented. Highly recommend their virtual design service.', displayOrder: 1 },
          { clientName: 'Elena Rodriguez', content: 'The team understood our vision perfectly and brought it to life beyond expectations.', displayOrder: 2 },
        ],
      })
      console.log('Default testimonials created')
    }
  } catch (err) {
    console.warn('Seeding: testimonials seed skipped:', err?.message || err)
  }

  try {
    const heroCount = await prisma.heroMedia.count()
    if (heroCount === 0) {
      await prisma.heroMedia.create({
        data: {
          title: 'Luxury Interior Design',
          subtitle: 'Crafting spaces that inspire',
          isActive: true,
          displayOrder: 0,
        },
      })
      console.log('Default hero media created')
    }
  } catch (err) {
    console.warn('Seeding: hero media seed skipped:', err?.message || err)
  }

  try {
    for (const tab of CIRCULAR_TAB_DEFINITIONS) {
      const existing = await prisma.circularTab.findUnique({ where: { key: tab.key } })
      if (!existing) {
        await prisma.circularTab.create({ data: tab })
      }
    }
    console.log('Default circular tabs created')
  } catch (err) {
    console.warn('Seeding: circular tabs seed skipped:', err?.message || err)
  }

  try {
    const packageCount = await prisma.virtualDesign.count()
    if (packageCount === 0) {
      await prisma.virtualDesign.createMany({
        data: [
          {
            title: 'One-Bedroom Design',
            description: 'A complete design package for your one-bedroom space. Includes personalized concept, furniture layout, and shopping list.',
            tagline: 'Perfect for your one-bedroom space',
            category: 'E-Design',
            price: 15000,
            priceMax: 20000,
            currency: 'KES',
            features: [
              'Personalized design concept',
              '2D furniture layout',
              'Shopping plan',
              'Furniture and decor recommendations',
              'Digital design package',
              'One revision',
            ],
            ctaText: 'View Package',
            packageType: 'one-bedroom',
            displayOrder: 0,
            published: true,
            featured: true,
            mediaType: 'image',
          },
          {
            title: 'Budget-Friendly Packages',
            description: 'Affordable design solutions that maximize your budget. Get a stylish space without breaking the bank.',
            tagline: 'Style on a budget',
            category: 'E-Design',
            price: 10000,
            priceMax: 15000,
            currency: 'KES',
            features: [
              'Budget-focused design concept',
              'Smart shopping plan',
              'Affordable furniture recommendations',
              'DIY-friendly decor tips',
              'Digital design package',
              'One revision',
            ],
            ctaText: 'View Package',
            packageType: 'budget-friendly',
            displayOrder: 1,
            published: true,
            featured: false,
            mediaType: 'image',
          },
          {
            title: 'Master Bedroom',
            description: 'A luxurious master bedroom design package. Create a serene retreat with personalized styling and premium recommendations.',
            tagline: 'Your serene retreat',
            category: 'E-Design',
            price: 20000,
            priceMax: 28000,
            currency: 'KES',
            features: [
              'Personalized master bedroom concept',
              'Premium furniture recommendations',
              'Lighting and decor plan',
              'Color palette and materials',
              '3D visualization',
              'Two revisions',
            ],
            ctaText: 'View Package',
            packageType: 'master-bedroom',
            displayOrder: 2,
            published: true,
            featured: false,
            mediaType: 'image',
          },
        ],
      })
      console.log('Default e-design packages created')
    }
  } catch (err) {
    console.warn('Seeding: e-design packages seed skipped:', err?.message || err)
  }

  console.log('Seeding complete')
  await prisma.$disconnect()
  if (!critical) process.exit(1)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
