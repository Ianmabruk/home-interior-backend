export const productsSeed = [
  {
    name: 'Orion Linen Sofa',
    description: 'A tailored deep-seat sofa in premium linen with kiln-dried hardwood frame.',
    price: 2890,
    discountPrice: 2590,
    category: 'Living Room',
    stock: 12,
    sku: 'HOK-LIV-001',
    tags: ['sofa', 'linen', 'living'],
    colorVariants: [],
    colorVariants: [],
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-liv-001',
      },
    ],
  },
  {
    name: 'Solace Marble Dining Table',
    description: 'Natural marble top with sculptural oak base for a refined dining statement.',
    price: 3320,
    discountPrice: 2990,
    category: 'Dining',
    stock: 8,
    sku: 'HOK-DIN-002',
    tags: ['dining', 'marble', 'table'],
    colorVariants: [],
    colorVariants: [],
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1617104551722-3b2d5136647f?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-din-002',
      },
    ],
  },
  {
    name: 'Cove Accent Pendant',
    description: 'Hand-finished brass pendant with soft amber diffusion for ambient layering.',
    price: 490,
    category: 'Lighting',
    stock: 26,
    sku: 'HOK-LIG-003',
    tags: ['lighting', 'pendant'],
    colorVariants: [],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-lig-003',
      },
    ],
  },
  {
    name: 'Briar Bedroom Console',
    description: 'Solid walnut console with integrated cable routing for modern bedroom utility.',
    price: 1240,
    category: 'Bedroom',
    stock: 14,
    sku: 'HOK-BED-004',
    tags: ['bedroom', 'console', 'walnut'],
    colorVariants: [],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-bed-004',
      },
    ],
  },
  {
    name: 'Atelier Work Chair',
    description: 'Commercial-grade ergonomic office chair wrapped in textured boucle.',
    price: 760,
    category: 'Office',
    stock: 30,
    sku: 'HOK-OFF-005',
    tags: ['office', 'chair'],
    colorVariants: [],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-off-005',
      },
    ],
  },
  {
    name: 'Terrain Outdoor Lounge Set',
    description: 'Weather-resistant outdoor set with modular seating and performance fabric.',
    price: 4180,
    discountPrice: 3890,
    category: 'Outdoor',
    stock: 5,
    sku: 'HOK-OUT-006',
    tags: ['outdoor', 'lounge'],
    colorVariants: [],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-out-006',
      },
    ],
  },
]

export const projectsSeed = [
  {
    title: 'Belgravia Townhouse',
    description: 'A layered neutral renovation balancing contemporary flow and artisanal detail.',
    category: 'Residential',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80',
        publicId: 'seed/project-belgravia-image',
      },
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80',
    order: 1,
    isPublished: true,
  },
  {
    title: 'Monarch Penthouse',
    description: 'Soft monochrome interiors with sculptural lighting and gallery-worthy composition.',
    category: 'Residential',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
        publicId: 'seed/project-monarch-image',
      },
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
    order: 2,
    isPublished: true,
  },
]

export const portfolioSeed = [
  {
    title: 'Travertine Kitchen',
    category: 'Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80',
    imagePublicId: 'seed/portfolio-kitchen-1',
    order: 1,
    isPublished: true,
  },
  {
    title: 'Gallery Living Room',
    category: 'Living Room',
    imageUrl: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80',
    imagePublicId: 'seed/portfolio-living-1',
    order: 2,
    isPublished: true,
  },
  {
    title: 'Calm Suite',
    category: 'Bedroom',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    imagePublicId: 'seed/portfolio-bedroom-1',
    order: 3,
    isPublished: true,
  },
]

export const aboutSeed = {
  story:
    'Founded as a boutique interiors studio, HOK blends architectural discipline with tactile styling to craft spaces that feel deeply personal and quietly luxurious.',
  companyDescription:
    'HOK Interior Designs is a modern luxury interior studio creating deeply personal, timeless spaces through refined material palettes and practical elegance.',
  mission:
    'To transform every home into a sanctuary through intentional design and architectural clarity.',
  vision:
    'To become the most trusted digital-first premium interior design platform globally.',
  location: 'Nairobi, Kenya',
  contactEmail: 'info@hokinterior.com',
  aboutImageUrl:
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80',
  aboutImagePublicId: 'seed/about-hero',
  socials: {
    instagram: 'https://instagram.com/hokinterior',
    tiktok: 'https://tiktok.com/@hokinterior',
    pinterest: 'https://pinterest.com/hokinterior',
    facebook: 'https://facebook.com/hokinterior',
  },
}

export const virtualDesignSeed = []

export const analyticsSeed = [
  { date: new Date('2026-01-01'), visits: 1240, revenue: 18300, orders: 21, newUsers: 55 },
  { date: new Date('2026-02-01'), visits: 1650, revenue: 22400, orders: 27, newUsers: 70 },
  { date: new Date('2026-03-01'), visits: 2010, revenue: 29800, orders: 35, newUsers: 84 },
  { date: new Date('2026-04-01'), visits: 2260, revenue: 34100, orders: 43, newUsers: 95 },
  { date: new Date('2026-05-01'), visits: 2450, revenue: 37850, orders: 49, newUsers: 104 },
  { date: new Date('2026-06-01'), visits: 2680, revenue: 41220, orders: 53, newUsers: 118 },
]

export const settingsSeed = {
  siteName: 'HOK Interior Designs',
  supportEmail: 'info@hokinterior.com',
  maintenanceMode: false,
  currency: 'USD',
  shippingPolicy: 'Ships within 3-7 business days depending on product category.',
  returnPolicy: 'Returns accepted within 14 days for eligible items.',
}
