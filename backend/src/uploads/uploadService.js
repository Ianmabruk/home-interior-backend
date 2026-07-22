import { supabase } from '../config/supabase.js'

export async function uploadFile(buffer, mimetype, folder, type = 'image') {
  const ext = mimetype.split('/')[1] || 'bin'
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from('media')
    .upload(fileName, buffer, {
      contentType: mimetype,
      upsert: true,
    })

  if (error || !data) {
    throw new Error(error?.message || 'Upload failed')
  }

  const { data: publicUrl } = supabase.storage.from('media').getPublicUrl(data.path)

  return {
    url: publicUrl.publicUrl,
    path: data.path,
    mimeType: mimetype,
  }
}

export async function deleteFile(path) {
  if (!path) return
  const { error } = await supabase.storage.from('media').remove([path])
  if (error) console.error('Delete file error:', error)
}

export async function deleteFiles(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return
  const { error } = await supabase.storage.from('media').remove(paths)
  if (error) console.error('Delete files error:', error)
}
