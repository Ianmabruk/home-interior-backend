import { z } from 'zod'

const idParam = z.object({ id: z.string().min(1, 'id is required') })
const email = z.string().min(1, 'Email is required').email('Invalid email address')
const blogMediaAsset = z.object({
  secureUrl: z.string().url(),
  publicId: z.string().min(1),
  resourceType: z.enum(['image', 'video']),
  assetId: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  version: z.number().nullable().optional(),
  format: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  originalName: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  bytes: z.number().nullable().optional(),
  originalBytes: z.number().nullable().optional(),
  compressedBytes: z.number().nullable().optional(),
  // Legacy fields for backward compatibility
  providerAssetId: z.string().nullable().optional(),
  storageProvider: z.string().nullable().optional(),
  mediaType: z.string().nullable().optional(),
  playbackUrl: z.string().url().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  originalFilename: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  uploadStatus: z.string().nullable().optional(),
})
const blogMediaAssets = z.union([
  z.array(blogMediaAsset),
  z.string().transform((value, ctx) => {
    try {
      const parsed = JSON.parse(value)
      const result = z.array(blogMediaAsset).safeParse(parsed)
      if (result.success) return result.data
      ctx.addIssue({ code: 'custom', message: 'Invalid media assets' })
      return z.NEVER
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Invalid media assets JSON' })
      return z.NEVER
    }
  }),
])

export const authSchemas = {
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
  updateProfile: z.object({
    fullName: z.string().min(1, 'Full name is required'),
  }),
}

export const contentSchemas = {
  newsletter: z.object({ email }),
  unsubscribe: z.object({
    token: z.string().min(1, 'Unsubscribe token is required'),
  }),
}

export const contactSchemas = {
  post: z.object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    email: z.string().min(1, 'Email is required').optional(),
    phone: z.string().optional(),
    subject: z.string().optional(),
    message: z.string().min(1, 'Message is required'),
  }),
  inquiry: z.object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    email: z.string().min(1, 'Email is required').optional(),
    phone: z.string().optional(),
    projectSummary: z.string().min(1, 'Project summary is required'),
  }),
}

export const consultationSchemas = {
  publicCreate: z.object({
    name: z.string().min(1, 'Name is required'),
    email,
    message: z.string().min(1, 'Message is required'),
    phone: z.string().optional(),
    budget: z.string().optional(),
    timeline: z.string().optional(),
    projectType: z.string().optional(),
    type: z.enum(['consultation', 'e-design']).optional(),
    packageName: z.string().optional(),
    packagePrice: z.coerce.number().optional(),
    paymentStatus: z.string().optional(),
    orderId: z.string().optional(),
    purchaseDate: z.string().optional(),
    preferredDate: z.string().optional(),
    preferredTime: z.string().optional(),
  }),
  updateStatus: z.object({
    status: z.string().min(1, 'Status is required'),
  }),
}

export const messageSchemas = {
  create: z.object({
    name: z.string().min(1, 'Name is required'),
    email,
    subject: z.string().optional(),
    content: z.string().min(1, 'Content is required'),
  }),
  reply: z.object({ reply: z.string().min(1, 'Reply is required') }),
}

