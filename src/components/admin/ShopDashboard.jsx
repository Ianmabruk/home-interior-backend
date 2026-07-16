import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  UploadCloud,
  ImageIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  Palette,
  Tag,
  Box,
  Sparkles,
  Layers,
  Brush,
} from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'

const CATEGORIES = ['Mirrors', 'Frames', 'Throw Pillows']
const STYLE_VARIANTS = ['Modern', 'Classic', 'Luxury', 'Minimalist', 'Contemporary']

const INITIAL_FORM = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  category: 'Mirrors',
  vendor: '',
  stock: 0,
  sku: '',
  tags: '',
  isFeatured: false,
  isPublished: true,
  colorVariants: [],
  styleVariants: [],
}

const PAGE_SIZE = 12

export const ShopDashboard = () => {
  const [allProducts, setAllProducts] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [page, setPage] = useState(1)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileRef = useRef(null)

  useMemo(() => {
    api
      .get('/admin/all', { params: { sort: '-createdAt', limit: 500 } })
      .then((res) => setAllProducts(res.data?.items || []))
      .catch(() => setAllProducts([]))
  }, [])

  const filtered = useMemo(() => {
    let items = allProducts
    if (search) {
      const q = search.toLowerCase()
      items = items.filter((p) =>
        [p.name, p.description, p.category, p.sku].join(' ').toLowerCase().includes(q)
      )
    }
    if (categoryFilter) {
      items = items.filter((p) => p.category === categoryFilter)
    }
    return items
  }, [allProducts, search, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleImages = (e) => {
    const files = Array.from(e.target.files || [])
    setImageFiles(files)
    setImagePreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const handleImageDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    setImageFiles(files)
    setImagePreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = new FormData()
      payload.append('name', form.name)
      payload.append('description', form.description)
      payload.append('price', String(form.price))
      if (form.discountPrice) payload.append('discountPrice', String(form.discountPrice))
      payload.append('category', form.category)
      if (form.vendor) payload.append('vendor', form.vendor)
      payload.append('stock', String(form.stock))
      payload.append('sku', form.sku)
      payload.append('tags', JSON.stringify(form.tags.split(',').map((t) => t.trim()).filter(Boolean)))
      payload.append('isFeatured', String(form.isFeatured))
      payload.append('isPublished', String(form.isPublished))

      imageFiles.forEach((file) => payload.append('images', file))

      if (form.colorVariants.length > 0) {
        payload.append('colorVariants', JSON.stringify(form.colorVariants))
      }

      if (form.styleVariants.length > 0) {
        payload.append('styleVariants', JSON.stringify(form.styleVariants))
      }

      if (editingId) {
        await api.patch(`/products/${editingId}`, payload)
        setEditingId(null)
      } else {
        await api.post('/products', payload)
      }

      setForm(INITIAL_FORM)
      setImageFiles([])
      setImagePreviews([])
      const res = await api.get('/admin/all', { params: { sort: '-createdAt', limit: 500 } })
      setAllProducts(res.data?.items || [])
      emitAdminDataChanged({ type: 'products-changed' })
    } catch {
      // handle error
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (item) => {
    setEditingId(item._id || item.id)
    setForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      discountPrice: item.discountPrice || '',
      category: item.category || 'Mirrors',
      vendor: item.vendor || '',
      stock: item.stock || 0,
      sku: item.sku || '',
      tags: (item.tags || []).join(', '),
      isFeatured: item.isFeatured || false,
      isPublished: item.isPublished ?? true,
      colorVariants: item.colorVariants || [],
    })
    setImagePreviews(item.images?.map((i) => i.url) || [])
    setImageFiles([])
  }

  const deleteItem = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/products/${deleteId}`)
      setDeleteId(null)
      const res = await api.get('/admin/all', { params: { sort: '-createdAt', limit: 500 } })
      setAllProducts(res.data?.items || [])
      emitAdminDataChanged({ type: 'products-changed' })
    } catch {
      // handle error
    }
  }

  const addColorVariant = () => {
    setForm((f) => ({
      ...f,
      colorVariants: [
        ...f.colorVariants,
        {
          colorName: '',
          colorHex: '#000000',
          stockQuantity: 0,
          priceOverride: '',
          sku: '',
          isDefault: f.colorVariants.length === 0,
        },
      ],
    }))
  }

  const updateVariant = (index, field, value) => {
    setForm((f) => ({
      ...f,
      colorVariants: f.colorVariants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }))
  }

  const removeVariant = (index) => {
    setForm((f) => ({ ...f, colorVariants: f.colorVariants.filter((_, i) => i !== index) }))
  }

  const exportCsv = () => {
    const header = 'Name,Category,Price,Discount Price,Stock,SKU,Status\n'
    const rows = filtered
      .map((p) =>
        `"${(p.name || '').replace(/"/g, '""')}","${p.category || ''}",${p.price || 0},${p.discountPrice || 0},${p.stock || 0},"${p.sku || ''}",${p.isPublished ? 'Published' : 'Draft'}`
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Shop</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">{filtered.length} products</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <motion.div whileHover={{ scale: 1.02 }} className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/50"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition pl-9 max-w-xs"
              placeholder="Search products..."
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }}>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <FileText size={12} />
            Export
          </motion.button>
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
            <h3 className="font-display text-xl text-[var(--primary)]">
              {editingId ? 'Edit Product' : 'Add Product'}
            </h3>
            <p className="text-[10px] text-[var(--primary)]/50 mt-1">
              {editingId ? 'Update product details' : 'Add a new product to your shop'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-1.5">
              <Box size={12} />
              Product Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
              placeholder="Product name"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
              placeholder="Product description..."
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">
                Price ($)
              </label>
              <input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                type="number"
                step="0.01"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">
                Discount Price ($)
              </label>
              <input
                value={form.discountPrice}
                onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                type="number"
                step="0.01"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">
                Stock
              </label>
              <input
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) || 0 }))}
                type="number"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">
                SKU
              </label>
              <input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="SKU-001"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">
                Vendor
              </label>
              <input
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                placeholder="Vendor name"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-1.5">
              <Tag size={12} />
              Tags
            </label>
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
              placeholder="luxury, modern, handmade"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
              <span className="text-sm text-[var(--primary)]">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
              <span className="text-sm text-[var(--primary)]">Published</span>
            </label>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImages}
            className="hidden"
          />
          <motion.div
            whileHover={{ scale: 1.01 }}
            onDrop={handleImageDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
              isDragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]/30'
            }`}
          >
            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden">
                    <img src={src} alt="" className="h-24 w-full object-cover" />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setImageFiles((f) => f.filter((_, idx) => idx !== i))
                        setImagePreviews((p) => p.filter((_, idx) => idx !== i))
                      }}
                      className="absolute -top-1 -right-1 bg-[var(--primary)] text-white p-1 rounded-full shadow-lg"
                    >
                      <X size={10} />
                    </motion.button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/10 flex items-center justify-center text-[var(--accent)]"
                >
                  <UploadCloud size={24} />
                </motion.div>
                <p className="text-sm text-[var(--primary)]">Drop images here or click to browse</p>
                <p className="text-[10px] text-[var(--primary)]/50">PNG, JPG up to 10MB</p>
              </div>
            )}
          </motion.div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-1.5">
                <Palette size={12} />
                Color Variants
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={addColorVariant}
                className="text-[10px] text-[var(--accent)] hover:text-[var(--primary)] transition-colors font-medium flex items-center gap-1"
              >
                <Plus size={12} />
                Add
              </motion.button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
              {form.colorVariants.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 items-center bg-gradient-to-r from-[var(--bg)] to-[var(--secondary)]/20 p-2.5 rounded-xl"
                >
                  <input
                    value={v.colorName}
                    onChange={(e) => updateVariant(i, 'colorName', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition flex-1"
                    placeholder="Color"
                  />
                  <input
                    value={v.colorHex}
                    onChange={(e) => updateVariant(i, 'colorHex', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition w-16"
                    placeholder="#000"
                  />
                  <input
                    value={v.stockQuantity}
                    onChange={(e) =>
                      updateVariant(i, 'stockQuantity', Number(e.target.value) || 0)
                    }
                    type="number"
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition w-16"
                    placeholder="Qty"
                  />
                  <input
                    value={v.priceOverride}
                    onChange={(e) => updateVariant(i, 'priceOverride', e.target.value)}
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition w-20"
                    placeholder="Price"
                  />
                  <input
                    value={v.sku}
                    onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition w-20"
                    placeholder="SKU"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="text-[var(--error)] hover:bg-[var(--error)]/10 p-1.5 rounded-lg"
                  >
                    <Trash2 size={12} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Style Variants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 flex items-center gap-1.5">
                <Sparkles size={12} />
                Style Variants
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setForm(f => ({ ...f, styleVariants: [...f.styleVariants, { styleName: '', images: [], description: '', specifications: {} }] }))}
                className="text-[10px] text-[var(--accent)] hover:text-[var(--primary)] transition-colors font-medium flex items-center gap-1"
              >
                <Plus size={12} />
                Add
              </motion.button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
              {form.styleVariants.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-[var(--bg)] to-[var(--secondary)]/20 p-3 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Style {i + 1}</p>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, styleVariants: f.styleVariants.filter((_, idx) => idx !== i) }))}
                      className="text-[var(--error)] hover:bg-[var(--error)]/10 p-1 rounded-lg"
                    >
                      <Trash2 size={12} />
                    </motion.button>
                  </div>
                  <div className="space-y-2">
                    <input
                      value={s.styleName}
                      onChange={(e) => setForm(f => ({ ...f, styleVariants: f.styleVariants.map((sv, idx) => idx === i ? { ...sv, styleName: e.target.value } : sv) }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                      placeholder="Style name (e.g., Modern, Classic, Luxury)"
                    />
                    <textarea
                      value={s.description || ''}
                      onChange={(e) => setForm(f => ({ ...f, styleVariants: f.styleVariants.map((sv, idx) => idx === i ? { ...sv, description: e.target.value } : sv) }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                      placeholder="Style description..."
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Materials</label>
                        <input
                          value={s.specifications?.materials || ''}
                          onChange={(e) => setForm(f => ({ ...f, styleVariants: f.styleVariants.map((sv, idx) => idx === i ? { ...sv, specifications: { ...sv.specifications, materials: e.target.value } } : sv) }))}
                          className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                          placeholder="Materials"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Dimensions</label>
                        <input
                          value={s.specifications?.dimensions || ''}
                          onChange={(e) => setForm(f => ({ ...f, styleVariants: f.styleVariants.map((sv, idx) => idx === i ? { ...sv, specifications: { ...sv.specifications, dimensions: e.target.value } } : sv) }))}
                          className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                          placeholder="Dimensions"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Available Colors</label>
                        <input
                          value={s.availableColors?.join(', ') || ''}
                          onChange={(e) => setForm(f => ({ ...f, styleVariants: f.styleVariants.map((sv, idx) => idx === i ? { ...sv, availableColors: e.target.value.split(',').map(c => c.trim()) } : sv) }))}
                          className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                          placeholder="White, Beige, Brown"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Images</label>
                        <input
                          value={s.images?.join(', ') || ''}
                          onChange={(e) => setForm(f => ({ ...f, styleVariants: f.styleVariants.map((sv, idx) => idx === i ? { ...sv, images: e.target.value.split(',').map(c => c.trim()) } : sv) }))}
                          className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                          placeholder="Image URLs (comma separated)"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setForm(f => ({ ...f, styleVariants: [...f.styleVariants, { styleName: '', images: [], description: '', specifications: {}, availableColors: [] }] }))}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Plus size={14} /> Add Another Style
              </motion.button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-full bg-[var(--accent)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--accent)] hover:shadow-lg disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving…' : editingId ? 'Update Product' : 'Add Product'}
          </motion.button>
        </motion.form>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((item, i) => (
            <motion.div
              layout
              key={item._id || item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-hidden group"
            >
              <div className="relative overflow-hidden">
                {item.images?.[0]?.url ? (
                  <img
                    src={item.images[0].url}
                    alt={item.name}
                    className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-44 w-full bg-gradient-to-br from-[var(--bg)] to-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/30">
                    <ImageIcon size={40} />
                  </div>
                )}
                {item.discountPrice && (
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-[var(--accent)] to-[var(--accent)] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-lg">
                    {Math.round(((item.price - item.discountPrice) / item.price) * 100)}%
                    OFF
                  </span>
                )}
                {item.stock === 0 && (
                  <span className="absolute top-3 right-3 bg-[var(--primary)] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    Out of Stock
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setViewItem(item)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[var(--primary)] hover:bg-white shadow-lg"
                  >
                    <Eye size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startEdit(item)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[var(--primary)] hover:bg-white shadow-lg"
                  >
                    <Edit size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDeleteId(item._id || item.id)}
                    className="p-2 bg-[var(--error)]/90 backdrop-blur-sm rounded-xl text-white hover:bg-[var(--error)] shadow-lg"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>
              <div className="p-5">
                <p className="font-display text-lg text-[var(--primary)] line-clamp-1">
                  {item.name}
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--accent)] mt-1 font-medium">
                  {item.category}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <p className="font-semibold text-[var(--primary)]">
                    ${item.discountPrice || item.price}
                  </p>
                  {item.discountPrice && (
                    <p className="text-sm text-[var(--primary)]/50 line-through">${item.price}</p>
                  )}
                </div>
                <p className="text-[10px] text-[var(--primary)]/50 mt-1.5">
                  SKU: {item.sku} | Stock: {item.stock}
                </p>
              </div>
            </motion.div>
          ))}
          {paginated.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/30">
                <ImageIcon size={32} />
              </div>
              <p className="font-display text-xl text-[var(--primary)]/30">
                No products found
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 pt-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </motion.button>
          <span className="text-sm text-[var(--primary)]/50 font-medium">
            Page {page} of {totalPages}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </motion.button>
        </motion.div>
      )}

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--error)]/10 flex items-center justify-center text-[var(--error)]">
                <Trash2 size={24} />
              </div>
              <h3 className="font-display text-xl text-[var(--primary)] text-center mb-2">
                Confirm Delete
              </h3>
              <p className="text-sm text-[var(--primary)]/50 text-center mb-6">
                Are you sure? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteId(null)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={deleteItem}
                  className="rounded-full bg-[var(--error)] px-4 py-2.5 text-2xs font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--error)] hover:shadow-lg"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm"
              onClick={() => setViewItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-lg w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="flex justify-between items-start mb-5">
                <h3 className="font-display text-2xl text-[var(--primary)]">
                  {viewItem.name}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewItem(null)}
                  className="p-2 rounded-full hover:bg-[var(--bg)] transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>
              {viewItem.images?.[0]?.url && (
                <img
                  src={viewItem.images[0].url}
                  alt={viewItem.name}
                  className="w-full h-52 object-cover rounded-2xl mb-5 shadow-lg"
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Category', value: viewItem.category },
                  { label: 'Price', value: `$${viewItem.discountPrice || viewItem.price}` },
                  { label: 'Stock', value: viewItem.stock },
                  { label: 'SKU', value: viewItem.sku },
                  { label: 'Status', value: viewItem.isPublished ? 'Published' : 'Draft' },
                  { label: 'Featured', value: viewItem.isFeatured ? 'Yes' : 'No' },
                ].map((field, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-r from-[var(--bg)] to-[var(--secondary)]/10 rounded-xl p-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">
                      {field.label}
                    </p>
                    <p className="text-sm text-[var(--primary)] mt-0.5 font-medium">{field.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-gradient-to-r from-[var(--bg)] to-[var(--secondary)]/10 rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 mb-1">
                  Description
                </p>
                <p className="text-sm text-[var(--primary)] leading-relaxed">{viewItem.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}