import mongoose from 'mongoose'

const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['video', 'image'], required: true },
    url: { type: String, required: true },
    publicId: { type: String },
    thumbnailUrl: { type: String },
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

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    media: [mediaSchema],
    beforeAfterImages: [beforeAfterSchema],
    videoUrl: String,
    videoPublicId: String,
    coverImageUrl: String,
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Project = mongoose.model('Project', projectSchema)