export const blogSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required'),
    subtitle: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    category: z.string().optional(),
    tags: z.union([
      z.array(z.string()),
      z.string().transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
    ]).optional(),
    author: z.string().optional(),
    metaDescription: z.string().optional(),
    published: z.union([z.boolean(), z.string()]).transform((v) => v === 'true' || v === true).optional(),
    featured: z.union([z.boolean(), z.string()]).transform((v) => v === 'true' || v === true).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    publishDate: z.string().optional().nullable().transform((v) => {
      if (!v) return null
      // Accept both date-only (YYYY-MM-DD) and full ISO datetime
      const d = new Date(v)
      return isNaN(d.getTime()) ? null : d.toISOString()
    }),
    videoAsset: z.union([
      z.string().transform((value) => JSON.parse(value)),
      z.object({
        secureUrl: z.string().url(),
        publicId: z.string().min(1),
        resourceType: z.literal('video').optional(),
        assetId: z.string().nullable().optional(),
        type: z.string().nullable().optional(),
        version: z.number().nullable().optional(),
        format: z.string().optional(),
        duration: z.number().nullable().optional(),
        width: z.number().nullable().optional(),
        height: z.number().nullable().optional(),
        bytes: z.number().nullable().optional(),
        originalBytes: z.number().nullable().optional(),
        compressedBytes: z.number().nullable().optional(),
        originalName: z.string().optional(),
        storageProvider: z.literal('hyperserve').or(z.literal('cloudinary')).optional(),
        providerAssetId: z.string().optional(),
        playbackUrl: z.string().url().nullable().optional(),
        thumbnailUrl: z.string().url().nullable().optional(),
        uploadStatus: z.string().optional(),
        mediaType: z.literal('video').optional(),
        mimeType: z.string().optional(),
      }),
    ]).optional(),
    imageAsset: z.union([
      z.string().transform((value) => JSON.parse(value)),
      blogMediaAsset,
    ]).optional(),
    mediaAssets: blogMediaAssets.optional(),
    removeVideo: z.union([z.boolean(), z.string()]).optional(),
  }),
  update: z.object({
    title: z.string().min(1).optional(),
    subtitle: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    category: z.string().optional(),
    tags: z.union([
      z.array(z.string()),
      z.string().transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
    ]).optional(),
    author: z.string().optional(),
    metaDescription: z.string().optional(),
    published: z.union([z.boolean(), z.string()]).transform((v) => v === 'true' || v === true).optional(),
    featured: z.union([z.boolean(), z.string()]).transform((v) => v === 'true' || v === true).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    publishDate: z.string().optional().nullable().transform((v) => {
      if (!v) return null
      const d = new Date(v)
      return isNaN(d.getTime()) ? null : d.toISOString()
    }),
    videoAsset: z.union([
      z.string().transform((value) => JSON.parse(value)),
      z.object({
        secureUrl: z.string().url(),
        publicId: z.string().min(1),
        resourceType: z.literal('video').optional(),
        assetId: z.string().nullable().optional(),
        type: z.string().nullable().optional(),
        version: z.number().nullable().optional(),
        format: z.string().optional(),
        duration: z.number().nullable().optional(),
        width: z.number().nullable().optional(),
        height: z.number().nullable().optional(),
        bytes: z.number().nullable().optional(),
        originalBytes: z.number().nullable().optional(),
        compressedBytes: z.number().nullable().optional(),
        originalName: z.string().optional(),
        storageProvider: z.literal('hyperserve').or(z.literal('cloudinary')).optional(),
        providerAssetId: z.string().optional(),
        playbackUrl: z.string().url().nullable().optional(),
        thumbnailUrl: z.string().url().nullable().optional(),
        uploadStatus: z.string().optional(),
        mediaType: z.literal('video').optional(),
        mimeType: z.string().optional(),
      }),
    ]).optional(),
    imageAsset: z.union([
      z.string().transform((value) => JSON.parse(value)),
      blogMediaAsset,
    ]).optional(),
    mediaAssets: blogMediaAssets.optional(),
    removeMediaUrls: z.union([z.array(z.string()), z.string()]).optional(),
    removeVideo: z.union([z.boolean(), z.string()]).optional(),
  }),
}

export const serviceSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    icon: z.string().optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
    buttonText: z.string().optional(),
    buttonUrl: z.string().optional(),
  }),
  update: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
    buttonText: z.string().optional(),
    buttonUrl: z.string().optional(),
  }),
  reorder: z.object({
    order: z.array(z.object({ id: z.string(), displayOrder: z.coerce.number().int() })).min(1),
  }),
}

const stringArray = z
  .union([z.array(z.string()), z.string()])
  .transform((val) => {
    if (Array.isArray(val)) return val.filter(Boolean)
    if (typeof val === 'string') return val ? [val] : []
    return []
  })

const stringArrayMax40 = stringArray.refine((val) => val.length <= 40, 'Maximum 40 images allowed')

export const portfolioSchemas = {
    reorder: z.object({
      projects: z
        .array(z.object({ id: z.string().min(1), displayOrder: z.coerce.number().int().nonnegative() }))
        .min(1)
        .optional(),
      order: z
        .array(z.object({ id: z.string().min(1), displayOrder: z.coerce.number().int().nonnegative() }))
        .min(1)
        .optional(),
    }).refine((val) => (val.projects && val.projects.length > 0) || (val.order && val.order.length > 0), {
      message: 'A non-empty projects or order array is required',
    }),
    create: z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      category: z.string().optional(),
      featured: z.union([z.boolean(), z.string()]).optional(),
      displayOrder: z.coerce.number().int().nonnegative().optional(),
      published: z.union([z.boolean(), z.string()]).optional(),
       mediaUrls: z.array(z.string()).max(40, 'Maximum 40 gallery images allowed').optional(),
       beforeImages: stringArrayMax40.optional(),
       afterImages: stringArrayMax40.optional(),
       imageUrl: z.string().optional(),
     }),
     update: z.object({
       title: z.string().optional(),
       description: z.string().optional(),
       category: z.string().optional(),
       featured: z.union([z.boolean(), z.string()]).optional(),
       displayOrder: z.coerce.number().int().nonnegative().optional(),
       published: z.union([z.boolean(), z.string()]).optional(),
       mediaUrls: z.array(z.string()).max(40, 'Maximum 40 gallery images allowed').optional(),
       beforeImages: stringArrayMax40.optional(),
       afterImages: stringArrayMax40.optional(),
    }),
  }

