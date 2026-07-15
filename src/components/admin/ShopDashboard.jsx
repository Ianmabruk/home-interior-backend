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
} from 'lucide-react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'

const CATEGORIES = ['Mirrors', 'Frames', 'Throw Pillows']

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
          <h2 className="font-['Playfair_Display'] text-3xl text-[#241711]">Shop</h2>
          <p className="text-sm text-[#6D5647] mt-1">{filtered.length} products</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <motion.div whileHover={{ scale: 1.02 }} className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D5647]/50"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input pl-9 max-w-xs"
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
              className="select"
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
            className="btn-secondary text-2xs flex items-center gap-1.5"
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
          className="admin-card-glass space-y-5 self-start"
        >
          <div>
            <h3 className="font-['Playfair_Display'] text-xl text-[#241711]">
              {editingId ? 'Edit Product' : 'Add Product'}
            </h3>
            <p className="text-[10px] text-[#6D5647] mt-1">
              {editingId ? 'Update product details' : 'Add a new product to your shop'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70 flex items-center gap-1.5">
              <Box size={12} />
              Product Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
              placeholder="Product name"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="textarea"
              placeholder="Product description..."
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                Price ($)
              </label>
              <input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                Discount Price ($)
              </label>
              <input
                value={form.discountPrice}
                onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                Stock
              </label>
              <input
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) || 0 }))}
                type="number"
                className="input"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                SKU
              </label>
              <input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                className="input"
                placeholder="SKU-001"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                Vendor
              </label>
              <input
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                className="input"
                placeholder="Vendor name"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70 flex items-center gap-1.5">
              <Tag size={12} />
              Tags
            </label>
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className="input"
              placeholder="luxury, modern, handmade"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="w-4 h-4 rounded border-border text-[#C69B6D] focus:ring-[#C69B6D]/20"
              />
              <span className="text-sm text-[#241711]">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="w-4 h-4 rounded border-border text-[#C69B6D] focus:ring-[#C69B6D]/20"
              />
              <span className="text-sm text-[#241711]">Published</span>
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
            className={`upload-zone rounded-2xl transition-all duration-300 ${
              isDragOver ? 'drag-active border-[#C69B6D] bg-[#C69B6D]/5' : ''
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
                      className="absolute -top-1 -right-1 bg-[#241711] text-white p-1 rounded-full shadow-lg"
                    >
                      <X size={10} />
                    </motion.button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C69B6D]/10 to-[#E8D3BE]/10 flex items-center justify-center text-[#C69B6D]"
                >
                  <UploadCloud size={24} />
                </motion.div>
                <p className="text-sm text-[#241711]">Drop images here or click to browse</p>
                <p className="text-[10px] text-[#6D5647]">PNG, JPG up to 10MB</p>
              </div>
            )}
          </motion.div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70 flex items-center gap-1.5">
                <Palette size={12} />
                Color Variants
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={addColorVariant}
                className="text-[10px] text-[#C69B6D] hover:text-[#241711] transition-colors font-medium flex items-center gap-1"
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
                  className="flex gap-2 items-center bg-gradient-to-r from-[#F8F4EF] to-[#E8D3BE]/20 p-2.5 rounded-xl"
                >
                  <input
                    value={v.colorName}
                    onChange={(e) => updateVariant(i, 'colorName', e.target.value)}
                    className="input !h-9 text-xs flex-1"
                    placeholder="Color"
                  />
                  <input
                    value={v.colorHex}
                    onChange={(e) => updateVariant(i, 'colorHex', e.target.value)}
                    className="input !h-9 text-xs w-16"
                    placeholder="#000"
                  />
                  <input
                    value={v.stockQuantity}
                    onChange={(e) =>
                      updateVariant(i, 'stockQuantity', Number(e.target.value) || 0)
                    }
                    type="number"
                    className="input !h-9 text-xs w-16"
                    placeholder="Qty"
                  />
                  <input
                    value={v.priceOverride}
                    onChange={(e) => updateVariant(i, 'priceOverride', e.target.value)}
                    type="number"
                    step="0.01"
                    className="input !h-9 text-xs w-20"
                    placeholder="Price"
                  />
                  <input
                    value={v.sku}
                    onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                    className="input !h-9 text-xs w-20"
                    placeholder="SKU"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="text-[#C62828] hover:bg-[#C62828]/10 p-1.5 rounded-lg"
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
            className="btn-accent w-full"
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
              className="admin-card-glass overflow-hidden group"
            >
              <div className="relative overflow-hidden">
                {item.images?.[0]?.url ? (
                  <img
                    src={item.images[0].url}
                    alt={item.name}
                    className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-44 w-full bg-gradient-to-br from-[#F8F4EF] to-[#E8D3BE]/30 flex items-center justify-center text-[#6D5647]/30">
                    <ImageIcon size={40} />
                  </div>
                )}
                {item.discountPrice && (
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-[#C69B6D] to-[#B68A68] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-lg">
                    {Math.round(((item.price - item.discountPrice) / item.price) * 100)}%
                    OFF
                  </span>
                )}
                {item.stock === 0 && (
                  <span className="absolute top-3 right-3 bg-[#241711] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    Out of Stock
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#241711]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setViewItem(item)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[#241711] hover:bg-white shadow-lg"
                  >
                    <Eye size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startEdit(item)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[#241711] hover:bg-white shadow-lg"
                  >
                    <Edit size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDeleteId(item._id || item.id)}
                    className="p-2 bg-[#C62828]/90 backdrop-blur-sm rounded-xl text-white hover:bg-[#C62828] shadow-lg"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </div>
              <div className="p-5">
                <p className="font-['Playfair_Display'] text-lg text-[#241711] line-clamp-1">
                  {item.name}
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#C69B6D] mt-1 font-medium">
                  {item.category}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <p className="font-semibold text-[#241711]">
                    ${item.discountPrice || item.price}
                  </p>
                  {item.discountPrice && (
                    <p className="text-sm text-[#6D5647]/50 line-through">${item.price}</p>
                  )}
                </div>
                <p className="text-[10px] text-[#6D5647] mt-1.5">
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
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#E8D3BE]/30 to-[#C69B6D]/10 flex items-center justify-center mb-4 text-[#6D5647]/30">
                <ImageIcon size={32} />
              </div>
              <p className="font-['Playfair_Display'] text-xl text-[#241711]/30">
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
            className="btn-secondary text-2xs px-4 py-2.5 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </motion.button>
          <span className="text-sm text-[#6D5647] font-medium">
            Page {page} of {totalPages}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary text-2xs px-4 py-2.5 disabled:opacity-30"
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
              className="absolute inset-0 bg-[#241711]/40 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#C62828]/10 flex items-center justify-center text-[#C62828]">
                <Trash2 size={24} />
              </div>
              <h3 className="font-['Playfair_Display'] text-xl text-[#241711] text-center mb-2">
                Confirm Delete
              </h3>
              <p className="text-sm text-[#6D5647] text-center mb-6">
                Are you sure? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteId(null)}
                  className="btn-secondary"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={deleteItem}
                  className="btn-danger"
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
              className="absolute inset-0 bg-[#241711]/40 backdrop-blur-sm"
              onClick={() => setViewItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-lg w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="flex justify-between items-start mb-5">
                <h3 className="font-['Playfair_Display'] text-2xl text-[#241711]">
                  {viewItem.name}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewItem(null)}
                  className="p-2 rounded-full hover:bg-[#F8F4EF] transition-colors"
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
                    className="bg-gradient-to-r from-[#F8F4EF] to-[#E8D3BE]/10 rounded-xl p-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70">
                      {field.label}
                    </p>
                    <p className="text-sm text-[#241711] mt-0.5 font-medium">{field.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-gradient-to-r from-[#F8F4EF] to-[#E8D3BE]/10 rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6D5647]/70 mb-1">
                  Description
                </p>
                <p className="text-sm text-[#241711] leading-relaxed">{viewItem.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
