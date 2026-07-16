import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2, Image as ImageIcon, Link2, Eye, Edit } from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

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
  const [aboutData, setAboutData] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [galleryRef, setGalleryRef] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [aboutImageUrl, setAboutImageUrl] = useState('')
  const [aboutImagePreview, setAboutImagePreview] = useState(null)
  const [aboutImageFile, setAboutImageFile] = useState(null)
  const aboutImageRef = useRef(null)

  const loadAbout = async () => {
    try {
      const res = await api.get('/content/about')
      setAboutData(res.data || {})
      setForm({
        story: res.data?.story || '',
        mission: res.data?.mission || '',
        vision: res.data?.vision || '',
        values: res.data?.values || '',
        companyDescription: res.data?.companyDescription || '',
        location: res.data?.location || '',
        contactEmail: res.data?.contactEmail || '',
        statistics: res.data?.statistics || '',
        socialLinks: JSON.stringify(res.data?.socials || {}, null, 2),
      })
      setImages(res.data?.galleryImages || [])
      setAboutImageUrl(res.data?.aboutImageUrl || '')
      if (res.data?.aboutImageUrl) setAboutImagePreview(res.data.aboutImageUrl)
    } catch {
      setForm(INITIAL_FORM)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAbout() }, [])

  const handleAboutImage = (e) => {
    const f = e.target.files?.[0] || null
    setAboutImageFile(f)
    if (f?.type?.startsWith('image/')) {
      setAboutImagePreview(URL.createObjectURL(f))
    } else {
      setAboutImagePreview(null)
    }
  }

  const removeAboutImage = () => {
    setAboutImageFile(null)
    setAboutImagePreview(null)
    aboutImageRef.current.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'socialLinks') {
          try {
            payload.append(key, JSON.stringify(JSON.parse(value || '{}')))
          } catch {
            payload.append(key, '{}')
          }
        } else {
          payload.append(key, value)
        }
      })
      if (aboutImageFile) payload.append('aboutImage', aboutImageFile)
      await api.post('/content/about', payload)
      await loadAbout()
      emitAdminDataChanged({ type: 'about-changed' })
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  const handleGalleryFiles = async (files) => {
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        const payload = new FormData()
        payload.append('galleryImage', file)
        const res = await api.post('/content/about/gallery', payload)
        if (res.data?.galleryImages) {
          setImages(res.data.galleryImages)
        }
      }
    } catch {
      // handle error
    } finally {
      setUploading(false)
    }
  }

  const handleGalleryDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    handleGalleryFiles(files)
  }

  const removeGalleryImage = async (url) => {
    try {
      const res = await api.delete('/content/about/gallery', { data: { imageUrl: url } })
      if (res.data?.galleryImages) setImages(res.data.galleryImages)
    } catch {
      // handle error
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
          <h2 className="font-display text-3xl text-[var(--primary)]">About Page</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">Manage company story, mission, gallery and contact info</p>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <motion.form
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onSubmit={submit}
          className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] space-y-5 self-start"
        >
          <div>
            <h3 className="font-display text-xl text-[var(--primary)]">About Content</h3>
            <p className="text-[10px] text-[var(--primary)]/50 mt-1">Update company story, mission and values</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Company Description</label>
            <textarea
              value={form.companyDescription}
              onChange={(e) => setForm((f) => ({ ...f, companyDescription: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
              placeholder="Brief company overview..."
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Our Story</label>
            <textarea
              value={form.story}
              onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
              placeholder="Share your journey and philosophy..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Mission</label>
              <textarea
                value={form.mission}
                onChange={(e) => setForm((f) => ({ ...f, mission: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                placeholder="Our mission..."
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Vision</label>
              <textarea
                value={form.vision}
                onChange={(e) => setForm((f) => ({ ...f, vision: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                placeholder="Our vision..."
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Core Values</label>
            <textarea
              value={form.values}
              onChange={(e) => setForm((f) => ({ ...f, values: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
              placeholder="Integrity, Excellence, Innovation..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="Nairobi, Kenya"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Contact Email</label>
              <input
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                type="email"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="info@hqkinteriors.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Statistics</label>
            <input
              value={form.statistics}
              onChange={(e) => setForm((f) => ({ ...f, statistics: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
              placeholder="e.g., 100+ Projects, 15 Years Experience"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Social Links (JSON)</label>
            <textarea
              value={form.socialLinks}
              onChange={(e) => setForm((f) => ({ ...f, socialLinks: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition font-mono text-xs resize-none"
              placeholder='{"instagram": "url", "facebook": "url", "pinterest": "url", "tiktok": "url"}'
              rows={2}
            />
          </div>

          <div className="border-t border-[var(--border)] pt-5 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-[var(--accent)]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Hero Image</p>
            </div>
            <input ref={aboutImageRef} type="file" accept="image/*" onChange={handleAboutImage} className="hidden" />
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={() => aboutImageRef.current?.click()}
              className="relative border-2 border-dashed rounded-2xl transition-all duration-300"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg)',
              }}
            >
              {aboutImagePreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={aboutImagePreview}
                    alt="About hero preview"
                    className="h-52 w-full object-cover"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeAboutImage() }}
                    className="absolute top-3 right-3 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-[var(--primary)] shadow-lg"
                  >
                    <X size={14} />
                  </motion.button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/40 flex items-center justify-center text-[var(--accent)]"
                  >
                    <ImageIcon size={28} />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-[var(--primary)]">Drop image here or click to browse</p>
                    <p className="text-[10px] text-[var(--primary)]/50 mt-1">JPG, PNG, WebP up to 10MB</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-[var(--primary)] text-white w-full py-3 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg"
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Save About Page'}
          </motion.button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          <motion.div className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ImageIcon size={20} className="text-[var(--accent)]" />
                <h3 className="font-display text-2xl text-[var(--primary)]">Gallery Images</h3>
              </div>
              <label className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white/50 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--primary)]/70 hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-white transition-all duration-200 cursor-pointer">
                <Plus size={14} />
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
              ref={setGalleryRef}
              onDrop={handleGalleryDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              className={`grid grid-cols-2 gap-2.5 rounded-2xl p-2 transition-all duration-300 ${
                isDragOver ? 'bg-[var(--accent)]/5 border-2 border-dashed border-[var(--accent)]' : ''
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
                    src={getOptimizedUrl(url, { width: 300 })}
                    alt=""
                    className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[var(--primary)]/0 group-hover:bg-[var(--primary)]/50 transition-all duration-300" />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => removeGalleryImage(url)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <div className="p-2 bg-[var(--error)] rounded-full text-white shadow-lg">
                      <Trash2 size={16} />
                    </div>
                  </motion.button>
                </motion.div>
              ))}
              {images.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center mb-3 text-[var(--primary)]/30">
                    <ImageIcon size={24} />
                  </div>
                  <p className="text-sm text-[var(--primary)]/50">No gallery images</p>
                  <p className="text-[10px] text-[var(--primary)]/30 mt-1">Drop images here or click Add</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}