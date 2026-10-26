import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from '@components/common/DynamicMotion'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  UploadCloud,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  Palette,
  Tag,
  Box,
  Loader2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api, clearApiCache } from '../../services/api'
import { dispatchAdminDataChanged, ADMIN_EVENT_TYPES, getAdminDataChangedPayload } from '../../utils/adminEvents'
import { useIsMobile } from '@hooks/useIsMobile'
import { SHOP_CATEGORIES } from '../../utils/constants'
import { compressImages } from '../../utils/imageCompression'

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
  displayOrder: 0,
  variants: [],
}

const PAGE_SIZE = 12

export const ShopDashboard = () => {
  const [allProducts, setAllProducts] = useState(() => {
    try {
      const cached = sessionStorage.getItem('hok_shop_products')
      const ts = sessionStorage.getItem('hok_shop_products_ts')
      if (cached && ts && Date.now() - Number(ts) < 30000) {
        return JSON.parse(cached)
      }
    } catch {
      // ignore parse errors
    }
    return []
  })
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [page, setPage] = useState(1)
  const [isDragOver, setIsDragOver] = useState(false)
  const [variantFiles, setVariantFiles] = useState([])
  const [variantPreviews, setVariantPreviews] = useState([])
  const [error, setError] = useState('')
  const reduceMotion = useIsMobile()
  const fileRef = useRef(null)

  const refetch = useCallback(async () => {
    try {
      setProductsLoading(true)
      const res = await api.get('/products/admin/all', { params: { sort: '-createdAt', limit: 50 } })
      const items = res.data?.items || []
      setAllProducts(items)
      try {
        sessionStorage.setItem('hok_shop_products', JSON.stringify(items))
        sessionStorage.setItem('hok_shop_products_ts', String(Date.now()))
      } catch {
        // ignore sessionStorage errors
      }
    } catch {
      setAllProducts([])
    } finally {
      setProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (allProducts.length > 0) return
    refetch()
  }, [allProducts.length, refetch])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (!payload) return
      if (payload.type === ADMIN_EVENT_TYPES.PRODUCTS_CHANGED) {
        clearApiCache('/products')
        refetch()
      } else if (payload.type === 'settings-changed') {
        refetch()
      }
    }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [refetch])

  const showError = (msg) => setError(msg)

  const validate = () => {
    if (!form.name.trim()) return 'Product name is required'
    if (!form.price || Number(form.price) <= 0) return 'Price must be greater than 0'
    if (!form.category) return 'Category is required'
    if (imageFiles.length === 0 && !editingId) return 'At least one product image is required'
    return null
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) {
      showError(validationError)
      return
    }
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
      payload.append('displayOrder', String(form.displayOrder || 0))

      imageFiles.forEach((file) => payload.append('images', file))

      const variants = form.variants.map((v) => ({
        color: v.color || 'Default',
        image: v.image || '',
        stock: Number(v.stock) || 0,
        price: v.price ? Number(v.price) : null,
      }))
      payload.append('variants', JSON.stringify(variants))

      variantFiles.forEach((vf) => {
        payload.append(`variantImages_${vf.index}`, vf.file)
      })

      if (editingId) {
        const saved = await api.patch(`/products/${editingId}`, payload)
        setEditingId(null)
        const updatedItem = saved.data
        setAllProducts((prev) =>
          prev.map((p) =>
            (p._id || p.id) === editingId ? { ...p, ...updatedItem, _id: p._id, id: p.id, images: updatedItem.images || updatedItem.imageUrl ? [updatedItem.images?.[0] || updatedItem.imageUrl || updatedItem.mainImage] : (p.images || []) } : p
          )
        )
      } else {
        const saved = await api.post('/products', payload)
        const newItem = saved.data
        setAllProducts((prev) => [{ ...newItem, _id: newItem._id || `temp_${Date.now()}` }, ...prev])
      }

      setForm(INITIAL_FORM)
      setImageFiles([])
      setImagePreviews([])
      setVariantFiles([])
      setVariantPreviews([])
      clearApiCache('/products')
      dispatchAdminDataChanged('products-changed')
      toast.success(editingId ? 'Product updated successfully.' : 'Product uploaded successfully.')
    } catch (err) {
      showError(err?.message || 'Failed to save product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let items = allProducts
    if (search) {
      const q = search.toLowerCase()
      items = items.filter((p) =>
        [p.name, p.description, p.category, p.sku].join(' ').toLowerCase().includes(q)
      )
    }
    if (categoryFilter) {
      items = items.filter((p) => (p.category || '').toLowerCase() === categoryFilter.toLowerCase())
    }
    return items
  }, [allProducts, search, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleImages = async (e) => {
    const rawFiles = Array.from(e.target.files || [])
    const compressed = await compressImages(rawFiles, { maxWidth: 1920, maxHeight: 1920, quality: 0.82 })
    setImageFiles(compressed)
    setImagePreviews(compressed.map((f) => URL.createObjectURL(f)))
  }

  const handleImageDrop = async (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const rawFiles = Array.from(e.dataTransfer.files || [])
    const compressed = await compressImages(rawFiles, { maxWidth: 1920, maxHeight: 1920, quality: 0.82 })
    setImageFiles(compressed)
    setImagePreviews(compressed.map((f) => URL.createObjectURL(f)))
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
      isFeatured: item.featured || false,
      isPublished: item.isPublished ?? item.published ?? true,
      displayOrder: item.displayOrder || 0,
      variants: (item.variants || []).map((v) => ({
        color: v.color || '',
        image: v.image || '',
        stock: v.stock || 0,
        price: v.price || '',
      })),
    })
    setImagePreviews(item.images?.map((i) => typeof i === 'string' ? i : i.url) || [])
    setImageFiles([])
    setVariantPreviews((item.variants || []).map((v) => v.image || ''))
    setVariantFiles([])
  }

  const deleteItem = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/products/${deleteId}`)
      setDeleteId(null)
      setAllProducts((prev) => prev.filter((p) => (p._id || p.id) !== deleteId))
      clearApiCache('/products')
      dispatchAdminDataChanged('products-changed')
    } catch (err) {
      toast.error(err?.message || 'Failed to delete product. Please try again.')
    }
  }

  const deleteProductImage = async (productId, imageIndex) => {
    try {
      const res = await api.delete(`/products/${productId}/images/${imageIndex}`)
      const updated = res.data
      setAllProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...updated, _id: p._id } : p))
      )
      clearApiCache('/products')
      dispatchAdminDataChanged('products-changed')
      toast.success('Image deleted successfully.')
    } catch (err) {
      toast.error(err?.message || 'Failed to delete image.')
    }
  }

  const addVariant = () => {
    const nextIndex = form.variants.length
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        { color: '', image: '', stock: 0, price: '' },
      ],
    }))
    setVariantPreviews((p) => [...p, ''])
    setVariantFiles((files) => [...files, { index: nextIndex, file: null }])
  }

  const updateVariant = (index, field, value) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }))
  }

  const removeVariant = (index) => {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }))
    setVariantPreviews((p) => p.filter((_, i) => i !== index))
    setVariantFiles((files) => files.filter((f) => f.index !== index))
  }

  const handleVariantImage = async (index, e) => {
    const rawFile = e.target.files?.[0] || null
    if (!rawFile) return
    const compressed = await compressImages([rawFile], { maxWidth: 1600, maxHeight: 1600, quality: 0.82 })
    const file = compressed[0] || rawFile
    const preview = URL.createObjectURL(file)
    setVariantPreviews((p) => {
      const next = [...p]
      next[index] = preview
      return next
    })
    setVariantFiles((files) => {
      const next = files.filter((f) => f.index !== index)
      next.push({ index, file })
      return next
    })
  }

  const exportCsv = () => {
    const header = 'Name,Category,Price,Discount Price,Stock,SKU,Status\n'
    const rows = filtered
      .map((p) =>
        `"${(p.name || '').replace(/"/g, '""')}","${p.category || ''}",KSh ${p.price || 0},KSh ${p.discountPrice || 0},${p.stock || 0},"${p.sku || ''}",${p.isPublished ? 'Published' : 'Draft'}`
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
              {SHOP_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.label}>
                  {c.label}
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
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/5 px-4 py-3 text-sm text-[var(--error)]"
            >
              {error}
            </motion.div>
          )}
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
                 Price (KSh)
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
                 Discount Price (KSh)
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
                {SHOP_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.label}>
                    {c.label}
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

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Display Order</label>
            <input
              value={form.displayOrder}
              onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
              type="number"
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
              placeholder="0"
            />
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
                Variants
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={addVariant}
                className="text-[10px] text-[var(--accent)] hover:text-[var(--primary)] transition-colors font-medium flex items-center gap-1"
              >
                <Plus size={12} />
                Add Variant
              </motion.button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-hide">
              {form.variants.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 items-center bg-gradient-to-r from-[var(--bg)] to-[var(--secondary)]/20 p-2.5 rounded-xl"
                >
                  <input
                    value={v.color}
                    onChange={(e) => updateVariant(i, 'color', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition flex-1"
                    placeholder="Color (e.g., White)"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleVariantImage(i, e)}
                      className="hidden"
                      id={`variant-image-${i}`}
                    />
                    <label
                      htmlFor={`variant-image-${i}`}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-2xs font-medium text-[var(--primary)]/70 hover:border-[var(--accent)] transition"
                    >
                      <ImageIcon size={12} />
                      Image
                    </label>
                  </div>
                  {variantPreviews[i] && (
                    <img src={variantPreviews[i]} alt="" className="h-10 w-10 rounded-lg object-cover border border-[var(--border)]" />
                  )}
                  <input
                    value={v.stock}
                    onChange={(e) => updateVariant(i, 'stock', Number(e.target.value) || 0)}
                    type="number"
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition w-16"
                    placeholder="Qty"
                  />
                  <input
                    value={v.price}
                    onChange={(e) => updateVariant(i, 'price', e.target.value)}
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition w-20"
                    placeholder="Price"
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full rounded-full bg-[var(--accent)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--accent)] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Saving…' : editingId ? 'Update Product' : 'Add Product'}
          </motion.button>
</motion.form>

          {productsLoading && allProducts.length === 0 ? (
           <div className="col-span-full flex flex-col items-center justify-center py-16">
             <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)] mb-3" />
             <p className="text-sm text-[var(--primary)]/50 font-medium">Loading products...</p>
           </div>
         ) : (
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
             {paginated.map((item, i) => (
             <motion.div
               layout
               key={item._id || item.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: reduceMotion ? 0 : i * 0.03 }}
               className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-hidden flex flex-col"
             >
               {/* Product Image - Square */}
               <div className="relative aspect-square overflow-hidden bg-[var(--secondary)]/10">
                 {typeof item.images?.[0] === 'string' || item.images?.[0]?.url ? (
                   <img
                     src={typeof item.images?.[0] === 'string' ? item.images[0] : item.images?.[0]?.url}
                     alt={item.name}
                     className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                     loading="lazy"
                     decoding="async"
                     width={400}
                     height={400}
                   />
                 ) : (
                   <div className="h-full w-full bg-gradient-to-br from-[var(--bg)] to-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/30">
                     <ImageIcon size={48} />
                   </div>
                 )}
                 {item.discountPrice && (
                   <span className="absolute top-2 left-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent)] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-lg">
                     {Math.round(((item.price - item.discountPrice) / item.price) * 100)}% OFF
                   </span>
                 )}
                 {item.stock === 0 && (
                   <span className="absolute top-2 right-2 bg-[var(--primary)] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                     Out of Stock
                   </span>
                 )}
               </div>
               {/* Product Info */}
               <div className="p-4 flex-1 flex flex-col">
                 <h3 className="font-display text-base text-[var(--primary)] line-clamp-2 mb-1">
                   {item.name}
                 </h3>
                 <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--accent)] font-medium mb-2">
                   {item.category}
                 </p>
                 <div className="flex items-center gap-2 mb-3">
                   <p className="font-semibold text-[var(--primary)]">
                     KSh {Number(item.discountPrice || item.price).toLocaleString()}
                   </p>
                   {item.discountPrice && (
                     <p className="text-sm text-[var(--primary)]/50 line-through">KSh {Number(item.price).toLocaleString()}</p>
                   )}
                 </div>
                 <p className="text-[10px] text-[var(--primary)]/50 mb-3">
                   SKU: {item.sku || 'N/A'} | Stock: {item.stock}
                 </p>
                 {/* Edit and Delete Buttons - Always Visible */}
                 <div className="flex gap-2 mt-auto">
                   <button
                     onClick={() => startEdit(item)}
                     className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--accent)]/90"
                   >
                     <Edit size={12} />
                     Edit
                   </button>
                   <button
                     onClick={() => setDeleteId(item._id || item.id)}
                     className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--error)] px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--error)]/90"
                   >
                     <Trash2 size={12} />
                     Delete
                   </button>
                 </div>
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
         )}
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
                  Delete this product?
                </h3>
                <p className="text-sm text-[var(--primary)]/50 text-center mb-6">This action cannot be undone.</p>
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
              {viewItem.images?.[0] && (
                <img
                  src={typeof viewItem.images?.[0] === 'string' ? viewItem.images[0] : viewItem.images?.[0]?.url}
                  alt={viewItem.name}
                  className="w-full h-52 object-cover rounded-2xl mb-5 shadow-lg"
                />
              )}
              {viewItem.images && viewItem.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto mb-4">
                  {viewItem.images.slice(1).map((img, i) => {
                    const src = typeof img === 'string' ? img : img?.url
                    return (
                      <div key={i + 1} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)]/40">
                        <img src={src} alt={`${viewItem.name} #${i + 2}`} className="h-full w-full object-cover" />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deleteProductImage(viewItem._id, i + 1) }}
                          className="absolute top-0 right-0 bg-[var(--error)]/90 text-white p-0.5 rounded-full shadow-lg"
                          aria-label="Delete image"
                        >
                          <X size={10} />
                        </motion.button>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                 {[
                   { label: 'Category', value: viewItem.category },
                   { label: 'Price', value: `KSh ${Number(viewItem.discountPrice || viewItem.price).toLocaleString()}` },
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
              {viewItem.variants && viewItem.variants.length > 0 && (
                <div className="mt-4 bg-gradient-to-r from-[var(--bg)] to-[var(--secondary)]/10 rounded-xl p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 mb-2">
                    Variants
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewItem.variants.map((v, vi) => (
                      <div key={vi} className="flex items-center gap-2 rounded-lg bg-white/60 p-2 border border-[var(--border)]/50">
                        {v.image && (
                          <img src={v.image} alt={v.color} className="h-8 w-8 rounded object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--primary)] truncate">{v.color}</p>
                          <p className="text-[10px] text-[var(--primary)]/50">Stock: {v.stock}{v.price ? ` | Price: $${v.price}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

export default ShopDashboard
