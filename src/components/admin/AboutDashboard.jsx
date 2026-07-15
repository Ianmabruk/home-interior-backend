import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2, Upload, Image as ImageIcon, Link2 } from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'

const INITIAL_FORM = {
  story: '',
  mission: '',
  vision: '',
  values: '',
  companyDescription: '',
  location: '',
  contactEmail: '',
  statistics: '',
  socialLinks: '',
}

export const AboutDashboard = () => {
  const [form, setForm] = useState(INITIAL_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileRef = useRef(null)
  const galleryRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/about')
        if (res.data) {
          setForm({
            story: res.data.story || '',
            mission: res.data.mission || '',
            vision: res.data.vision || '',
            values: res.data.values || '',
            companyDescription: res.data.companyDescription || '',
            location: res.data.location || '',
            contactEmail: res.data.contactEmail || '',
            statistics: res.data.statistics || '',
            socialLinks: res.data.socialLinks || '',
          })
          setImagePreview(res.data.aboutImageUrl || null)
        }
      } catch {
        // handle error
      }
    }
    load()
  }, [])

  const handleImage = (e) => {
    const f = e.target.files?.[0] || null
    setImageFile(f)
    if (f?.type?.startsWith('image/')) setImagePreview(URL.createObjectURL(f))
    else setImagePreview(null)
  }

  const handleGalleryDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) handleGalleryFiles(files)
  }

  const handleGalleryFiles = async (files) => {
    const uploaded = []
    for (const file of files) {
      const payload = new FormData()
      payload.append('media', file)
      try {
        const res = await api.post('/media/upload', payload)
        if (res.data?.url) uploaded.push(res.data.url)
      } catch {
        // skip failed
      }
    }
    setImages((prev) => [...prev, ...uploaded])
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = new FormData()
      payload.append('story', form.story)
      payload.append('mission', form.mission)
      payload.append('vision', form.vision)
      payload.append('values', form.values)
      if (form.companyDescription) payload.append('companyDescription', form.companyDescription)
      if (form.location) payload.append('location', form.location)
      if (form.contactEmail) payload.append('contactEmail', form.contactEmail)
      if (form.statistics) payload.append('statistics', form.statistics)
      if (form.socialLinks) payload.append('socialLinks', form.socialLinks)
      if (imageFile) payload.append('media', imageFile)

      await api.put('/content/about', payload)
      setImageFile(null)
      const res = await api.get('/content/about')
      if (res.data) {
        setForm((f) => ({ ...f, socialLinks: res.data.socialLinks || '' }))
        setImagePreview(res.data.aboutImageUrl || null)
      }
      emitAdminDataChanged({ type: 'about-changed' })
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  const removeGalleryImage = async (url) => {
    try {
      await api.post('/media/delete', { url })
      setImages((prev) => prev.filter((img) => img !== url))
    } catch {
      setImages((prev) => prev.filter((img) => img !== url))
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <h2 className="font-['Playfair_Display'] text-3xl text-[#241711]">About</h2>
          <p className="text-sm text-[#6D5647] mt-1">
            Manage your brand story and gallery
          </p>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <motion.form
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onSubmit={submit}
          className="admin-card-glass space-y-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-['Playfair_Display'] text-xl text-[#241711]">
                Brand Story
              </h3>
              <p className="text-[10px] text-[#6D5647] mt-1">
                Tell your customers about your brand
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
              Cover Image
            </label>
            <div className="flex items-start gap-4">
              {imagePreview && (
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={imagePreview}
                    alt="About preview"
                    className="h-40 w-full max-w-xs object-cover"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="absolute -top-2 -right-2 rounded-full bg-[#241711] text-white p-2 shadow-lg hover:bg-[#C62828] transition-colors"
                  >
                    <X size={14} />
                  </motion.button>
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#C69B6D]/30 bg-gradient-to-r from-[#F8F4EF] to-[#E8D3BE]/20 hover:from-[#C69B6D]/5 hover:to-[#E8D3BE]/30 transition-all duration-200 text-sm text-[#241711]"
                >
                  <Upload size={16} className="text-[#C69B6D]" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </motion.button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
              Our Story
            </label>
            <textarea
              value={form.story}
              onChange={(e) => setForm((a) => ({ ...a, story: e.target.value }))}
              className="textarea"
              placeholder="Share the story behind your brand..."
              required
              rows={4}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
              Company Description
            </label>
            <textarea
              value={form.companyDescription}
              onChange={(e) => setForm((a) => ({ ...a, companyDescription: e.target.value }))}
              className="textarea"
              placeholder="Brief company description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                Mission
              </label>
              <textarea
                value={form.mission}
                onChange={(e) => setForm((a) => ({ ...a, mission: e.target.value }))}
                className="textarea"
                placeholder="Our mission is..."
                required
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                Vision
              </label>
              <textarea
                value={form.vision}
                onChange={(e) => setForm((a) => ({ ...a, vision: e.target.value }))}
                className="textarea"
                placeholder="Our vision is..."
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
              Core Values
            </label>
            <textarea
              value={form.values}
              onChange={(e) => setForm((a) => ({ ...a, values: e.target.value }))}
              className="textarea"
              placeholder="One value per line&#10;Excellence&#10;Integrity&#10;Innovation"
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
              Statistics (JSON format)
            </label>
            <textarea
              value={form.statistics}
              onChange={(e) => setForm((a) => ({ ...a, statistics: e.target.value }))}
              className="textarea font-mono text-xs"
              placeholder='{"yearsExperience": 15, "projectsCompleted": 500}'
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                Location
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm((a) => ({ ...a, location: e.target.value }))}
                className="input"
                placeholder="Nairobi, Kenya"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                Contact Email
              </label>
              <input
                value={form.contactEmail}
                onChange={(e) => setForm((a) => ({ ...a, contactEmail: e.target.value }))}
                className="input"
                placeholder="info@hokinterior.com"
                type="email"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70 flex items-center gap-2">
              <Link2 size={12} />
              Social Links (JSON format)
            </label>
            <textarea
              value={form.socialLinks}
              onChange={(e) => setForm((a) => ({ ...a, socialLinks: e.target.value }))}
              className="textarea font-mono text-xs"
              placeholder='{"instagram": "https://instagram.com/...", "facebook": "https://facebook.com/..."}'
              rows={2}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="btn-accent w-full"
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </motion.button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="admin-card-glass"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-['Playfair_Display'] text-xl text-[#241711]">
                Gallery
              </h3>
              <p className="text-[10px] text-[#6D5647] mt-1">
                {images.length} images
              </p>
            </div>
            <label className="cursor-pointer rounded-xl border border-dashed border-[#C69B6D]/30 bg-gradient-to-r from-[#F8F4EF] to-[#E8D3BE]/20 hover:from-[#C69B6D]/5 hover:to-[#E8D3BE]/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[#6D5647] hover:text-[#C69B6D] transition-all duration-200">
              <Plus size={14} className="inline mr-1" />
              Add
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleGalleryFiles(Array.from(e.target.files || []))}
                className="hidden"
              />
            </label>
          </div>
          <motion.div
            ref={galleryRef}
            onDrop={handleGalleryDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            className={`grid grid-cols-2 gap-2.5 rounded-2xl p-2 transition-all duration-300 ${
              isDragOver ? 'bg-[#C69B6D]/5 border-2 border-dashed border-[#C69B6D]' : ''
            }`}
          >
            {images.map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="relative group rounded-xl overflow-hidden"
              >
                <img
                  src={url}
                  alt=""
                  className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#241711]/0 group-hover:bg-[#241711]/50 transition-all duration-300" />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => removeGalleryImage(url)}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <div className="p-2 bg-[#C62828] rounded-full text-white shadow-lg">
                    <Trash2 size={16} />
                  </div>
                </motion.button>
              </motion.div>
            ))}
            {images.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#E8D3BE]/30 to-[#C69B6D]/10 flex items-center justify-center mb-3 text-[#6D5647]/30">
                  <ImageIcon size={24} />
                </div>
                <p className="text-sm text-[#6D5647]/50">No gallery images</p>
                <p className="text-[10px] text-[#6D5647]/30 mt-1">Drop images here or click Add</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
