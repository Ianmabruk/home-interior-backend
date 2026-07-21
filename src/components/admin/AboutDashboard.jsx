import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2, Image as ImageIcon } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [aboutImagePreview, setAboutImagePreview] = useState(null)
  const [aboutImageFile, setAboutImageFile] = useState(null)
  const aboutImageRef = useRef(null)

  const loadAbout = useCallback(async () => {
    try {
      const res = await api.get('/about')
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
      setAboutImagePreview(res.data?.aboutImageUrl || null)
    } catch {
      setForm(INITIAL_FORM)
    } finally {
      setLoading(false)
    }
  }, [])

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
      payload.append('story', form.story || '')
      payload.append('companyDescription', form.companyDescription || '')
      payload.append('mission', form.mission || '')
      payload.append('vision', form.vision || '')
      payload.append('location', form.location || '')
      payload.append('contactEmail', form.contactEmail || '')
      payload.append('socials', form.socialLinks || '{}')
      if (aboutImageFile) payload.append('media', aboutImageFile)
      await api.put('/about', payload)
      await loadAbout()
      emitAdminDataChanged({ type: 'about-changed' })
    } catch {
      // handle error
    } finally {
      setLoading(false)
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
            <div className="flex items-center gap-2 mb-6">
              <ImageIcon size={20} className="text-[var(--accent)]" />
              <h3 className="font-display text-2xl text-[var(--primary)]">About Image</h3>
            </div>
            <p className="text-xs text-[var(--primary)]/50 mb-4">Upload a hero image for the about page</p>
            {aboutImagePreview && (
              <div className="relative rounded-xl overflow-hidden mb-4">
                <img
                  src={aboutImagePreview}
                  alt="About hero preview"
                  className="h-48 w-full object-cover"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={removeAboutImage}
                  className="absolute top-3 right-3 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-[var(--primary)] shadow-lg"
                >
                  <X size={14} />
                </motion.button>
              </div>
            )}
            <label className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white/50 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--primary)]/70 hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-white transition-all duration-200 cursor-pointer">
              <Plus size={14} />
              {aboutImagePreview ? 'Replace Image' : 'Upload Image'}
              <input
                ref={aboutImageRef}
                type="file"
                accept="image/*"
                onChange={handleAboutImage}
                className="hidden"
              />
            </label>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}