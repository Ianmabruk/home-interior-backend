import { BarChart3, Boxes, Film, FolderKanban, Info, Mail, Sparkles, LayoutDashboard, ShoppingBag, TrendingUp, Users, FileText, Settings, Search, Grid, List, Check, Trash2, Edit, Bell, ChevronLeft, ChevronRight, UploadCloud, X, Plus, Menu, LogOut, Activity, DollarSign, Layers, MessageSquare, Send, Image as ImageIcon, Video } from 'lucide-react'
import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { DEFAULT_MEDIA_SETTINGS, normalizeMediaSettings } from '../../utils/mediaSettings'
import { ImagePositionControls, ImagePositionPreview } from '../../components/common/ImagePositionControls'
import PositionedImage from '../../components/common/PositionedImage'

const tabs = [
  { id: 'general', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'products', label: 'Products', icon: Boxes },
  { id: 'projects', label: 'Projects', icon: Film },
  { id: 'portfolio', label: 'Portfolio', icon: FolderKanban },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'virtual', label: 'Virtual Interior', icon: Sparkles },
  { id: 'chat', label: 'Messages', icon: Mail },
  { id: 'media', label: 'Media Library', icon: Film },
  { id: 'about', label: 'About Content', icon: Info },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const PRODUCT_CATEGORIES = [
  'Living Room', 'Kitchen', 'Bedroom', 'Dining', 'Outdoor',
  'Commercial', 'Decor', 'Lighting', 'Office', 'Custom Designs',
]

const CLOUDINARY_HINT = 'Images upload to Cloudinary. If uploads fail, verify CLOUDINARY_API_KEY / API_SECRET have upload permission in your Cloudinary dashboard.'

const MEDIA_TABS = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Videos' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'projects', label: 'Projects' },
]