export const virtualDesignSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    category: z.string().optional(),
    mediaType: z.enum(['image', 'video']).optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    published: z.union([z.boolean(), z.string()]).optional(),
    mediaUrls: z.array(z.string()).optional(),
    price: z.coerce.number().positive('Price must be positive').optional(),
    priceMax: z.coerce.number().positive('Max price must be positive').optional(),
    currency: z.string().optional(),
    priceSuffix: z.string().optional(),
    features: z.array(z.string()).optional(),
    ctaText: z.string().optional(),
    tagline: z.string().optional(),
    packageType: z.string().optional(),
  }),
  update: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    mediaType: z.enum(['image', 'video']).optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    published: z.union([z.boolean(), z.string()]).optional(),
    mediaUrls: z.array(z.string()).optional(),
    price: z.coerce.number().positive('Price must be positive').optional().nullable(),
    currency: z.string().optional(),
    priceSuffix: z.string().optional(),
    features: z.array(z.string()).optional(),
    ctaText: z.string().optional(),
    tagline: z.string().optional(),
    packageType: z.string().optional().nullable(),
  }),
}

export const testimonialSchemas = {
  create: z.object({
    clientName: z.string().min(1, 'Client name is required'),
    testimonial: z.string().optional(),
    content: z.string().optional(),
    project: z.string().optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
  }),
  update: z.object({
    clientName: z.string().optional(),
    testimonial: z.string().optional(),
    content: z.string().optional(),
    project: z.string().optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
  }),
}

export const workWithUsSchemas = {
  publicCreate: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required'),
    budget: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    timeline: z.string().optional().nullable(),
  }),
  updateStatus: z.object({
    status: z.string().min(1, 'Status is required'),
  }),
  contentCreate: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
  }),
  contentUpdate: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
  }),
}

export const heroMediaSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required'),
    subtitle: z.string().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
  }),
  update: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
  }),
}

export const aboutSchemas = {
  update: z.object({
    story: z.string().optional(),
    companyDescription: z.string().optional(),
    mission: z.string().optional(),
    vision: z.string().optional(),
    location: z.string().optional(),
    contactEmail: z.string().email('Invalid email').optional(),
    socials: z.any().optional(),
    values: z.string().optional(),
  }),
}

export const productSchemas = {
  create: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    discountPrice: z.coerce.number().min(0).optional(),
    category: z.string().optional(),
    vendor: z.string().optional(),
    stock: z.coerce.number().int().nonnegative().optional(),
    sku: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isFeatured: z.union([z.boolean(), z.string()]).optional(),
    isPublished: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    variants: z.array(z.any()).optional(),
  }),
  update: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    discountPrice: z.coerce.number().min(0).optional(),
    category: z.string().optional(),
    vendor: z.string().optional(),
    stock: z.coerce.number().int().nonnegative().optional(),
    sku: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isFeatured: z.union([z.boolean(), z.string()]).optional(),
    isPublished: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    variants: z.array(z.any()).optional(),
  }),
}

export const orderSchemas = {
  create: z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
    items: z.union([z.array(z.any()), z.string()]).optional(),
    shipping: z.any().optional(),
    shippingMethod: z.string().optional(),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    paymentDetails: z.any().optional(),
    total: z.coerce.number().min(0).optional(),
  }),
  updateStatus: z.object({
    status: z.string().min(1, 'Status is required'),
  }),
}

export const paymentSchemas = {
  mpesa: z.object({
    phone: z.string().min(1, 'Phone is required'),
    amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
    orderData: z.any().optional(),
  }),
  card: z.object({
    cardHolder: z.string().min(1, 'Card holder is required'),
    expiry: z.string().min(1, 'Expiry is required'),
    amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
    orderData: z.any().optional(),
  }),
  verify: z.object({
    reference: z.string().min(1, 'Reference is required'),
  }),
}

export const chatSchemas = {
  post: z.object({ message: z.string().min(1, 'Message is required') }),
}

export const userSchemas = {
  wishlistAdd: z.object({ productId: z.string().min(1, 'productId is required') }),
  cartAdd: z.object({
    productId: z.string().min(1, 'productId is required'),
    quantity: z.coerce.number().int().positive().optional(),
    variant: z.any().optional(),
    variantId: z.string().optional(),
  }),
  cartUpdate: z.object({
    productId: z.string().min(1, 'productId is required'),
    quantity: z.coerce.number().int().positive().optional(),
    variant: z.any().optional(),
    variantId: z.string().optional(),
  }),
}

export const customerAuthSchemas = {
  register: z.object({
    fullName: z.string().min(1, 'Full name is required').max(100, 'Name must be under 100 characters'),
    email: z.string().email('Invalid email address').max(150, 'Email must be under 150 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be under 72 characters'),
    phone: z.string().optional(),
  }),
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
  refresh: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
  logout: z.object({
    refreshToken: z.string().optional(),
  }),
}

export { idParam }
