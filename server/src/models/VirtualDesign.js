import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false },
)

const beforeAfterSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    label: { type: String },
  },
  { _id: false },
)

const virtualDesignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    videoPublicId: { type: String, required: true },
    thumbnailUrl: { type: String },
    services: [serviceSchema],
    beforeAfterImages: [beforeAfterSchema],
    category: { type: String },
    tags: [{ type: String }],
    ctaPrimary: { type: String, default: 'Start Your Project' },
    ctaSecondary: { type: String, default: 'Learn More' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const VirtualDesign = mongoose.model('VirtualDesign', virtualDesignSchema)