function AdminPage() {
  const { user, logout } = useAuth()
  const [overview, setOverview] = useState(null)
  const [about, setAbout] = useState(null)
  const [projects, setProjects] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [products, setProducts] = useState([])
  const [messages, setMessages] = useState([])
  const [virtualDesigns, setVirtualDesigns] = useState([])
  const [users, setUsers] = useState([])
  const [, setAnalyticsData] = useState([])
  const [orders, setOrders] = useState([])
  const [analytics, setAnalytics] = useState(null) // real analytics from /analytics/*
  const [, setTestimonials] = useState([])
  const [activeTab, setActiveTab] = useState('general')
  const [status, setStatus] = useState('')

  const [projectForm, setProjectForm] = useState({ order: 0 })
  const [portfolioForm, setPortfolioForm] = useState({ title: '', category: '', description: '', order: 0 })
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', discountPrice: '', category: '', stock: '', sku: '', vendor: '', tags: '', isFeatured: false, isPublished: true })
  const [virtualForm, setVirtualForm] = useState({ title: '', description: '', services: '', category: '', tags: '', ctaPrimary: 'Start Your Project', ctaSecondary: 'Learn More' })
  const [settingsForm, setSettingsForm] = useState({ siteName: '', supportEmail: '', currency: 'USD', maintenanceMode: false, shippingPolicy: '', returnPolicy: '' })
  const [aboutForm, setAboutForm] = useState({ story: '', mission: '', vision: '', companyDescription: '', location: '', contactEmail: '' })
  const [aboutImageFile, setAboutImageFile] = useState(null)
  const [aboutImagePreview, setAboutImagePreview] = useState(null)
  const [mediaSettings, setMediaSettings] = useState(DEFAULT_MEDIA_SETTINGS)

  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [productImageFile, setProductImageFile] = useState(null)
  const [productImagePreview, setProductImagePreview] = useState(null)
  const [virtualVideoFile, setVirtualVideoFile] = useState(null)
  const [virtualVideoPreview, setVirtualVideoPreview] = useState(null)
  const [resourceType, setResourceType] = useState('video')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editingPortfolio, setEditingPortfolio] = useState(null)
  const [editingVirtual, setEditingVirtual] = useState(null)
  const [editingVariants, setEditingVariants] = useState(null)
  const [variantColorName, setVariantColorName] = useState('')
  const [variantColorHex, setVariantColorHex] = useState('')
  const [variantSku, setVariantSku] = useState('')
  const [variantStockQuantity, setVariantStockQuantity] = useState(0)
  const [variantPriceOverride, setVariantPriceOverride] = useState('')
  const [variantSetDefault, setVariantSetDefault] = useState(false)
  const [variantImageFile, setVariantImageFile] = useState(null)
  const [variantImagePreview, setVariantImagePreview] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ type: null, id: null })

  // Real-time new-order notifications (Task G). We poll the admin overview
  // every 15s; the first poll simply seeds the set of already-known orders
  // (so we don't spam on load), subsequent polls surface genuinely new ones
  // as a toast + bell badge. Seen ids persist in localStorage so notifications
  // still work correctly after a page refresh or redeploy.
  const [orderNotifications, setOrderNotifications] = useState([])
  const [unreadOrders, setUnreadOrders] = useState(0)
  const [showNotif, setShowNotif] = useState(false)
  const [notifToast, setNotifToast] = useState(null)
  const seenOrderIdsRef = useRef(
    new Set(JSON.parse(localStorage.getItem('hok_seen_order_ids') || '[]')),
  )
  const firstPollRef = useRef(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [mediaFilter, setMediaFilter] = useState('all')
  const [mediaSearch, setMediaSearch] = useState('')
  const [selectedMedia, setSelectedMedia] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => {
      [mediaPreview, productImagePreview, virtualVideoPreview, aboutImagePreview, variantImagePreview].forEach((url) => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
    }
  }, [mediaPreview, productImagePreview, virtualVideoPreview, aboutImagePreview, variantImagePreview])

  useEffect(() => {
    fetchAll()
  }, [])

  // Poll for new orders and raise a notification when an unseen order appears.
  useEffect(() => {
    let active = true
    const persistSeen = () => {
      try {
        localStorage.setItem('hok_seen_order_ids', JSON.stringify([...seenOrderIdsRef.current]))
      } catch { /* ignore quota errors */ }
    }
    const poll = async () => {
      if (!active) return
      try {
        const res = await api.get('/admin/overview')
        const orders = res.data?.recentOrders || []
        if (firstPollRef.current) {
          firstPollRef.current = false
          orders.forEach((o) => seenOrderIdsRef.current.add(o._id))
          persistSeen()
          return
        }
        const fresh = []
        for (const o of orders) {
          if (!seenOrderIdsRef.current.has(o._id)) {
            seenOrderIdsRef.current.add(o._id)
            fresh.push(o)
          }
        }
        if (fresh.length) {
          persistSeen()
          const mapped = fresh.map((o) => ({
            id: o._id,
            title: 'New Order Received',
            customerName: o.customerName || 'Customer',
            orderNumber: '#' + String(o._id).slice(-6).toUpperCase(),
            total: o.total,
            createdAt: o.createdAt,
          }))
          setOrderNotifications((prev) => [...mapped, ...prev].slice(0, 30))
          setUnreadOrders((c) => c + mapped.length)
          setNotifToast(mapped[0])
        }
      } catch { /* network/permission errors are non-fatal for polling */ }
    }
    poll()
    const interval = setInterval(poll, 15000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  // Real-time refresh: customers (FIX #2), orders (FIX #4) and analytics
  // (FIX #5) are polled so a new registration / order / sale shows up in the
  // dashboard instantly without a manual page reload.
  useEffect(() => {
    let active = true
    const pollUsers = async () => {
      if (!active) return
      try {
        const res = await api.get('/admin/users')
        if (res.data) setUsers(res.data)
      } catch (err) {
        console.error('[admin] users poll failed:', err?.response?.status, err?.response?.data || err?.message)
      }
    }
    const pollOrders = async () => {
      if (!active) return
      try {
        const res = await api.get('/admin/orders')
        if (res.data) setOrders(res.data)
      } catch (err) {
        console.error('[admin] orders poll failed:', err?.response?.status, err?.response?.data || err?.message)
      }
    }
    pollUsers()
    pollOrders()
    const usersInterval = setInterval(pollUsers, 15000)
    const ordersInterval = setInterval(pollOrders, 10000)
    return () => {
      active = false
      clearInterval(usersInterval)
      clearInterval(ordersInterval)
    }
  }, [])

  // Fetch real analytics whenever the analytics or dashboard tab is opened.
  useEffect(() => {
    if (activeTab !== 'analytics' && activeTab !== 'general') return
    let active = true
    const load = async () => {
      try {
        const [overviewRes, revenueRes, customersRes, productsRes] = await Promise.all([
          api.get('/analytics/overview').catch((err) => { console.error('[admin] analytics overview failed:', err?.response?.status, err?.response?.data || err?.message); return { data: null } }),
          api.get('/analytics/revenue').catch((err) => { console.error('[admin] analytics revenue failed:', err?.response?.status, err?.response?.data || err?.message); return { data: null } }),
          api.get('/analytics/customers').catch((err) => { console.error('[admin] analytics customers failed:', err?.response?.status, err?.response?.data || err?.message); return { data: null } }),
          api.get('/analytics/products').catch((err) => { console.error('[admin] analytics products failed:', err?.response?.status, err?.response?.data || err?.message); return { data: null } }),
        ])
        if (!active) return
        setAnalytics({
          overview: overviewRes.data,
          revenue: revenueRes.data,
          customers: customersRes.data,
          products: productsRes.data,
        })
      } catch (err) {
        console.error('[admin] analytics load failed:', err?.response?.status, err?.response?.data || err?.message)
      }
    }
    load()
    const interval = setInterval(load, 20000)
    return () => { active = false; clearInterval(interval) }
  }, [activeTab])

  // Refresh customers/testimonials/orders when admin content changes.
  useEffect(() => {
    const handler = () => {
      api.get('/admin/users').then((r) => r.data && setUsers(r.data)).catch((err) => console.error('[admin] users refresh failed:', err?.response?.status, err?.response?.data || err?.message))
      api.get('/admin/orders').then((r) => r.data && setOrders(r.data)).catch((err) => console.error('[admin] orders refresh failed:', err?.response?.status, err?.response?.data || err?.message))
      api.get('/admin/testimonials').then((r) => r.data && setTestimonials(r.data)).catch((err) => console.error('[admin] testimonials refresh failed:', err?.response?.status, err?.response?.data || err?.message))
    }
    window.addEventListener('admin:data-changed', handler)
    return () => window.removeEventListener('admin:data-changed', handler)
  }, [])

  useEffect(() => {
    if (!notifToast) return
    const t = setTimeout(() => setNotifToast(null), 6000)
    return () => clearTimeout(t)
  }, [notifToast])

  const markNotificationsRead = () => setUnreadOrders(0)

  // When the About tab is opened, hydrate the form from the saved record so
  // existing content + image are displayed in the admin dashboard, and load
  // the saved image position so a text-only save cannot reset it to defaults.
  useEffect(() => {
    if (activeTab === 'about' && about) {
      setAboutForm({
        story: about.story || '',
        mission: about.mission || '',
        vision: about.vision || '',
        companyDescription: about.companyDescription || '',
        location: about.location || '',
        contactEmail: about.contactEmail || '',
      })
      setMediaSettings(normalizeMediaSettings(about.mediaSettings))
    }
  }, [activeTab, about])

  const fetchAll = () => {
    Promise.all([
      api.get('/admin/overview').catch(() => ({ data: null })),
      api.get('/content/projects').catch(() => ({ data: [] })),
      api.get('/content/portfolio').catch(() => ({ data: [] })),
      api.get('/products/admin/all', { params: { sort: '-createdAt', limit: 100 } }).catch(() => ({ data: { items: [] } })),
      api.get('/messages').catch(() => ({ data: [] })),
      api.get('/content/virtual-design').catch(() => ({ data: [] })),
      api.get('/admin/users').catch(() => ({ data: [] })),
      api.get('/content/analytics').catch(() => ({ data: [] })),
      api.get('/admin/orders').catch(() => ({ data: [] })),
      api.get('/admin/testimonials').catch(() => ({ data: [] })),
      api.get('/admin/settings').catch(() => ({ data: null })),
      api.get('/content/about').catch(() => ({ data: null })),
    ])
      .then(([overviewRes, projectsRes, portfolioRes, productsRes, messagesRes, virtualRes, usersRes, analyticsRes, ordersRes, testimonialsRes, settingsRes, aboutRes]) => {
        if (overviewRes.data) setOverview(overviewRes.data)
        setProjects(projectsRes.data || [])
        setPortfolio(portfolioRes.data || [])
        setProducts(productsRes.data?.items || [])
        setMessages(messagesRes.data || [])
        setVirtualDesigns(virtualRes.data || [])
        setUsers(usersRes.data || [])
        setAnalyticsData(analyticsRes.data || [])
        setOrders(ordersRes.data || [])
        setTestimonials(testimonialsRes.data || [])
        if (aboutRes.data) setAbout(aboutRes.data)
        if (settingsRes.data) {
          setSettingsForm({
            siteName: settingsRes.data.siteName || '',
            supportEmail: settingsRes.data.supportEmail || '',
            currency: settingsRes.data.currency || 'USD',
            maintenanceMode: Boolean(settingsRes.data.maintenanceMode),
            shippingPolicy: settingsRes.data.shippingPolicy || '',
            returnPolicy: settingsRes.data.returnPolicy || '',
          })
        }
      })
  }

  const showToast = (message, type = 'success') => {
    setStatus(`${type === 'error' ? 'ERROR' : 'SUCCESS'}: ${message}`)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setStatus(''), 5000)
  }
  const setSuccess = (message) => showToast(message, 'success')
  const setFailure = (error, fallback) => showToast(error?.response?.data?.message || fallback, 'error')

  const onUploadProgress = (e) => {
    if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total))
  }
  const resetProgress = () => { setUploadProgress(0); setIsUploading(false) }

  const setPreview = (file, kind) => {
    if (!file) return null
    if (kind === 'video') return URL.createObjectURL(file)
    if (file.type?.startsWith('image/')) return URL.createObjectURL(file)
    return null
  }

  const mediaItems = useMemo(() => {
    const items = []
    portfolio.forEach((p) => items.push({ id: p._id, type: 'image', kind: 'portfolio', title: p.title, category: p.category, src: p.imageUrl }))
    projects.forEach((p) => items.push({ id: p._id, type: p.videoUrl ? 'video' : 'image', kind: 'projects', title: p.title, category: p.category, src: p.videoUrl || p.coverImageUrl }))
    products.forEach((p) => items.push({ id: p._id, type: 'image', kind: 'products', title: p.name, category: p.category, src: p.images?.[0]?.url }))
    virtualDesigns.forEach((p) => items.push({ id: p._id, type: 'video', kind: 'virtual', title: p.title, category: 'Virtual', src: p.videoUrl }))
    return items
  }, [portfolio, projects, products, virtualDesigns])

  const submitProject = async (event) => {
    event.preventDefault()
    if (!mediaFile && !editingProject) { setFailure(null, 'Please choose a file to upload.'); return }
    try {
      setIsUploading(true); setUploadProgress(0)
      const payload = new FormData()
      payload.append('order', String(projectForm.order || 0))
      payload.append('resourceType', resourceType)
      payload.append('mediaSettings', JSON.stringify(normalizeMediaSettings(mediaSettings)))
      if (mediaFile) payload.append('media', mediaFile)
      if (editingProject) {
        await api.patch(`/content/projects/${editingProject._id}`, payload, { onUploadProgress })
        setEditingProject(null)
      } else {
        await api.post('/content/projects', payload, { onUploadProgress })
      }
      setProjectForm({ order: 0 })
      setMediaFile(null); setMediaPreview(null); setMediaSettings(DEFAULT_MEDIA_SETTINGS)
      window.dispatchEvent(new CustomEvent('admin:data-changed', { detail: { type: 'projects-changed' } }))
      fetchAll(); resetProgress(); setSuccess('Project saved successfully.')
    } catch (error) { resetProgress(); setFailure(error, 'Project save failed.') }
  }

  const deleteProject = async (id) => {
    try {
      await api.delete(`/content/projects/${id}`)
      setDeleteConfirm({ type: null, id: null }); fetchAll(); setSuccess('Project deleted.')
    } catch (error) { setFailure(error, 'Delete failed.') }
  }

  const submitPortfolio = async (event) => {
    event.preventDefault()
    if (!mediaFile && !editingPortfolio) { setFailure(null, 'Please choose an image to upload.'); return }
    try {
      setIsUploading(true); setUploadProgress(0)
      const payload = new FormData()
      payload.append('title', portfolioForm.title)
      payload.append('category', portfolioForm.category)
      if (portfolioForm.description) payload.append('description', portfolioForm.description)
      payload.append('order', String(portfolioForm.order || 0))
      payload.append('mediaSettings', JSON.stringify(normalizeMediaSettings(mediaSettings)))
      if (mediaFile) payload.append('media', mediaFile)
      if (editingPortfolio) {
        await api.patch(`/content/portfolio/${editingPortfolio._id}`, payload, { onUploadProgress })
        setEditingPortfolio(null)
      } else {
        await api.post('/content/portfolio', payload, { onUploadProgress })
      }
      setPortfolioForm({ title: '', category: '', description: '', order: 0 })
      setMediaFile(null); setMediaPreview(null)
      setMediaSettings(DEFAULT_MEDIA_SETTINGS)
      window.dispatchEvent(new CustomEvent('admin:data-changed', { detail: { type: 'portfolio-changed' } }))
      fetchAll(); resetProgress(); setSuccess('Portfolio item saved.')
    } catch (error) { resetProgress(); setFailure(error, 'Portfolio save failed.') }
  }

  const deletePortfolio = async (id) => {
    try {
      await api.delete(`/content/portfolio/${id}`)
      setDeleteConfirm({ type: null, id: null }); fetchAll(); setSuccess('Portfolio item deleted.')
    } catch (error) { setFailure(error, 'Delete failed.') }
  }

  const submitProduct = async (event) => {
    event.preventDefault()
    if (!productImageFile) { setFailure(null, 'Please choose a product image.'); return }
    try {
      setIsUploading(true); setUploadProgress(0)
      const payload = new FormData()
      Object.entries(productForm).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) payload.append(key, value)
      })
      payload.append('mediaSettings', JSON.stringify(normalizeMediaSettings(mediaSettings)))
      if (productImageFile) payload.append('images', productImageFile)
      await api.post('/products', payload, { onUploadProgress })
      setProductForm({ name: '', description: '', price: '', discountPrice: '', category: '', stock: '', sku: '', vendor: '', tags: '', isFeatured: false, isPublished: true })
      setProductImageFile(null); setProductImagePreview(null); setMediaSettings(DEFAULT_MEDIA_SETTINGS)
      window.dispatchEvent(new CustomEvent('admin:data-changed', { detail: { type: 'products-changed' } }))
      fetchAll(); resetProgress(); setSuccess('Product saved.')
    } catch (error) { resetProgress(); setFailure(error, 'Product save failed.') }
  }

  const handleVariantImageChange = (e) => {
    const f = e.target.files?.[0] || null
    setVariantImageFile(f)
    if (f && f.type?.startsWith('image/')) {
      setVariantImagePreview(URL.createObjectURL(f))
    } else {
      setVariantImagePreview(null)
    }
  }

  const addVariant = async (productId) => {
    if (!variantColorName) { setFailure(null, 'Color name is required.'); return }
    try {
      setIsUploading(true); setUploadProgress(0)
      const payload = new FormData()
      payload.append('colorName', variantColorName)
      payload.append('colorHex', variantColorHex || '')
      payload.append('sku', variantSku || '')
      payload.append('stockQuantity', String(variantStockQuantity || 0))
      if (variantPriceOverride !== '') payload.append('priceOverride', String(variantPriceOverride))
      if (variantSetDefault) payload.append('setAsDefault', 'true')
      if (variantImageFile) payload.append('image', variantImageFile)
      await api.post(`/products/${productId}/variants`, payload, { onUploadProgress })
      setVariantColorName(''); setVariantColorHex(''); setVariantSku(''); setVariantStockQuantity(0); setVariantPriceOverride('')
      setVariantImageFile(null); setVariantImagePreview(null)
      fetchAll(); resetProgress(); setSuccess('Variant added.')
    } catch (error) { resetProgress(); setFailure(error, 'Add variant failed.') }
  }

  const removeVariant = async (productId, colorName) => {
    try {
      await api.delete(`/products/${productId}/variants/${encodeURIComponent(colorName)}`)
      fetchAll(); setSuccess('Variant removed.')
    } catch (error) { setFailure(error, 'Remove variant failed.') }
  }

  const submitVirtual = async (event) => {
    event.preventDefault()
    if (!virtualVideoFile && !editingVirtual) { setFailure(null, 'Please choose a video to upload.'); return }
    try {
      setIsUploading(true); setUploadProgress(0)
      const payload = new FormData()
      payload.append('title', virtualForm.title)
      payload.append('description', virtualForm.description)
      payload.append('services', virtualForm.services)
      if (virtualForm.category) payload.append('category', virtualForm.category)
      if (virtualForm.tags) payload.append('tags', virtualForm.tags)
      if (virtualForm.ctaPrimary) payload.append('ctaPrimary', virtualForm.ctaPrimary)
      if (virtualForm.ctaSecondary) payload.append('ctaSecondary', virtualForm.ctaSecondary)
      payload.append('mediaSettings', JSON.stringify(normalizeMediaSettings(mediaSettings)))
      if (virtualVideoFile) payload.append('media', virtualVideoFile)
      if (editingVirtual) {
        await api.patch(`/content/virtual-design/${editingVirtual._id}`, payload, { onUploadProgress })
        setEditingVirtual(null)
      } else {
        await api.post('/content/virtual-design', payload, { onUploadProgress })
      }
      setVirtualForm({ title: '', description: '', services: '', category: '', tags: '', ctaPrimary: 'Start Your Project', ctaSecondary: 'Learn More' })
      setVirtualVideoFile(null); setVirtualVideoPreview(null)
      window.dispatchEvent(new CustomEvent('admin:data-changed', { detail: { type: 'virtual-changed' } }))
      fetchAll(); resetProgress(); setSuccess('Virtual design saved.')
    } catch (error) { resetProgress(); setFailure(error, 'Virtual design save failed.') }
  }

  const deleteVirtual = async (id) => {
    try {
      await api.delete(`/content/virtual-design/${id}`)
      setDeleteConfirm({ type: null, id: null }); fetchAll(); setSuccess('Virtual design deleted.')
    } catch (error) { setFailure(error, 'Delete failed.') }
  }

  const submitSettings = async (event) => {
    event.preventDefault()
    try {
      await api.put('/admin/settings', settingsForm); fetchAll(); setSuccess('Settings saved.')
    } catch (error) { setFailure(error, 'Settings save failed.') }
  }

  const submitAbout = async (event) => {
    event.preventDefault()
    try {
      setIsUploading(true); setUploadProgress(0)
      const payload = new FormData()
      payload.append('story', aboutForm.story)
      payload.append('mission', aboutForm.mission)
      payload.append('vision', aboutForm.vision)
      if (aboutForm.companyDescription) payload.append('companyDescription', aboutForm.companyDescription)
      if (aboutForm.location) payload.append('location', aboutForm.location)
      if (aboutForm.contactEmail) payload.append('contactEmail', aboutForm.contactEmail)
      payload.append('mediaSettings', JSON.stringify(normalizeMediaSettings(mediaSettings)))
      if (aboutImageFile) payload.append('media', aboutImageFile)
      await api.put('/content/about', payload, { onUploadProgress })
      window.dispatchEvent(new CustomEvent('admin:data-changed', { detail: { type: 'about-changed' } }))
      setAboutImageFile(null); setAboutImagePreview(null)
      fetchAll(); resetProgress(); setMediaSettings(DEFAULT_MEDIA_SETTINGS); setSuccess('About content saved.')
    } catch (error) { resetProgress(); setFailure(error, 'About save failed.') }
  }

  const handleMediaChange = (e) => {
    const f = e.target.files?.[0] || null
    setMediaFile(f); setMediaPreview(setPreview(f, resourceType === 'video' ? 'video' : 'image'))
  }
  const handleProductImageChange = (e) => {
    const f = e.target.files?.[0] || null
    setProductImageFile(f); setProductImagePreview(setPreview(f, 'image'))
  }
  const handleVirtualVideoChange = (e) => {
    const f = e.target.files?.[0] || null
    setVirtualVideoFile(f); setVirtualVideoPreview(setPreview(f, 'video'))
  }

  // ============ CHART HELPERS (lightweight SVG, restyled) ============
  const PremiumAreaChart = ({ data, color = '#FF8A3D' }) => {
    if (!data?.length) return <div className="h-40 flex items-center justify-center text-textSecondary/40 text-sm">No analytics data</div>
    const w = 320, h = 140, pad = 8
    const max = Math.max(...data, 1)
    const step = (w - pad * 2) / Math.max(data.length - 1, 1)
    const pts = data.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)])
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaGrad)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  const PremiumBarChart = ({ data, labels }) => {
    if (!data?.length) return <div className="h-40 flex items-center justify-center text-textSecondary/40 text-sm">No analytics data</div>
    const max = Math.max(...data, 1)
    return (
      <div className="flex items-end justify-between gap-3 h-40 px-2">
        {data.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
            <span className="text-2xs text-textSecondary/50 mb-1 opacity-0 group-hover:opacity-100 transition">{v}</span>
            <div className="w-full rounded-t-md bg-gradient-to-t from-sidebar/30 to-accentOrange/80 transition-all" style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />
            <span className="text-2xs text-textSecondary/40 mt-2 truncate w-full text-center">{labels?.[i] || i + 1}</span>
          </div>
        ))}
      </div>
    )
  }

  const getColorClass = (color) => ({
    emerald: 'bg-success/10 text-success',
    blue: 'bg-sidebar/10 text-sidebar',
    violet: 'bg-softOrange/20 text-accentOrange',
    orange: 'bg-accentOrange/10 text-accentOrange',
    cyan: 'bg-sidebar/10 text-sidebar',
    pink: 'bg-softOrange/20 text-accentOrange',
    indigo: 'bg-sidebar/10 text-sidebar',
    amber: 'bg-softOrange/20 text-warning',
  }[color] || 'bg-lightBeige text-textPrimary')

  const MetricCard = ({ title, value, icon: Icon, color, hint, prefix, suffix }) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="metric-card"
    >
      <div className="flex items-center justify-between">
        <p className="text-2xs font-semibold uppercase tracking-widest text-textSecondary/70">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorClass(color)}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-textPrimary">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
      </p>
      {hint && <p className="mt-1 text-2xs text-textSecondary/50">{hint}</p>}
    </motion.div>
  )

  const StatusBadge = ({ active, status }) => {
    const isActive = active !== undefined ? active : (status === 'delivered' || status === 'active' || status === 'read')
    const label = active !== undefined
      ? (isActive ? 'Active' : 'Inactive')
      : (status ? status.charAt(0).toUpperCase() + status.slice(1) : (isActive ? 'Active' : 'Inactive'))
    return (
      <span className={`badge-${isActive ? 'success' : 'error'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-error'}`} />
        {label}
      </span>
    )
  }

  const AnimatedCounter = ({ value, prefix = '', suffix = '' }) => {
    const [display, setDisplay] = useState(0)
    const numeric = useMemo(() => {
      if (typeof value === 'number') return value
      const parsed = Number(String(value).replace(/[^0-9.-]/g, ''))
      return Number.isFinite(parsed) ? parsed : 0
    }, [value])
    useEffect(() => {
      if (numeric === 0) { setDisplay(0); return }
      const duration = 800
      const startTime = performance.now()
      const step = (now) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplay(Math.floor(eased * numeric))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, [numeric])
    return <>{prefix}{display.toLocaleString()}{suffix}</>
  }

  const SkeletonCard = () => (
    <div className="skeleton-card">
      <div className="skeleton-title" />
      <div className="skeleton-text" />
      <div className="skeleton-text-sm" />
    </div>
  )

  const EmptyState = ({ icon: Icon, title, desc, action }) => (
    <div className="empty-state">
      {Icon && <div className="empty-state-icon"><Icon size={28} /></div>}
      <p className="empty-state-title">{title}</p>
      {desc && <p className="empty-state-desc">{desc}</p>}
      {action}
    </div>
  )

  const DropZone = ({ onFile, preview, onClear, accept, kind }) => {
    const [drag, setDrag] = useState(false)
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile({ target: { files: [f] } }) }}
        className={`upload-zone ${drag ? 'drag-active' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={onFile} />
        {preview ? (
          <div className="relative">
            {kind === 'video' ? (
              <video src={preview} className="h-44 w-full object-cover rounded-xl" muted />
            ) : (
              <img src={preview} alt="preview" className="h-44 w-full object-cover rounded-xl" />
            )}
            <button type="button" onClick={(e) => { e.stopPropagation(); onClear() }} className="absolute top-2 right-2 bg-darkBrown/80 text-white p-1.5 rounded-full hover:bg-darkBrown"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-14 h-14 rounded-2xl bg-accentOrange/10 flex items-center justify-center">
              <UploadCloud size={26} className="text-accentOrange" />
            </div>
            <p className="text-sm text-textSecondary">Drag & drop or <span className="text-accentOrange font-medium">browse</span></p>
            <p className="text-2xs text-textSecondary/50">PNG, JPG, WEBP up to 10MB</p>
          </div>
        )}
      </div>
    )
  }

  const ProgressBar = () => isUploading && (
    <div className="mt-3">
      <div className="h-2 w-full rounded-full bg-lightBeige overflow-hidden">
        <div className="h-full bg-gradient-to-r from-accentOrange to-softOrange transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
      </div>
      <p className="text-2xs text-textSecondary/50 mt-1">Uploading… {uploadProgress}%</p>
    </div>
  )

  // ============ RENDER SECTIONS ============
  const renderDashboard = () => (
    <div className="space-y-6">
      {overview === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sidebar to-darkBrown p-8 shadow-lift"
          >
            <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-accentOrange/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-accentOrange to-softOrange" />
            <div className="relative">
              <p className="text-softOrange text-2xs uppercase tracking-widest font-semibold">Welcome back</p>
              <h2 className="font-display text-3xl md:text-4xl text-white mt-2">{user?.fullName || 'Admin'}</h2>
              <p className="text-white/60 mt-2 max-w-md text-sm text-balance">Here is what's happening across your store today. Track revenue, orders and customer activity at a glance.</p>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <MetricCard title="Total Sales" value={overview?.totalSales || 0} icon={DollarSign} color="emerald" prefix="$" />
            <MetricCard title="Revenue" value={overview?.revenue || 0} icon={TrendingUp} color="blue" prefix="$" />
            <MetricCard title="Monthly Sales" value={overview?.monthlySales || 0} icon={BarChart3} color="violet" prefix="$" />
            <MetricCard title="Customers" value={overview?.userCount || 0} icon={Users} color="pink" />
            <MetricCard title="Products" value={overview?.productCount || 0} icon={Boxes} color="orange" />
            <MetricCard title="Orders" value={overview?.ordersCount || 0} icon={ShoppingBag} color="cyan" />
            <MetricCard title="Projects" value={overview?.projectCount || 0} icon={Film} color="indigo" />
            <MetricCard title="Portfolio" value={overview?.portfolioCount || 0} icon={FolderKanban} color="amber" />
            <MetricCard title="Customers" value={analytics?.overview?.totalCustomers || overview?.userCount || 0} icon={Activity} color="blue" />
          </div>
        </>
      )}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="admin-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg text-textPrimary">Revenue Trend</h3>
                  <p className="text-2xs text-textSecondary/50">Last 30 days (live data)</p>
                </div>
                <span className="badge-success">Live</span>
              </div>
              <PremiumAreaChart data={(analytics?.revenue?.perDay || []).map((d) => d.revenue || 0)} color="#FF8A3D" />
            </div>
            <div className="admin-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg text-textPrimary">New Customers</h3>
                  <p className="text-2xs text-textSecondary/50">Last 30 days (live data)</p>
                </div>
                <span className="badge-neutral">Daily</span>
              </div>
              <PremiumBarChart data={(analytics?.customers?.perDay || []).map((d) => d.newCustomers || 0)} labels={(analytics?.customers?.perDay || []).map((_, i) => `D${i + 1}`)} />
            </div>
          </div>
      <RecentActivityFeed recent={[...projects, ...portfolio].slice(0, 5)} />
    </div>
  )

  const RecentActivityFeed = ({ recent }) => (
    <div className="admin-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-accentOrange/10 text-accentOrange flex items-center justify-center">
          <Activity size={18} />
        </div>
        <h3 className="font-display text-lg text-textPrimary">Recent Activity</h3>
      </div>
      <div className="space-y-3">
        {recent.length === 0 && <p className="text-sm text-textSecondary/50">No recent activity</p>}
        {recent.map((item, idx) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-lightBeige/60 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-softOrange/30 text-accentOrange flex items-center justify-center">
              <Layers size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-textPrimary truncate">{item.title}</p>
              <p className="text-2xs text-textSecondary/60">{item.category || 'Content'}</p>
            </div>
            <span className="text-2xs text-textSecondary/40">{new Date(item.createdAt).toLocaleDateString()}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const renderAnalytics = () => {
    const ov = analytics?.overview
    const rev = analytics?.revenue
    const cust = analytics?.customers
    const prod = analytics?.products
    const revenueSeries = (rev?.perDay || []).map((d) => d.revenue || 0)
    const customerSeries = (cust?.perDay || []).map((d) => d.newCustomers || 0)
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Revenue" value={ov?.totalRevenue || 0} icon={DollarSign} color="emerald" prefix="$" />
          <MetricCard title="Total Orders" value={ov?.totalOrders || 0} icon={ShoppingBag} color="orange" />
          <MetricCard title="Total Customers" value={ov?.totalCustomers || 0} icon={Users} color="violet" />
          <MetricCard title="Total Products" value={ov?.totalProducts || 0} icon={Boxes} color="blue" />
        </div>

        {!analytics && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="admin-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-textPrimary">Revenue Trend</h3>
              <span className="badge-success">Live</span>
            </div>
            <PremiumAreaChart data={revenueSeries} color="#FF8A3D" />
          </div>
          <div className="admin-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-textPrimary">Customer Growth</h3>
              <span className="badge-neutral">Daily</span>
            </div>
            <PremiumAreaChart data={customerSeries} color="#6B4E3D" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="admin-card">
            <h3 className="font-display text-lg text-textPrimary mb-3">Popular Products</h3>
            {prod?.topProducts?.length ? (
              <div className="space-y-2">
                {prod.topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center justify-between rounded-xl bg-lightBeige/50 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xs font-semibold text-textSecondary/50 w-5">{i + 1}</span>
                      <span className="text-sm font-medium text-textPrimary truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-2xs text-textSecondary">
                      <span>{p.units} sold</span>
                      <span className="font-semibold text-textPrimary">${(p.revenue || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-textSecondary/50">No sales data yet.</p>
            )}
          </div>
          <div className="admin-card">
            <h3 className="font-display text-lg text-textPrimary mb-3">Recent Activity</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-lightBeige/50 px-3 py-2">
                <span className="text-sm text-textPrimary">Avg. Order Value</span>
                <span className="text-sm font-semibold text-textPrimary">${(ov?.avgOrderValue || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-lightBeige/50 px-3 py-2">
                <span className="text-sm text-textPrimary">New Customers (month)</span>
                <span className="text-sm font-semibold text-textPrimary">{ov?.newCustomersThisMonth || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-lightBeige/50 px-3 py-2">
                <span className="text-sm text-textPrimary">Low Stock Items</span>
                <span className="text-sm font-semibold text-textPrimary">{ov?.lowStockCount || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-lightBeige/50 px-3 py-2">
                <span className="text-sm text-textPrimary">Out of Stock</span>
                <span className="text-sm font-semibold text-error">{ov?.outOfStockCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl border transition ${viewMode === 'grid' ? 'border-accentOrange bg-accentOrange/10 text-accentOrange' : 'border-border bg-white text-textSecondary hover:bg-lightBeige/50'}`}><Grid size={16} /></button>
        <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl border transition ${viewMode === 'list' ? 'border-accentOrange bg-accentOrange/10 text-accentOrange' : 'border-border bg-white text-textSecondary hover:bg-lightBeige/50'}`}><List size={16} /></button>
      </div>
      <form onSubmit={submitProject} className="admin-card-glass space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-textPrimary">{editingProject ? 'Edit' : 'Add'} Project</h2>
          {editingProject && <button type="button" onClick={() => setEditingProject(null)} className="text-xs text-textSecondary hover:text-accentOrange">Cancel</button>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <select value={resourceType} onChange={(e) => { setResourceType(e.target.value); setMediaPreview(setPreview(mediaFile, e.target.value === 'video' ? 'video' : 'image')) }} className="select">
            <option value="video">Video</option>
            <option value="image">Image</option>
          </select>
          <input value={projectForm.order} onChange={(e) => setProjectForm((p) => ({ ...p, order: Number(e.target.value) || 0 }))} type="number" className="input" placeholder="Order (optional)" />
        </div>
        <DropZone onFile={handleMediaChange} preview={mediaPreview} onClear={() => { setMediaFile(null); setMediaPreview(null) }} accept="video/*,image/*" kind={resourceType === 'video' ? 'video' : 'image'} />
        <div className="rounded-2xl border border-border bg-white p-4 space-y-4">
          <ImagePositionControls value={mediaSettings} onChange={setMediaSettings} />
          <ImagePositionPreview src={mediaPreview} settings={mediaSettings} />
        </div>
        <ProgressBar />
        <button className="btn-primary w-full" disabled={isUploading}>
          {isUploading ? 'Uploading…' : editingProject ? 'Update' : 'Upload'}
        </button>
      </form>
      <div className={viewMode === 'grid' ? 'grid gap-5 sm:grid-cols-2' : 'space-y-4'}>
        {projects.map((item) => (
          <article key={item._id} className={`overflow-hidden rounded-2xl border border-border bg-white shadow-card hover:shadow-lift transition-shadow ${viewMode === 'list' ? 'flex' : ''}`}>
            <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
              {item.videoUrl ? <video src={item.videoUrl} className="h-44 w-full object-cover" autoPlay muted /> : <PositionedImage src={item.coverImageUrl} alt={item.title} settings={item.mediaSettings} className="h-44 w-full" />}
            </div>
            <div className="p-4 flex-1">
              <h3 className="font-display text-xl text-textPrimary">{item.title}</h3>
              <p className="text-xs text-textSecondary/70 mt-1">{item.category}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditingProject(item); setProjectForm({ order: item.order || 0 }); setMediaSettings(normalizeMediaSettings(item.mediaSettings)) }} className="btn-secondary text-2xs flex items-center gap-1"><Edit size={12} /> Edit</button>
                <button onClick={() => setDeleteConfirm({ type: 'project', id: item._id })} className="btn-danger text-2xs flex items-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )

  const renderPortfolio = () => (
    <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
      <form onSubmit={submitPortfolio} className="admin-card-glass space-y-4 self-start">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-textPrimary">{editingPortfolio ? 'Edit' : 'Add'} Portfolio</h2>
          {editingPortfolio && <button type="button" onClick={() => setEditingPortfolio(null)} className="text-xs text-textSecondary hover:text-accentOrange">Cancel</button>}
        </div>
        <input value={portfolioForm.title} onChange={(e) => setPortfolioForm((p) => ({ ...p, title: e.target.value }))} className="input" placeholder="Title" required />
        <input value={portfolioForm.category} onChange={(e) => setPortfolioForm((p) => ({ ...p, category: e.target.value }))} className="input" placeholder="Category" required />
        <textarea value={portfolioForm.description} onChange={(e) => setPortfolioForm((p) => ({ ...p, description: e.target.value }))} className="textarea" placeholder="Description" />
        <input value={portfolioForm.order} onChange={(e) => setPortfolioForm((p) => ({ ...p, order: Number(e.target.value) || 0 }))} type="number" className="input" placeholder="Order" />
        <DropZone onFile={handleMediaChange} preview={mediaPreview} onClear={() => { setMediaFile(null); setMediaPreview(null) }} accept="image/*" kind="image" />
        <div className="rounded-2xl border border-border bg-white p-4 space-y-4">
          <ImagePositionControls value={mediaSettings} onChange={setMediaSettings} />
          <ImagePositionPreview src={mediaPreview} settings={mediaSettings} />
        </div>
        <ProgressBar />
        <button className="btn-primary w-full" disabled={isUploading}>
          {isUploading ? 'Uploading…' : editingPortfolio ? 'Update' : 'Upload'}
        </button>
      </form>
      <div className="grid gap-5 sm:grid-cols-2">
        {portfolio.map((item) => (
          <motion.article
            key={item._id}
            whileHover={{ y: -4 }}
            className="overflow-hidden rounded-2xl border border-border bg-white shadow-card group"
          >
            <div className="overflow-hidden">
              <PositionedImage src={item.imageUrl} alt={item.title} settings={item.mediaSettings} className="h-44 w-full transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="p-4">
              <p className="font-display text-xl text-textPrimary">{item.title}</p>
              <p className="text-xs uppercase tracking-widest text-accentOrange mt-1">{item.category}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditingPortfolio(item); setPortfolioForm({ title: item.title, category: item.category, description: item.description || '', order: item.order || 0 }); setMediaSettings(normalizeMediaSettings(item.mediaSettings)) }} className="btn-secondary text-2xs flex items-center gap-1"><Edit size={12} /> Edit</button>
                <button onClick={() => setDeleteConfirm({ type: 'portfolio', id: item._id })} className="btn-danger text-2xs flex items-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  )

  const renderVirtual = () => (
    <div className="space-y-6">
      <form onSubmit={submitVirtual} className="admin-card-glass space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-textPrimary">{editingVirtual ? 'Edit' : 'Add'} Virtual Design</h2>
          {editingVirtual && <button type="button" onClick={() => setEditingVirtual(null)} className="text-xs text-textSecondary hover:text-accentOrange">Cancel</button>}
        </div>
        <input value={virtualForm.title} onChange={(e) => setVirtualForm((v) => ({ ...v, title: e.target.value }))} className="input" placeholder="Title" required />
        <textarea value={virtualForm.description} onChange={(e) => setVirtualForm((v) => ({ ...v, description: e.target.value }))} className="textarea" placeholder="Description" required />
        <input value={virtualForm.services} onChange={(e) => setVirtualForm((v) => ({ ...v, services: e.target.value }))} className="input" placeholder="Services (comma separated)" />
        <input value={virtualForm.category} onChange={(e) => setVirtualForm((v) => ({ ...v, category: e.target.value }))} className="input" placeholder="Category" />
        <input value={virtualForm.tags} onChange={(e) => setVirtualForm((v) => ({ ...v, tags: e.target.value }))} className="input" placeholder="Tags (comma separated)" />
        <div className="grid grid-cols-2 gap-3">
          <input value={virtualForm.ctaPrimary} onChange={(e) => setVirtualForm((v) => ({ ...v, ctaPrimary: e.target.value }))} className="input" placeholder="Primary CTA" />
          <input value={virtualForm.ctaSecondary} onChange={(e) => setVirtualForm((v) => ({ ...v, ctaSecondary: e.target.value }))} className="input" placeholder="Secondary CTA" />
        </div>
        <DropZone onFile={handleVirtualVideoChange} preview={virtualVideoPreview} onClear={() => { setVirtualVideoFile(null); setVirtualVideoPreview(null) }} accept="video/*" kind="video" />
        <ProgressBar />
        <button className="btn-primary w-full" disabled={isUploading}>
          {isUploading ? 'Uploading…' : editingVirtual ? 'Update' : 'Upload'}
        </button>
      </form>
      <div className="grid gap-5 sm:grid-cols-2">
        {virtualDesigns.map((item) => (
          <article key={item._id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
            <div className="relative">
              {item.videoUrl && <video src={item.videoUrl} className="h-44 w-full object-cover" autoPlay muted />}
              {!item.videoUrl && <div className="h-44 w-full bg-lightBeige flex items-center justify-center text-textSecondary/40"><Video size={28} /></div>}
            </div>
            <div className="p-4">
              <h3 className="font-display text-xl text-textPrimary">{item.title}</h3>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditingVirtual(item); setVirtualForm({ title: item.title, description: item.description, services: item.services?.join(', ') || '', category: item.category || '', tags: item.tags?.join(', ') || '', ctaPrimary: item.ctaPrimary || 'Start Your Project', ctaSecondary: item.ctaSecondary || 'Learn More' }) }} className="btn-secondary text-2xs flex items-center gap-1"><Edit size={12} /> Edit</button>
                <button onClick={() => setDeleteConfirm({ type: 'virtual', id: item._id })} className="btn-danger text-2xs flex items-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )

  const renderProducts = () => (
    <div className="space-y-6">
      <form onSubmit={submitProduct} className="admin-card-glass">
        <h2 className="font-display text-2xl text-textPrimary mb-4">Add Product</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} className="input" placeholder="Name" required />
          <select value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} className="select" required>
            <option value="" disabled>Category</option>
            {PRODUCT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input value={productForm.sku} onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))} className="input" placeholder="SKU" required />
          <input value={productForm.stock} onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))} type="number" className="input" placeholder="Stock" required />
          <input value={productForm.vendor} onChange={(e) => setProductForm((p) => ({ ...p, vendor: e.target.value }))} className="input" placeholder="Vendor" />
          <div className="grid grid-cols-2 gap-3">
            <input value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} type="number" step="0.01" className="input" placeholder="Price" required />
            <input value={productForm.discountPrice} onChange={(e) => setProductForm((p) => ({ ...p, discountPrice: e.target.value }))} type="number" step="0.01" className="input" placeholder="Discount" />
          </div>
          <label className="flex items-center gap-2 text-sm text-textSecondary">
            <input type="checkbox" checked={productForm.isFeatured} onChange={(e) => setProductForm((p) => ({ ...p, isFeatured: e.target.checked }))} className="rounded border-border" />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-textSecondary">
            <input type="checkbox" checked={productForm.isPublished} onChange={(e) => setProductForm((p) => ({ ...p, isPublished: e.target.checked }))} className="rounded border-border" />
            Published
          </label>
        </div>
        <input value={productForm.tags} onChange={(e) => setProductForm((p) => ({ ...p, tags: e.target.value }))} className="input mt-4" placeholder="Tags (comma separated)" />
        <textarea value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} className="textarea mt-4" placeholder="Description" required />
        <DropZone onFile={handleProductImageChange} preview={productImagePreview} onClear={() => { setProductImageFile(null); setProductImagePreview(null) }} accept="image/*" kind="image" />
        <div className="rounded-2xl border border-border bg-white p-4 space-y-4">
          <ImagePositionControls value={mediaSettings} onChange={setMediaSettings} />
          <ImagePositionPreview src={productImagePreview} settings={mediaSettings} />
        </div>
        <ProgressBar />
        <button className="btn-primary w-full" disabled={isUploading}>
          {isUploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((item) => (
          <article key={item._id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-card hover:shadow-lift transition-shadow">
            <div className="relative h-44 bg-lightBeige overflow-hidden">
              <PositionedImage src={item.images?.[0]?.url} alt={item.name} settings={item.mediaSettings} className="h-full w-full" />
            </div>
            <div className="p-4">
              <p className="font-display text-xl text-textPrimary">{item.name}</p>
              <p className="text-xs text-textSecondary/70">{item.category}</p>
              <p className="mt-1 text-xs text-textSecondary/50">SKU: {item.sku}</p>

              {(item.colorVariants?.length > 0 || editingVariants === item._id) && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-2xs font-medium uppercase tracking-widest text-textSecondary/60 mb-2">Color Variants</p>
                  <div className="flex flex-wrap gap-2">
                  {item.colorVariants?.map((v) => (
                    <div key={v.colorName} className="flex items-center gap-2 rounded-full border border-border bg-lightBeige px-2 py-1">
                      {v.isDefault && <span title="Default variant" className="text-amber">★</span>}
                      {v.imageUrl && <img src={v.imageUrl} alt={v.colorName} className="h-5 w-5 rounded-full object-cover" />}
                      {!v.imageUrl && <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: v.colorHex || '#ccc' }} />}
                      <span className="text-2xs font-medium text-textPrimary">{v.colorName}</span>
                      {!v.isDefault && (
                        <button
                          onClick={async () => { try { await api.patch(`/products/${item._id}/variants/${encodeURIComponent(v.colorName)}/default`); fetchAll() } catch { /* ignore */ } }}
                          className="text-2xs font-medium text-accentOrange hover:underline"
                          title="Set as default variant"
                        >
                          Set default
                        </button>
                      )}
                      <button onClick={() => removeVariant(item._id, v.colorName)} className="text-textSecondary/40 hover:text-error"><X size={12} /></button>
                    </div>
                  ))}
                  </div>

                  {editingVariants === item._id && (
                    <div className="mt-3 space-y-2">
                      <input value={variantColorName} onChange={(e) => setVariantColorName(e.target.value)} className="input" placeholder="Color name (e.g. White)" />
                      <input value={variantColorHex} onChange={(e) => setVariantColorHex(e.target.value)} className="input" placeholder="Color hex (e.g. #FFFFFF)" />
                      <input value={variantSku} onChange={(e) => setVariantSku(e.target.value)} className="input" placeholder="SKU (e.g. PILLOW-RED)" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={variantStockQuantity} onChange={(e) => setVariantStockQuantity(Number(e.target.value))} type="number" className="input" placeholder="Stock" />
                        <input value={variantPriceOverride} onChange={(e) => setVariantPriceOverride(e.target.value)} type="number" step="0.01" className="input" placeholder="Price override" />
                      </div>
                      <input type="file" accept="image/*" onChange={handleVariantImageChange} className="w-full text-xs text-textSecondary" />
                      <label className="flex items-center gap-2 text-xs text-textSecondary">
                        <input type="checkbox" checked={variantSetDefault} onChange={(e) => setVariantSetDefault(e.target.checked)} className="rounded border-border" />
                        Set as default variant
                      </label>
                      {variantImagePreview && <img src={variantImagePreview} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => addVariant(item._id)} className="btn-accent flex-1 text-2xs">Save Variant</button>
                        <button type="button" onClick={() => { setEditingVariants(null); setVariantColorName(''); setVariantColorHex(''); setVariantSku(''); setVariantStockQuantity(0); setVariantPriceOverride(''); setVariantImageFile(null); setVariantImagePreview(null) }} className="btn-secondary text-2xs">Cancel</button>
                      </div>
                    </div>
                  )}
                  {editingVariants !== item._id && (
                    <button type="button" onClick={() => setEditingVariants(item._id)} className="mt-2 flex items-center gap-1 text-2xs font-medium uppercase tracking-widest text-accentOrange hover:text-softOrange">
                      <Plus size={12} /> Add Variant
                    </button>
                  )}
                </div>
              )}

              {item.colorVariants?.length === 0 && editingVariants !== item._id && (
                <button type="button" onClick={() => setEditingVariants(item._id)} className="mt-3 flex items-center gap-1 text-2xs font-medium uppercase tracking-widest text-accentOrange hover:text-softOrange">
                  <Plus size={12} /> Add Color Variant
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )

  const orderStatusClass = (status) => ({
    pending: 'bg-amber/10 text-amber',
    processing: 'bg-blue/10 text-blue',
    shipped: 'bg-indigo/10 text-indigo',
    delivered: 'bg-success/10 text-success',
    cancelled: 'bg-error/10 text-error',
  }[status] || 'bg-lightBeige text-textSecondary')

  const renderOrders = () => {
    const allOrders = orders || []
    const totals = analytics?.overview
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Orders" value={totals?.totalOrders || allOrders.length || 0} icon={ShoppingBag} color="orange" />
          <MetricCard title="Pending" value={allOrders.filter((o) => o.status === 'pending').length || 0} icon={Activity} color="amber" />
          <MetricCard title="Delivered" value={allOrders.filter((o) => o.status === 'delivered').length || 0} icon={Check} color="emerald" />
          <MetricCard title="Revenue" value={`$${((totals?.totalRevenue || 0)).toLocaleString()}`} icon={DollarSign} color="blue" />
        </div>
        <div className="admin-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-textPrimary">All Orders</h3>
            <span className="badge-success">{allOrders.length} total · live</span>
          </div>
          <div className="overflow-x-auto">
            {allOrders.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="No orders yet" desc="Orders placed on the storefront will appear here instantly." />
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th className="text-left">Order</th>
                    <th className="text-left">Customer</th>
                    <th className="text-left">Items</th>
                    <th className="text-left">Date</th>
                    <th className="text-left">Payment</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="font-medium">#{order._id.slice(-6).toUpperCase()}</td>
                      <td className="text-textSecondary">{order.customerName || '—'}</td>
                      <td className="text-textSecondary">{(order.items?.length || 0)}</td>
                      <td className="text-textSecondary">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge-${order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'refunded' ? 'warning' : 'neutral'}`}>
                          {order.paymentStatus || 'pending'}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-lg text-2xs capitalize ${orderStatusClass(order.status)}`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                      <td className="font-medium">${(order.total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderCustomers = () => {
    const filtered = users.filter((u) => u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Customers" value={users.filter((u) => u.role !== 'admin').length} icon={Users} color="blue" />
          <MetricCard title="Active" value={users.filter((u) => u.isActive).length} icon={Check} color="emerald" />
          <MetricCard title="Admins" value={users.filter((u) => u.role === 'admin').length} icon={Users} color="violet" />
          <MetricCard title="New This Month" value={analytics?.overview?.newCustomersThisMonth || 0} icon={TrendingUp} color="orange" />
        </div>
        <div className="admin-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary/50" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search customers..." className="input pl-10" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Role</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Registered</th>
                  <th className="text-left">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id}>
                    <td className="font-medium">{u.fullName}</td>
                    <td className="text-textSecondary">{u.email}</td>
                    <td><span className={`px-2 py-1 rounded-lg text-2xs ${u.role === 'admin' ? 'bg-accentOrange/10 text-accentOrange' : 'bg-lightBeige text-textSecondary'}`}>{u.role}</span></td>
                    <td><StatusBadge active={u.isActive} /></td>
                    <td className="text-textSecondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="text-textSecondary">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6}><EmptyState icon={Users} title="No customers found" desc="Try adjusting your search query." /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderTestimonials = () => <TestimonialsManager />

  const renderBlog = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-textPrimary">Blog Posts</h3>
          <p className="text-sm text-textSecondary mt-1">Manage your interior design articles and insights.</p>
        </div>
        <button className="btn-accent">New Post</button>
      </div>
      <div className="admin-card flex flex-col items-center text-center py-16">
        <div className="w-20 h-20 rounded-full bg-lightBeige flex items-center justify-center mb-4 text-textSecondary/30">
          <FileText size={36} />
        </div>
        <p className="font-display text-2xl text-textSecondary/60">Blog management coming soon</p>
        <p className="text-sm text-textSecondary/45 mt-2 max-w-sm">Create and publish articles to engage your audience.</p>
      </div>
    </div>
  )

  const renderMedia = () => {
    const imageCount = portfolio.length + (overview?.projectCount || 0) + (overview?.productCount || 0)
    const videoCount = virtualDesigns.length + projects.filter((p) => p.videoUrl).length
    const filtered = mediaItems.filter((m) => {
      const matchesFilter = mediaFilter === 'all' || m.type === mediaFilter || m.kind === mediaFilter
      const matchesSearch = !mediaSearch || m.title?.toLowerCase().includes(mediaSearch.toLowerCase()) || m.category?.toLowerCase().includes(mediaSearch.toLowerCase())
      return matchesFilter && matchesSearch
    })
    const toggleSelect = (id) => setSelectedMedia((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Images" value={imageCount} icon={ImageIcon} color="blue" />
          <MetricCard title="Videos" value={videoCount} icon={Video} color="violet" />
          <MetricCard title="Portfolio Items" value={portfolio.length} icon={FolderKanban} color="orange" />
          <MetricCard title="Projects" value={projects.length} icon={LayoutDashboard} color="emerald" />
        </div>

        <div className="admin-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div className="flex flex-wrap gap-2">
              {MEDIA_TABS.map((t) => (
                <button key={t.id} onClick={() => setMediaFilter(t.id)} className={`px-4 py-2 rounded-xl text-xs font-medium transition ${mediaFilter === t.id ? 'bg-accentOrange text-white shadow-glow' : 'bg-lightBeige text-textSecondary hover:bg-lightBeige/60'}`}>{t.label}</button>
              ))}
            </div>
            <div className="relative w-full lg:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary/50" />
              <input value={mediaSearch} onChange={(e) => setMediaSearch(e.target.value)} placeholder="Search media..." className="input pl-10" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No media found" desc="Try a different filter or upload new content from the Projects, Portfolio or Products tabs." />
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
              {filtered.map((item) => (
                <div key={item.id} className="relative mb-4 break-inside-avoid rounded-2xl overflow-hidden border border-border bg-white shadow-card group">
                  <button onClick={() => toggleSelect(item.id)} className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-lg border flex items-center justify-center transition ${selectedMedia.includes(item.id) ? 'bg-accentOrange border-accentOrange text-white' : 'bg-white/80 border-white text-transparent'}`}>
                    <Check size={14} />
                  </button>
                  {item.type === 'video' ? (
                    <video src={item.src} className="w-full object-cover" muted />
                  ) : (
                    <img src={item.src} alt={item.title} className="w-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-darkBrown/80 via-darkBrown/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="text-white">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <span className="text-2xs uppercase tracking-widest text-softOrange">{item.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedMedia.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-textSecondary">{selectedMedia.length} selected</p>
              <button onClick={() => setSelectedMedia([])} className="btn-secondary text-2xs">Clear selection</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSettings = () => (
    <div className="space-y-6 max-w-2xl">
      <form onSubmit={submitSettings} className="admin-card-glass space-y-4">
        <h2 className="font-display text-xl text-textPrimary">Website Settings</h2>
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-textSecondary/70 mb-1">Site Name</label>
          <input value={settingsForm.siteName} onChange={(e) => setSettingsForm((s) => ({ ...s, siteName: e.target.value }))} className="input" placeholder="HOK Interior Designs" />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-textSecondary/70 mb-1">Support Email</label>
          <input value={settingsForm.supportEmail} onChange={(e) => setSettingsForm((s) => ({ ...s, supportEmail: e.target.value }))} type="email" className="input" placeholder="info@hokinterior.com" />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-textSecondary/70 mb-1">Default Currency</label>
          <select value={settingsForm.currency} onChange={(e) => setSettingsForm((s) => ({ ...s, currency: e.target.value }))} className="select">
            <option value="USD">USD - US Dollar</option>
            <option value="KES">KES - Kenyan Shilling</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
          <div>
            <p className="text-sm font-medium text-textPrimary">Maintenance Mode</p>
            <p className="text-2xs text-textSecondary/60">Temporarily disable public storefront</p>
          </div>
          <button type="button" role="switch" aria-checked={settingsForm.maintenanceMode} onClick={() => setSettingsForm((s) => ({ ...s, maintenanceMode: !s.maintenanceMode }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settingsForm.maintenanceMode ? 'bg-accentOrange' : 'bg-border'}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${settingsForm.maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-textSecondary/70 mb-1">Shipping Policy</label>
          <textarea value={settingsForm.shippingPolicy} onChange={(e) => setSettingsForm((s) => ({ ...s, shippingPolicy: e.target.value }))} className="textarea" rows={3} placeholder="Enter shipping policy..." />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-textSecondary/70 mb-1">Return Policy</label>
          <textarea value={settingsForm.returnPolicy} onChange={(e) => setSettingsForm((s) => ({ ...s, returnPolicy: e.target.value }))} className="textarea" rows={3} placeholder="Enter return policy..." />
        </div>
        <button className="btn-primary w-full">Save Settings</button>
      </form>
    </div>
  )

  const renderAboutTab = () => {
    const handleAboutImageChange = (e) => {
      const f = e.target.files?.[0] || null
      setAboutImageFile(f)
      if (f && f.type?.startsWith('image/')) {
        setAboutImagePreview(URL.createObjectURL(f))
      } else {
        setAboutImagePreview(null)
      }
    }
    // Show the newly-selected preview if any, otherwise the saved image.
    const displayedImage = aboutImagePreview || about?.aboutImageUrl || null
    return (
      <form onSubmit={submitAbout} className="admin-card space-y-4 max-w-2xl">
        <h2 className="font-display text-2xl text-textPrimary">About Content</h2>
        {displayedImage && (
          <div className="relative inline-block">
            <img src={displayedImage} alt="About preview" className="h-40 w-full max-w-sm object-cover rounded-xl" />
            <button type="button" onClick={() => { setAboutImageFile(null); setAboutImagePreview(null) }} className="absolute -top-2 -right-2 rounded-full bg-darkBrown text-white p-1"><X size={14} /></button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-xl border border-border bg-lightBeige px-4 py-2 text-2xs font-medium uppercase tracking-widest text-textSecondary hover:bg-lightBeige/60 transition">
            {displayedImage ? 'Change Image' : 'Upload Image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleAboutImageChange} />
          </label>
          {aboutImageFile && <span className="text-2xs text-textSecondary/60">Selected: {aboutImageFile.name}</span>}
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 space-y-4">
          <ImagePositionControls value={mediaSettings} onChange={setMediaSettings} />
          <ImagePositionPreview src={displayedImage} settings={mediaSettings} />
        </div>
        <textarea value={aboutForm.story} onChange={(e) => setAboutForm((a) => ({ ...a, story: e.target.value }))} className="textarea" placeholder="Our Story" required />
        <textarea value={aboutForm.companyDescription} onChange={(e) => setAboutForm((a) => ({ ...a, companyDescription: e.target.value }))} className="textarea" placeholder="Company Description" />
        <textarea value={aboutForm.mission} onChange={(e) => setAboutForm((a) => ({ ...a, mission: e.target.value }))} className="textarea" placeholder="Mission" required />
        <textarea value={aboutForm.vision} onChange={(e) => setAboutForm((a) => ({ ...a, vision: e.target.value }))} className="textarea" placeholder="Vision" />
        <div className="grid grid-cols-2 gap-3">
          <input value={aboutForm.location} onChange={(e) => setAboutForm((a) => ({ ...a, location: e.target.value }))} className="input" placeholder="Location" />
          <input value={aboutForm.contactEmail} onChange={(e) => setAboutForm((a) => ({ ...a, contactEmail: e.target.value }))} className="input" placeholder="Contact Email" type="email" />
        </div>
        <ProgressBar />
        <button className="btn-primary" disabled={isUploading}>
          {isUploading ? 'Saving…' : 'Save About'}
        </button>
      </form>
    )
  }

  const renderChat = () => (
    <div className="space-y-4 max-w-3xl">
      {messages.length === 0 ? (
        <EmptyState icon={Mail} title="No messages yet" desc="Customer conversations will appear here." />
      ) : (
        <div className="grid gap-3">
          {messages.map((msg) => (
            <div key={msg._id} className="rounded-2xl border border-border bg-white p-4 shadow-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-textPrimary">{msg.name}</p>
                  <p className="text-sm text-textSecondary/70">{msg.email}</p>
                </div>
                <span className={`badge-${!msg.isRead ? 'warning' : 'neutral'}`}>{!msg.isRead ? 'New' : 'Read'}</span>
              </div>
              <p className="text-sm mt-2 text-textPrimary">{msg.subject}</p>
            </div>
          ))}
        </div>
      )}
      <div className="admin-card mt-4">
        <div className="flex items-center gap-2">
          <input className="input" placeholder="Type a reply..." />
          <button className="btn-accent"><Send size={16} /> Send</button>
        </div>
      </div>
    </div>
  )

  const Sidebar = () => (
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar-gradient text-white transition-all duration-300 ${sidebarOpen ? 'w-[280px]' : 'w-[80px]'} ${mobileSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="flex items-center gap-3 h-20 px-5 border-b border-white/10">
        <div className="w-11 h-11 rounded-2xl bg-accentOrange flex items-center justify-center flex-shrink-0 shadow-glow">
          <Sparkles size={20} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="text-3xs uppercase tracking-widest text-white/45">Admin Panel</p>
            <p className="text-base font-semibold whitespace-nowrap font-display text-white">HOK Studio</p>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
        {tabs.map((item, idx) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              onClick={() => { setActiveTab(item.id); setMobileSidebar(false) }}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </motion.button>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        {sidebarOpen ? (
          <div className="glass-dark rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accentOrange flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName || 'Admin'}</p>
              <p className="text-3xs text-white/50 truncate">{user?.email}</p>
            </div>
            <button onClick={() => logout?.()} className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button onClick={() => logout?.()} className="flex w-full items-center justify-center p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition" title="Logout">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  )

  const Topbar = () => (
    <header className="sticky top-4 z-30 mx-4 lg:mx-6">
      <div className="glass rounded-2xl px-5 h-16 flex items-center gap-4 shadow-card">
        <button onClick={() => setSidebarOpen((s) => !s)} className="hidden lg:flex p-2 rounded-xl hover:bg-lightBeige transition text-textPrimary">
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
        <button onClick={() => setMobileSidebar(true)} className="lg:hidden p-2 rounded-xl hover:bg-lightBeige transition text-textPrimary">
          <Menu size={18} />
        </button>
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary/50" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search…" className="w-full pl-10 pr-4 py-2.5 text-sm rounded-full border border-border bg-white/70 focus:ring-2 focus:ring-accentOrange/20 outline-none text-textPrimary placeholder:text-textSecondary/40" />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => { setShowNotif((s) => !s); if (!showNotif) markNotificationsRead() }}
              className="relative p-2.5 rounded-full hover:bg-lightBeige transition text-textSecondary"
              title="Order notifications"
            >
              <Bell size={18} />
              {unreadOrders > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-error text-white text-3xs flex items-center justify-center">
                  {unreadOrders > 99 ? '99+' : unreadOrders}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-lift border border-border z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="font-display text-sm text-textPrimary">Order Notifications</p>
                  <button onClick={() => setShowNotif(false)} className="text-textSecondary/50 hover:text-textPrimary"><X size={14} /></button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {orderNotifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-2xs text-textSecondary/60">No new orders yet.</p>
                  ) : (
                    orderNotifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 border-b border-border last:border-0">
                        <p className="text-sm font-medium text-textPrimary">{n.title}</p>
                        <p className="text-2xs text-textSecondary mt-0.5">
                          {n.customerName} · {n.orderNumber} · ${(n.total || 0).toLocaleString()}
                        </p>
                        <p className="text-3xs text-textSecondary/40 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="relative p-2.5 rounded-full hover:bg-lightBeige transition text-textSecondary">
            <Mail size={18} />
            {messages.length > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-error text-white text-3xs flex items-center justify-center">{messages.length}</span>}
          </button>
          <div className="flex items-center gap-2 pl-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accentOrange to-softOrange flex items-center justify-center text-white text-sm font-semibold">
              {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-textPrimary leading-tight">{user?.fullName || 'Admin'}</p>
              <p className="text-3xs text-textSecondary capitalize">{user?.role || 'admin'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )

  return (
    <div className="min-h-screen bg-primary">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-[80px]'}`}>
        <Topbar />
        <main className="p-4 md:p-8">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="font-display text-3xl md:text-4xl capitalize text-textPrimary">{tabs.find((t) => t.id === activeTab)?.label || activeTab}</h1>
            <p className="text-sm text-textSecondary mt-1">Manage your {activeTab.replace('-', ' ')}</p>
          </motion.div>

          <AnimatePresence>
            {notifToast && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="toast mb-5 toast-success flex items-center gap-2"
              >
                <Bell size={16} />
                <span className="flex-1">
                  <span className="font-semibold">{notifToast.title}</span> — {notifToast.customerName} ({notifToast.orderNumber})
                </span>
                <button onClick={() => setNotifToast(null)} className="opacity-60 hover:opacity-100"><X size={14} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`toast mb-5 ${status.includes('ERROR') ? 'toast-error' : 'toast-success'}`}
              >
                {status.includes('ERROR') ? <X size={16} /> : <Check size={16} />}
                <span className="flex-1">{status.replace(/^(SUCCESS|ERROR):\s*/, '')}</span>
                {status.includes('ERROR') && <span className="text-2xs opacity-70 hidden md:inline">{CLOUDINARY_HINT}</span>}
                <button onClick={() => setStatus('')} className="opacity-60 hover:opacity-100"><X size={14} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === 'general' && renderDashboard()}
              {activeTab === 'analytics' && renderAnalytics()}
              {activeTab === 'products' && renderProducts()}
              {activeTab === 'projects' && renderProjects()}
              {activeTab === 'portfolio' && renderPortfolio()}
              {activeTab === 'virtual' && renderVirtual()}
              {activeTab === 'chat' && renderChat()}
              {activeTab === 'orders' && renderOrders()}
              {activeTab === 'customers' && renderCustomers()}
              {activeTab === 'testimonials' && renderTestimonials()}
              {activeTab === 'blog' && renderBlog()}
              {activeTab === 'media' && renderMedia()}
              {activeTab === 'about' && renderAboutTab()}
              {activeTab === 'settings' && renderSettings()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {mobileSidebar && <div className="fixed inset-0 bg-darkBrown/40 z-30 lg:hidden" onClick={() => setMobileSidebar(false)} />}

      <AnimatePresence>
        {deleteConfirm.type && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content">
              <h3 className="font-display text-xl text-textPrimary mb-2">Confirm Delete</h3>
              <p className="text-sm text-textSecondary/70 mb-5">Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm({ type: null, id: null })} className="btn-secondary text-2xs">Cancel</button>
                <button
                  onClick={() => {
                    if (deleteConfirm.type === 'project') deleteProject(deleteConfirm.id)
                    else if (deleteConfirm.type === 'portfolio') deletePortfolio(deleteConfirm.id)
                    else if (deleteConfirm.type === 'virtual') deleteVirtual(deleteConfirm.id)
                  }}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ── Testimonials manager (FIX #3): module-scope so it is not re-created on every
// AdminPage render (which would remount it and reset its state on each poll).
// ── Testimonials manager (FIX #3): admin CRUD over client testimonials
// that are rendered in the public footer carousel. ──────────────────────
function TestimonialsManager() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [form, setForm] = useState({
    clientName: '', position: '', company: '', testimonial: '', rating: 5, displayOrder: 0, isActive: true,
  })
  const [status, setStatus] = useState('')

  const showToast = (message, type = 'success') => {
    setStatus(`${type === 'error' ? 'ERROR' : 'SUCCESS'}: ${message}`)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setStatus(''), 4000)
  }

  const refresh = () => {
    api.get('/admin/testimonials').then((r) => { setList(r.data || []); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    return () => {
      if (photoPreview && typeof photoPreview === 'string' && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const startEdit = (t) => {
    setEditing(t._id)
    setForm({
      clientName: t.clientName || '',
      position: t.position || '',
      company: t.company || '',
      testimonial: t.testimonial || '',
      rating: t.rating || 5,
      displayOrder: t.displayOrder || 0,
      isActive: t.isActive ?? true,
    })
    setPhotoPreview(t.photoUrl || null)
    setPhotoFile(null)
  }

  const resetForm = () => {
    setEditing(null)
    setForm({ clientName: '', position: '', company: '', testimonial: '', rating: 5, displayOrder: list.length, isActive: true })
    setPhotoFile(null); setPhotoPreview(null)
  }

  const onPhotoChange = (e) => {
    const f = e.target.files?.[0] || null
    setPhotoFile(f)
    if (f && f.type?.startsWith('image/')) setPhotoPreview(URL.createObjectURL(f))
    else setPhotoPreview(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      const payload = new FormData()
      Object.entries(form).forEach(([k, v]) => payload.append(k, String(v)))
      if (photoFile) payload.append('photo', photoFile)
      if (editing) await api.patch(`/admin/testimonials/${editing}`, payload)
      else await api.post('/admin/testimonials', payload)
      window.dispatchEvent(new CustomEvent('admin:data-changed', { detail: { type: 'testimonials-changed' } }))
      resetForm(); refresh(); showToast(editing ? 'Testimonial updated.' : 'Testimonial created.')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Save failed.', 'error')
    }
  }

  const remove = async (id) => {
    try {
      await api.delete(`/admin/testimonials/${id}`)
      window.dispatchEvent(new CustomEvent('admin:data-changed', { detail: { type: 'testimonials-changed' } }))
      refresh(); showToast('Testimonial deleted.')
    } catch (err) { showToast(err?.response?.data?.message || 'Delete failed.', 'error') }
  }

  const toggleActive = async (t) => {
    try {
      await api.patch(`/admin/testimonials/${t._id}`, { isActive: !t.isActive })
      window.dispatchEvent(new CustomEvent('admin:data-changed', { detail: { type: 'testimonials-changed' } }))
      refresh()
    } catch { /* ignore */ }
  }

  const move = async (index, dir) => {
    const next = [...list]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    try {
      await api.patch('/admin/testimonials/reorder', { order: next.map((t) => t._id) })
      window.dispatchEvent(new CustomEvent('admin:data-changed', { detail: { type: 'testimonials-changed' } }))
      refresh()
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      {status && (
        <div className={`toast ${status.includes('ERROR') ? 'toast-error' : 'toast-success'}`}>
          {status.replace(/^(SUCCESS|ERROR):\s*/, '')}
        </div>
      )}
      <form onSubmit={submit} className="admin-card-glass space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-textPrimary">{editing ? 'Edit' : 'Add'} Testimonial</h2>
          {editing && <button type="button" onClick={resetForm} className="text-xs text-textSecondary hover:text-accentOrange">Cancel</button>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} className="input" placeholder="Client Name" required />
          <input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} className="input" placeholder="Position / Role" />
          <input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} className="input" placeholder="Company" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-textSecondary">Rating</label>
            <select value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))} className="select flex-1">
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ★</option>)}
            </select>
          </div>
        </div>
        <textarea value={form.testimonial} onChange={(e) => setForm((f) => ({ ...f, testimonial: e.target.value }))} className="textarea" placeholder="Testimonial text" required rows={3} />
        <div className="flex items-center gap-4">
          <label className="cursor-pointer rounded-xl border border-border bg-lightBeige px-4 py-2 text-2xs font-medium uppercase tracking-widest text-textSecondary hover:bg-lightBeige/60 transition">
            {photoPreview ? 'Change Photo' : 'Upload Photo'}
            <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
          </label>
          {photoPreview && <img src={photoPreview} alt="preview" className="h-12 w-12 rounded-full object-cover" />}
          <label className="flex items-center gap-2 text-sm text-textSecondary">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded border-border" />
            Active (show in footer)
          </label>
        </div>
        <button className="btn-primary w-full" disabled={!form.clientName || !form.testimonial}>
          {editing ? 'Update' : 'Create'} Testimonial
        </button>
      </form>

      <div className="admin-card">
        <h3 className="font-display text-lg text-textPrimary mb-3">Testimonials ({list.length})</h3>
        {loading ? (
          <p className="text-sm text-textSecondary/50">Loading…</p>
        ) : list.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-display text-2xl text-textSecondary/60">No testimonials yet</p>
            <p className="mt-1 text-sm text-textSecondary/45">Add client testimonials to feature in the footer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((t, i) => (
              <div key={t._id} className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4">
                {t.photoUrl ? <img src={t.photoUrl} alt={t.clientName} className="h-12 w-12 rounded-full object-cover flex-shrink-0" /> : <div className="h-12 w-12 rounded-full bg-lightBeige flex items-center justify-center text-textSecondary flex-shrink-0"><Users size={18} /></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-textPrimary">{t.clientName}</p>
                    <span className="text-2xs text-amber">{'★'.repeat(t.rating || 0)}</span>
                    <span className={`badge-${t.isActive ? 'success' : 'neutral'}`}>{t.isActive ? 'Active' : 'Hidden'}</span>
                  </div>
                  <p className="text-2xs text-textSecondary">{[t.position, t.company].filter(Boolean).join(' · ')}</p>
                  <p className="text-sm text-textSecondary/80 mt-1 line-clamp-2">{t.testimonial}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1">
                    <button onClick={() => move(i, -1)} className="p-1 rounded-lg hover:bg-lightBeige" aria-label="Move up"><ChevronLeft size={14} className="rotate-90" /></button>
                    <button onClick={() => move(i, 1)} className="p-1 rounded-lg hover:bg-lightBeige" aria-label="Move down"><ChevronRight size={14} className="rotate-90" /></button>
                  </div>
                  <button onClick={() => toggleActive(t)} className="text-2xs text-accentOrange hover:underline">{t.isActive ? 'Hide' : 'Show'}</button>
                  <button onClick={() => startEdit(t)} className="text-2xs text-textSecondary hover:text-accentOrange flex items-center gap-1"><Edit size={11} /> Edit</button>
                  <button onClick={() => remove(t._id)} className="text-2xs text-error hover:underline flex items-center gap-1"><Trash2 size={11} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



export { AdminPage }
