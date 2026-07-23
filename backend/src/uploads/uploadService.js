import { uploadToCloudinary, deleteFromCloudinary, deleteManyFromCloudinary } from '../config/cloudinary.js'

export async function uploadFile(buffer, mimetype, folder) {
  const uploaded = await uploadToCloudinary(buffer, mimetype, folder)
  return { url: uploaded.url, path: uploaded.publicId, mimeType: mimetype }
}

export async function deleteFile(publicIdOrPath) {
  if (!publicIdOrPath) return
  await deleteFromCloudinary(publicIdOrPath)
}

export async function deleteFiles(publicIdsOrPaths) {
  if (!Array.isArray(publicIdsOrPaths) || publicIdsOrPaths.length === 0) return
  await deleteManyFromCloudinary(publicIdsOrPaths)
}
