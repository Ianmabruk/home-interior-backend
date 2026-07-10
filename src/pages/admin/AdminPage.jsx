import { BarChart3, Boxes, Film, FolderKanban, Info, Mail, Sparkles, LayoutDashboard, ShoppingBag, TrendingUp, Users, FileText, Settings, Search, Filter, Grid, List, Check, Trash2, Edit, Eye, EyeOff, Bell, ChevronLeft, ChevronRight, UploadCloud, X, Plus, Menu, LogOut, Activity, DollarSign, Layers, MessageSquare } from 'lucide-react'
import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

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

const PROJECT_CATEGORIES = [
  'Residential', 'Commercial', 'Renovation', 'New Build', 'Interior',
]

const CLOUDINARY_HINT = 'Images upload to Cloudinary. If uploads fail, verify CLOUDINARY_API_KEY / API_SECRET have upload permission in your Cloudinary dashboard.'

function AdminPage() {
  const { user, logout } = useAuth()
  const [overview, setOverview] = useState(null)
  const [projects, setProjects] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [products, setProducts] = useState([])
  const [messages, setMessages] = useState([])
  const [virtualDesigns, setVirtualDesigns] = useState([])
  const [users, setUsers] = useState([])
  const [analyticsData, setAnalyticsData] = useState([])
  const [activeTab, setActiveTab] = useState('general')
  const [status, setStatus] = useState('')

  const [projectForm, setProjectForm] = useState({ title: '', description: '', category: 'Residential', order: 0 })
  const [portfolioForm, setPortfolioForm] = useState({ title: '', category: '' })
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', discountPrice: '', category: '', stock: '', sku: '' })
  const [virtualForm, setVirtualForm] = useState({ title: '', description: '', services: '', videoUrl: '' })
  const [settingsForm, setSettingsForm] = useState({ siteName: '', supportEmail: '', currency: 'USD' })
  const [aboutForm, setAboutForm] = useState({ story: '', mission: '', vision: '' })
  const [aboutImageFile, setAboutImageFile] = useState(null)
  const [aboutImagePreview, setAboutImagePreview] = useState(null)

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
  const [variantStockQuantity, setVariantStockQuantity] = useState(0)
  const [variantPriceOverride, setVariantPriceOverride] = useState('')
  const [variantImageFile, setVariantImageFile] = useState(null)
  const [variantImagePreview, setVariantImagePreview] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ type: null, id: null })

  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchAll()
  }, [])

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
    ])
      .then(([overviewRes, projectsRes, portfolioRes, productsRes, messagesRes, virtualRes, usersRes, analyticsRes]) => {
        if (overviewRes.data) setOverview(overviewRes.data)
        setProjects(projectsRes.data || [])
        setPortfolio(portfolioRes.data || [])
        setProducts(productsRes.data?.items || [])
        setMessages(messagesRes.data || [])
        setVirtualDesigns(virtualRes.data || [])
        setUsers(usersRes.data || [])
        setAnalyticsData(analyticsRes.data || [])
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

  const submitProject = async (event) => {
    event.preventDefault()
    if (!mediaFile && !editingProject) { setFailure(null, 'Please choose a file to upload.'); return }
    try {
      setIsUploading(true); setUploadProgress(0)
      const payload = new FormData()
      payload.append('title', projectForm.title)
      payload.append('description', projectForm.description)
      payload.append('category', projectForm.category)
      payload.append('order', String(projectForm.order || 0))
      payload.append('resourceType', resourceType)
      if (mediaFile) payload.append('media', mediaFile)
      if (editingProject) {
        await api.patch(`/content/projects/${editingProject._id}`, payload, { onUploadProgress })
        setEditingProject(null)
      } else {
        await api.post('/content/projects', payload, { onUploadProgress })
      }
      setProjectForm({ title: '', description: '', category: 'Residential', order: 0 })
      setMediaFile(null); setMediaPreview(null)
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
      if (mediaFile) payload.append('media', mediaFile)
      if (editingPortfolio) {
        await api.patch(`/content/portfolio/${editingPortfolio._id}`, payload, { onUploadProgress })
        setEditingPortfolio(null)
      } else {
        await api.post('/content/portfolio', payload, { onUploadProgress })
      }
      setPortfolioForm({ title: '', category: '' })
      setMediaFile(null); setMediaPreview(null)
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
      Object.entries(productForm).forEach(([key, value]) => payload.append(key, value))
      if (productImageFile) payload.append('images', productImageFile)
      await api.post('/products', payload, { onUploadProgress })
      setProductForm({ name: '', description: '', price: '', discountPrice: '', category: '', stock: '', sku: '' })
      setProductImageFile(null); setProductImagePreview(null)
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
      payload.append('stockQuantity', String(variantStockQuantity || 0))
      if (variantPriceOverride !== '') payload.append('priceOverride', String(variantPriceOverride))
      if (variantImageFile) payload.append('image', variantImageFile)
      await api.post(`/products/${productId}/variants`, payload, { onUploadProgress })
      setVariantColorName(''); setVariantColorHex(''); setVariantStockQuantity(0); setVariantPriceOverride('')
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
      if (virtualVideoFile) payload.append('media', virtualVideoFile)
      if (editingVirtual) {
        await api.patch(`/content/virtual-design/${editingVirtual._id}`, payload, { onUploadProgress })
        setEditingVirtual(null)
      } else {
        await api.post('/content/virtual-design', payload, { onUploadProgress })
      }
      setVirtualForm({ title: '', description: '', services: '', videoUrl: '' })
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
      if (aboutImageFile) payload.append('media', aboutImageFile)
      await api.put('/content/about', payload, { onUploadProgress })
      window.dispatchEvent(new CustomEvent('admin:data-changed', { detail: { type: 'about-changed' } }))
      fetchAll(); resetProgress(); setSuccess('About content saved.')
    } catch (error) { resetProgress(); setFailure(error, 'About save failed.') }
  }

  const handleUserAction = async (userId, action) => {
    try {
      await api.patch(`/admin/users/${userId}/${action}`); fetchAll(); setSuccess(`User ${action} successfully.`)
    } catch (error) { setFailure(error, `Failed to ${action} user.`) }
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

  // ============ CHART HELPERS (lightweight SVG) ============
  const MiniAreaChart = ({ data, color = '#8B7355' }) => {
    if (!data?.length) return <div className="h-40 flex items-center justify-center text-ink/30 text-sm">No analytics data</div>
    const w = 320, h = 140, pad = 8
    const max = Math.max(...data, 1)
    const step = (w - pad * 2) / Math.max(data.length - 1, 1)
    const pts = data.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)])
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#g1)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  const MiniBarChart = ({ data, labels }) => {
    if (!data?.length) return <div className="h-40 flex items-center justify-center text-ink/30 text-sm">No analytics data</div>
    const max = Math.max(...data, 1)
    return (
      <div className="flex items-end justify-between gap-3 h-40 px-2">
        {data.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
            <span className="text-2xs text-ink/50 mb-1 opacity-0 group-hover:opacity-100 transition">{v}</span>
            <div className="w-full rounded-t-md bg-gradient-to-t from-warm/30 to-orange/80 transition-all" style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />
            <span className="text-2xs text-ink/40 mt-2 truncate w-full text-center">{labels?.[i] || i + 1}</span>
          </div>
        ))}
      </div>
    )
  }

  const getColorClass = (color) => ({
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    orange: 'bg-orange-50 text-orange-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    pink: 'bg-pink-50 text-pink-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    amber: 'bg-amber-50 text-amber-700',
  }[color] || 'bg-linen text-ink')

  const MetricCard = ({ title, value, icon: Icon, color, hint, prefix, suffix }) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl border border-borderBeige bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <p className="text-2xs font-semibold uppercase tracking-widest text-inkSecondary/60">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorClass(color)}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-inkPrimary">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
      </p>
      {hint && <p className="mt-1 text-2xs text-inkSecondary/40">{hint}</p>}
    </motion.div>
  )

  const StatusBadge = ({ active }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )

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

  // ============ RENDER SECTIONS ============
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="Total Sales" value={overview?.totalSales || 0} icon={DollarSign} color="emerald" prefix="$" />
        <MetricCard title="Revenue" value={overview?.revenue || 0} icon={TrendingUp} color="blue" prefix="$" />
        <MetricCard title="Monthly Sales" value={overview?.monthlySales || 0} icon={BarChart3} color="violet" prefix="$" />
        <MetricCard title="Customers" value={overview?.userCount || 0} icon={Users} color="pink" />
        <MetricCard title="Products" value={overview?.productCount || 0} icon={Boxes} color="orange" />
        <MetricCard title="Orders" value={overview?.ordersCount || 0} icon={ShoppingBag} color="cyan" />
        <MetricCard title="Projects" value={overview?.projectCount || 0} icon={Film} color="indigo" />
        <MetricCard title="Portfolio" value={overview?.portfolioCount || 0} icon={FolderKanban} color="amber" />
        <MetricCard title="Visits" value={overview?.visits || 0} icon={Activity} color="blue" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-borderBeige bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg text-inkPrimary mb-1">Revenue Trend</h3>
          <p className="text-2xs text-inkSecondary/40 mb-3">Monthly performance</p>
          <MiniAreaChart data={analyticsData.map((d) => d.revenue || 0)} color="#8B5E3C" />
        </div>
        <div className="rounded-2xl border border-borderBeige bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg text-inkPrimary mb-1">Visitors</h3>
          <p className="text-2xs text-inkSecondary/40 mb-3">Monthly visits</p>
          <MiniBarChart data={analyticsData.map((d) => d.visits || 0)} labels={analyticsData.map((_, i) => `M${i + 1}`)} />
        </div>
      </div>
      <RecentActivityFeed recent={[...projects, ...portfolio].slice(0, 5)} />
    </div>
  )

  const RecentActivityFeed = ({ recent }) => (
    <div className="rounded-3xl border border-sand/60 bg-white/70 backdrop-blur-sm p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-orange" />
        <h3 className="font-display text-lg text-ink">Recent Activity</h3>
      </div>
      <div className="space-y-3">
        {recent.length === 0 && <p className="text-sm text-ink/40">No recent activity</p>}
        {recent.map((item) => (
          <div key={item._id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-linen transition">
            <div className="w-9 h-9 rounded-xl bg-orange/10 text-orange flex items-center justify-center">
              <Layers size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{item.title}</p>
              <p className="text-2xs text-ink/40">{item.category || 'Content'}</p>
            </div>
            <span className="text-2xs text-ink/30">{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Visitors" value={analyticsData.reduce((s, d) => s + (d.visits || 0), 0)} icon={Eye} color="blue" />
        <MetricCard title="Total Revenue" value={analyticsData.reduce((s, d) => s + (d.revenue || 0), 0)} icon={DollarSign} color="emerald" prefix="$" />
        <MetricCard title="New Users" value={analyticsData.reduce((s, d) => s + (d.newUsers || 0), 0)} icon={Users} color="violet" />
        <MetricCard title="Orders" value={analyticsData.reduce((s, d) => s + (d.orders || 0), 0)} icon={ShoppingBag} color="orange" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-borderBeige bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg text-inkPrimary mb-3">Visitor Trends</h3>
          <MiniAreaChart data={analyticsData.map((d) => d.visits || 0)} color="#8B5E3C" />
        </div>
        <div className="rounded-2xl border border-borderBeige bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg text-inkPrimary mb-3">Revenue</h3>
          <MiniAreaChart data={analyticsData.map((d) => d.revenue || 0)} color="#F58A3C" />
        </div>
      </div>
    </div>
  )

  const renderUserManagement = () => {
    const filtered = users.filter(u => u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-sand bg-white focus:ring-2 focus:ring-orange/30 outline-none" />
          </div>
          <button className="px-4 py-2.5 text-xs uppercase tracking-widest border border-sand rounded-xl hover:bg-linen transition flex items-center gap-2"><Filter size={14} /> Filter</button>
        </div>
        <div className="rounded-2xl border border-sand/60 bg-white overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-linen border-b border-sand">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-ink/60">Name</th>
                <th className="text-left px-4 py-3 font-medium text-ink/60">Email</th>
                <th className="text-left px-4 py-3 font-medium text-ink/60">Role</th>
                <th className="text-left px-4 py-3 font-medium text-ink/60">Status</th>
                <th className="text-left px-4 py-3 font-medium text-ink/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-b border-sand last:border-0 hover:bg-linen transition">
                  <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                  <td className="px-4 py-3 text-ink/60">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-2xs ${u.role === 'admin' ? 'bg-orange/10 text-orange' : 'bg-linen text-ink/60'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge active={u.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded-lg border border-sand hover:bg-white transition"><Eye size={14} /></button>
                      <button onClick={() => handleUserAction(u._id, u.isActive ? 'suspend' : 'activate')} className="p-1.5 rounded-lg border border-sand hover:bg-white transition">
                        {u.isActive ? <EyeOff size={14} /> : <Check size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
           </table>
          </div>
        </div>
      </div>
    )
  }

  const DropZone = ({ onFile, preview, onClear, accept, kind }) => (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile({ target: { files: [f] } }) }}
      className="relative border-2 border-dashed border-sand rounded-2xl bg-linen/50 p-6 text-center hover:border-orange/50 transition cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
    >
      <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={onFile} />
      {preview ? (
        <div className="relative">
          {kind === 'video' ? (
            <video src={preview} className="h-40 w-full object-cover rounded-xl" muted />
          ) : (
            <img src={preview} alt="preview" className="h-40 w-full object-cover rounded-xl" />
          )}
          <button type="button" onClick={(e) => { e.stopPropagation(); onClear() }} className="absolute top-2 right-2 bg-ink/80 text-white p-1.5 rounded-full hover:bg-ink"><X size={14} /></button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4">
          <UploadCloud size={28} className="text-orange" />
          <p className="text-sm text-ink/60">Drag & drop or <span className="text-orange font-medium">browse</span></p>
          <p className="text-2xs text-ink/40">PNG, JPG, WEBP up to 10MB</p>
        </div>
      )}
    </div>
  )

  const ProgressBar = () => isUploading && (
    <div className="mt-3">
      <div className="h-2 w-full rounded-full bg-linen overflow-hidden">
        <div className="h-full bg-gradient-to-r from-orange to-warm transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
      </div>
      <p className="text-2xs text-ink/40 mt-1">Uploading… {uploadProgress}%</p>
    </div>
  )

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg border ${viewMode === 'grid' ? 'border-ink bg-ink text-white' : 'border-sand hover:bg-linen'}`}><Grid size={16} /></button>
        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg border ${viewMode === 'list' ? 'border-ink bg-ink text-white' : 'border-sand hover:bg-linen'}`}><List size={16} /></button>
      </div>
      <form onSubmit={submitProject} className="space-y-4 rounded-3xl border border-sand/60 bg-white/70 backdrop-blur-sm p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{editingProject ? 'Edit' : 'Add'} Project</h2>
          {editingProject && <button type="button" onClick={() => setEditingProject(null)} className="text-xs text-ink/50">Cancel</button>}
        </div>
        <input value={projectForm.title} onChange={(e) => setProjectForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30 outline-none" placeholder="Title" required />
        <textarea value={projectForm.description} onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))} className="h-24 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30 outline-none" placeholder="Description" required />
        <div className="grid sm:grid-cols-2 gap-3">
          <select value={projectForm.category} onChange={(e) => setProjectForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none">
            {PROJECT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={resourceType} onChange={(e) => { setResourceType(e.target.value); setMediaPreview(setPreview(mediaFile, e.target.value === 'video' ? 'video' : 'image')) }} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none">
            <option value="video">Video</option>
            <option value="image">Image</option>
          </select>
        </div>
        <DropZone onFile={handleMediaChange} preview={mediaPreview} onClear={() => { setMediaFile(null); setMediaPreview(null) }} accept="video/*,image/*" kind={resourceType === 'video' ? 'video' : 'image'} />
        <ProgressBar />
        <button className="w-full rounded-xl bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition disabled:opacity-50" disabled={isUploading}>
          {isUploading ? 'Uploading…' : editingProject ? 'Update' : 'Upload'}
        </button>
      </form>
      <div className={viewMode === 'grid' ? 'grid gap-5 sm:grid-cols-2' : 'space-y-4'}>
        {projects.map((item) => (
          <article key={item._id} className={`overflow-hidden rounded-2xl border border-sand/60 bg-white shadow-card ${viewMode === 'list' ? 'flex' : ''}`}>
            <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
              {item.videoUrl ? <video src={item.videoUrl} className="h-44 w-full object-cover" autoPlay muted /> : <img src={item.coverImageUrl} alt={item.title} className="h-44 w-full object-cover" />}
            </div>
            <div className="p-4 flex-1">
              <h3 className="font-display text-xl text-ink">{item.title}</h3>
              <p className="text-xs text-ink/50 mt-1">{item.category}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditingProject(item); setProjectForm({ title: item.title, description: item.description, category: item.category || 'Residential', order: item.order || 0 }) }} className="text-xs px-3 py-1.5 rounded-lg border border-sand hover:bg-linen transition flex items-center gap-1"><Edit size={12} /> Edit</button>
                <button onClick={() => setDeleteConfirm({ type: 'project', id: item._id })} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )

  const renderPortfolio = () => (
    <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
      <form onSubmit={submitPortfolio} className="space-y-4 rounded-3xl border border-sand/60 bg-white/70 backdrop-blur-sm p-6 shadow-card self-start">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">{editingPortfolio ? 'Edit' : 'Add'} Portfolio</h2>
          {editingPortfolio && <button type="button" onClick={() => setEditingPortfolio(null)} className="text-xs text-ink/50">Cancel</button>}
        </div>
        <input value={portfolioForm.title} onChange={(e) => setPortfolioForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30 outline-none" placeholder="Title" required />
        <input value={portfolioForm.category} onChange={(e) => setPortfolioForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30 outline-none" placeholder="Category" required />
        <DropZone onFile={handleMediaChange} preview={mediaPreview} onClear={() => { setMediaFile(null); setMediaPreview(null) }} accept="image/*" kind="image" />
        <ProgressBar />
        <button className="w-full rounded-xl bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition disabled:opacity-50" disabled={isUploading}>
          {isUploading ? 'Uploading…' : editingPortfolio ? 'Update' : 'Upload'}
        </button>
      </form>
      <div className="grid gap-5 sm:grid-cols-2">
        {portfolio.map((item) => (
          <article key={item._id} className="overflow-hidden rounded-2xl border border-sand/60 bg-white shadow-card group">
            <div className="overflow-hidden">
              <img src={item.imageUrl} alt={item.title} className="h-44 w-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div className="p-4">
              <p className="font-display text-xl text-ink">{item.title}</p>
              <p className="text-xs uppercase tracking-widest text-orange mt-1">{item.category}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditingPortfolio(item); setPortfolioForm({ title: item.title, category: item.category }) }} className="text-xs px-3 py-1.5 rounded-lg border border-sand hover:bg-linen transition flex items-center gap-1"><Edit size={12} /> Edit</button>
                <button onClick={() => setDeleteConfirm({ type: 'portfolio', id: item._id })} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )

  const renderVirtual = () => (
    <div className="space-y-6">
      <form onSubmit={submitVirtual} className="space-y-4 rounded-3xl border border-sand/60 bg-white/70 backdrop-blur-sm p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{editingVirtual ? 'Edit' : 'Add'} Virtual Design</h2>
          {editingVirtual && <button type="button" onClick={() => setEditingVirtual(null)} className="text-xs text-ink/50">Cancel</button>}
        </div>
        <input value={virtualForm.title} onChange={(e) => setVirtualForm((v) => ({ ...v, title: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30 outline-none" placeholder="Title" required />
        <textarea value={virtualForm.description} onChange={(e) => setVirtualForm((v) => ({ ...v, description: e.target.value }))} className="h-24 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30 outline-none" placeholder="Description" required />
        <input value={virtualForm.services} onChange={(e) => setVirtualForm((v) => ({ ...v, services: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30 outline-none" placeholder="Services (comma separated)" />
        <DropZone onFile={handleVirtualVideoChange} preview={virtualVideoPreview} onClear={() => { setVirtualVideoFile(null); setVirtualVideoPreview(null) }} accept="video/*" kind="video" />
        <ProgressBar />
        <button className="w-full rounded-xl bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition disabled:opacity-50" disabled={isUploading}>
          {isUploading ? 'Uploading…' : editingVirtual ? 'Update' : 'Upload'}
        </button>
      </form>
      <div className="grid gap-5 sm:grid-cols-2">
        {virtualDesigns.map((item) => (
          <article key={item._id} className="overflow-hidden rounded-2xl border border-sand/60 bg-white shadow-card">
            {item.videoUrl && <video src={item.videoUrl} className="h-44 w-full object-cover" autoPlay muted />}
            <div className="p-4">
              <h3 className="font-display text-xl text-ink">{item.title}</h3>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditingVirtual(item); setVirtualForm({ title: item.title, description: item.description, services: item.services?.join(', ') || '' }) }} className="text-xs px-3 py-1.5 rounded-lg border border-sand hover:bg-linen transition flex items-center gap-1"><Edit size={12} /> Edit</button>
                <button onClick={() => setDeleteConfirm({ type: 'virtual', id: item._id })} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )

  const renderProducts = () => (
    <div className="space-y-6">
      <form onSubmit={submitProduct} className="rounded-3xl border border-sand/60 bg-white/70 backdrop-blur-sm p-6 shadow-card">
        <h2 className="font-display text-2xl text-ink mb-4">Add Product</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30 outline-none" placeholder="Name" required />
          <select value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" required>
            <option value="" disabled>Category</option>
            {PRODUCT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input value={productForm.sku} onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" placeholder="SKU" required />
          <input value={productForm.stock} onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))} type="number" className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" placeholder="Stock" required />
          <div className="grid grid-cols-2 gap-3">
            <input value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} type="number" step="0.01" className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" placeholder="Price" required />
            <input value={productForm.discountPrice} onChange={(e) => setProductForm((p) => ({ ...p, discountPrice: e.target.value }))} type="number" step="0.01" className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" placeholder="Discount" />
          </div>
        </div>
        <textarea value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} className="mt-3 h-24 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30 outline-none" placeholder="Description" required />
        <DropZone onFile={handleProductImageChange} preview={productImagePreview} onClear={() => { setProductImageFile(null); setProductImagePreview(null) }} accept="image/*" kind="image" />
        <ProgressBar />
        <button className="w-full rounded-xl bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition disabled:opacity-50" disabled={isUploading}>
          {isUploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((item) => (
          <article key={item._id} className="overflow-hidden rounded-2xl border border-sand/60 bg-white shadow-card hover:shadow-lift transition-shadow">
            <div className="relative h-44 bg-linen">
              <img src={item.images?.[0]?.url} alt={item.name} className="h-full w-full object-contain" />
            </div>
            <div className="p-4">
              <p className="font-display text-xl text-ink">{item.name}</p>
              <p className="text-xs text-ink/50">{item.category}</p>
              <p className="mt-1 text-xs text-ink/40">SKU: {item.sku}</p>

              {(item.colorVariants?.length > 0 || editingVariants === item._id) && (
                <div className="mt-3 border-t border-sand pt-3">
                  <p className="text-2xs font-medium uppercase tracking-widest text-ink/50 mb-2">Color Variants</p>
                  <div className="flex flex-wrap gap-2">
                    {item.colorVariants?.map((v) => (
                      <div key={v.colorName} className="flex items-center gap-2 rounded-full border border-sand bg-linen px-2 py-1">
                        {v.imageUrl && <img src={v.imageUrl} alt={v.colorName} className="h-5 w-5 rounded-full object-cover" />}
                        {!v.imageUrl && <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: v.colorHex || '#ccc' }} />}
                        <span className="text-2xs font-medium text-ink">{v.colorName}</span>
                        <button onClick={() => removeVariant(item._id, v.colorName)} className="text-ink/30 hover:text-red-600"><X size={12} /></button>
                      </div>
                    ))}
                  </div>

                  {editingVariants === item._id && (
                    <div className="mt-3 space-y-2">
                      <input value={variantColorName} onChange={(e) => setVariantColorName(e.target.value)} className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs outline-none" placeholder="Color name (e.g. White)" />
                      <input value={variantColorHex} onChange={(e) => setVariantColorHex(e.target.value)} className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs outline-none" placeholder="Color hex (e.g. #FFFFFF)" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={variantStockQuantity} onChange={(e) => setVariantStockQuantity(Number(e.target.value))} type="number" className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs outline-none" placeholder="Stock" />
                        <input value={variantPriceOverride} onChange={(e) => setVariantPriceOverride(e.target.value)} type="number" step="0.01" className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-xs outline-none" placeholder="Price override" />
                      </div>
                      <input type="file" accept="image/*" onChange={handleVariantImageChange} className="w-full text-xs text-ink/60" />
                      {variantImagePreview && <img src={variantImagePreview} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => addVariant(item._id)} className="flex-1 rounded-lg bg-ink px-3 py-1.5 text-2xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition">Save Variant</button>
                        <button type="button" onClick={() => { setEditingVariants(null); setVariantColorName(''); setVariantColorHex(''); setVariantStockQuantity(0); setVariantPriceOverride(''); setVariantImageFile(null); setVariantImagePreview(null) }} className="rounded-lg border border-sand px-3 py-1.5 text-2xs text-ink/60 hover:bg-linen transition">Cancel</button>
                      </div>
                    </div>
                  )}
                  {editingVariants !== item._id && (
                    <button type="button" onClick={() => setEditingVariants(item._id)} className="mt-2 flex items-center gap-1 text-2xs font-medium uppercase tracking-widest text-orange hover:text-orange/80">
                      <Plus size={12} /> Add Variant
                    </button>
                  )}
                </div>
              )}

              {item.colorVariants?.length === 0 && editingVariants !== item._id && (
                <button type="button" onClick={() => setEditingVariants(item._id)} className="mt-3 flex items-center gap-1 text-2xs font-medium uppercase tracking-widest text-orange hover:text-orange/80">
                  <Plus size={12} /> Add Color Variant
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )

  const renderOrders = () => {
    const allOrders = overview?.recentOrders || []
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Orders" value={overview?.ordersCount || 0} icon={ShoppingBag} color="orange" />
          <MetricCard title="Pending" value={allOrders.filter((o) => o.status === 'pending').length || 0} icon={Activity} color="amber" />
          <MetricCard title="Completed" value={allOrders.filter((o) => o.status === 'delivered').length || 0} icon={Check} color="emerald" />
          <MetricCard title="Revenue" value={`$${(overview?.totalSales || 0).toLocaleString()}`} icon={DollarSign} color="blue" />
        </div>
        <div className="rounded-2xl border border-borderBeige bg-white p-5 shadow-sm">
          <h3 className="font-display text-xl text-inkPrimary mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borderBeige">
                  <th className="text-left px-4 py-3 font-medium text-inkSecondary">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-inkSecondary">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-inkSecondary">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-inkSecondary">Total</th>
                </tr>
              </thead>
              <tbody>
                {allOrders.slice(0, 10).map((order) => (
                  <tr key={order._id} className="border-b border-borderBeige/50 hover:bg-softBeige/30 transition">
                    <td className="px-4 py-3 font-medium text-inkPrimary">#{order._id.slice(-6).toUpperCase()}</td>
                    <td className="px-4 py-3 text-inkSecondary">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><StatusBadge active={order.status === 'delivered'} /></td>
                    <td className="px-4 py-3 font-medium text-inkPrimary">${order.total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <MetricCard title="Total Customers" value={users.length} icon={Users} color="blue" />
          <MetricCard title="Active" value={users.filter((u) => u.isActive).length} icon={Check} color="emerald" />
          <MetricCard title="Admins" value={users.filter((u) => u.role === 'admin').length} icon={Users} color="violet" />
          <MetricCard title="New This Month" value={overview?.newUsers || 0} icon={TrendingUp} color="orange" />
        </div>
        <div className="rounded-2xl border border-borderBeige bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkSecondary/40" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search customers..." className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-borderBeige bg-white focus:ring-2 focus:ring-elegantOrange/30 outline-none" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borderBeige">
                  <th className="text-left px-4 py-3 font-medium text-inkSecondary">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-inkSecondary">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-inkSecondary">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-inkSecondary">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-inkSecondary">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id} className="border-b border-borderBeige/50 hover:bg-softBeige/30 transition">
                    <td className="px-4 py-3 font-medium text-inkPrimary">{u.fullName}</td>
                    <td className="px-4 py-3 text-inkSecondary">{u.email}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-2xs ${u.role === 'admin' ? 'bg-elegantOrange/10 text-warmBrown' : 'bg-softBeige text-inkSecondary'}`}>{u.role}</span></td>
                    <td className="px-4 py-3"><StatusBadge active={u.isActive} /></td>
                    <td className="px-4 py-3 text-inkSecondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderTestimonials = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Messages" value={messages.length} icon={Mail} color="blue" />
        <MetricCard title="Unread" value={messages.filter((m) => !m.isRead).length} icon={Bell} color="orange" />
        <MetricCard title="Today" value={messages.filter((m) => new Date(m.createdAt).toDateString() === new Date().toDateString()).length} icon={Activity} color="emerald" />
        <MetricCard title="This Week" value={messages.filter((m) => { const d = new Date(m.createdAt); const now = new Date(); return d >= new Date(now.setDate(now.getDate() - 7)); }).length} icon={TrendingUp} color="violet" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {messages.map((msg) => (
          <div key={msg._id} className="rounded-2xl border border-borderBeige bg-white p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-inkPrimary">{msg.name}</p>
                <p className="text-2xs text-inkSecondary">{msg.email}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-2xs ${!msg.isRead ? 'bg-elegantOrange/10 text-warmBrown' : 'bg-softBeige text-inkSecondary'}`}>{!msg.isRead ? 'New' : 'Read'}</span>
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-inkSecondary/60 mb-1">{msg.subject}</p>
            <p className="text-sm text-inkSecondary mt-2 line-clamp-3">{msg.content}</p>
            <p className="text-2xs text-inkSecondary/40 mt-3">{new Date(msg.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderBlog = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-inkPrimary">Blog Posts</h3>
          <p className="text-sm text-inkSecondary mt-1">Manage your interior design articles and insights.</p>
        </div>
        <button className="admin-btn">New Post</button>
      </div>
      <div className="rounded-2xl border border-borderBeige border-dashed bg-white p-12 text-center">
        <FileText size={48} className="mx-auto text-inkSecondary/20 mb-4" />
        <p className="font-display text-2xl text-inkSecondary/40">Blog management coming soon</p>
        <p className="text-sm text-inkSecondary/35 mt-2">Create and publish articles to engage your audience.</p>
      </div>
    </div>
  )

  const renderMedia = () => {
    const imageCount = portfolio.length + (overview?.projectCount || 0) + (overview?.productCount || 0)
    const videoCount = virtualDesigns.length + projects.filter((p) => p.videoUrl).length
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Images" value={imageCount} icon={Film} color="blue" />
          <MetricCard title="Videos" value={videoCount} icon={Film} color="violet" />
          <MetricCard title="Portfolio Items" value={portfolio.length} icon={FolderKanban} color="orange" />
          <MetricCard title="Projects" value={projects.length} icon={LayoutDashboard} color="emerald" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-borderBeige bg-white p-5 shadow-sm">
            <h3 className="font-display text-xl text-inkPrimary mb-4">Recent Uploads</h3>
            <div className="space-y-3">
              {[...portfolio.slice(0, 3), ...projects.slice(0, 3)].map((item) => (
                <div key={item._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-softBeige/30 transition">
                  <div className="w-10 h-10 rounded-xl bg-softBeige flex items-center justify-center">
                    <Film size={16} className="text-inkSecondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-inkPrimary truncate">{item.title}</p>
                    <p className="text-2xs text-inkSecondary">{item.category || 'Media'}</p>
                  </div>
                  <span className="text-2xs text-inkSecondary/40">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-borderBeige bg-white p-5 shadow-sm">
            <h3 className="font-display text-xl text-inkPrimary mb-4">Storage Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-inkSecondary">Images</span>
                  <span className="font-medium text-inkPrimary">{imageCount} files</span>
                </div>
                <div className="h-2 rounded-full bg-softBeige overflow-hidden">
                  <div className="h-full bg-elegantOrange rounded-full" style={{ width: `${Math.min(100, imageCount * 5)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-inkSecondary">Videos</span>
                  <span className="font-medium text-inkPrimary">{videoCount} files</span>
                </div>
                <div className="h-2 rounded-full bg-softBeige overflow-hidden">
                  <div className="h-full bg-warmBrown rounded-full" style={{ width: `${Math.min(100, videoCount * 10)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderSettings = () => (
    <div className="space-y-6 max-w-2xl">
      <form onSubmit={submitSettings} className="space-y-4 rounded-3xl border border-sand/60 bg-white/70 backdrop-blur-sm p-6 shadow-card">
        <h2 className="font-display text-xl text-ink mb-4">Website Settings</h2>
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-ink/50 mb-1">Site Name</label>
          <input value={settingsForm.siteName} onChange={(e) => setSettingsForm((s) => ({ ...s, siteName: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" placeholder="HOK Interior Designs" />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-ink/50 mb-1">Support Email</label>
          <input value={settingsForm.supportEmail} onChange={(e) => setSettingsForm((s) => ({ ...s, supportEmail: e.target.value }))} type="email" className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" placeholder="info@hokinterior.com" />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-ink/50 mb-1">Default Currency</label>
          <select value={settingsForm.currency} onChange={(e) => setSettingsForm((s) => ({ ...s, currency: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none">
            <option value="USD">USD - US Dollar</option>
            <option value="KES">KES - Kenyan Shilling</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </div>
        <button className="w-full rounded-xl bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition">Save Settings</button>
      </form>
    </div>
  )

  const renderReports = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="Conversion Rate" value={`${analyticsData.length > 0 ? ((analyticsData.reduce((s, d) => s + d.orders, 0) / Math.max(analyticsData.reduce((s, d) => s + d.visits, 0), 1)) * 100).toFixed(1) : 0}`} suffix="%" icon={TrendingUp} color="emerald" />
        <MetricCard title="Avg Order Value" value={overview?.ordersCount > 0 ? (overview.totalSales / overview.ordersCount).toFixed(2) : '0.00'} icon={ShoppingBag} color="blue" prefix="$" />
        <MetricCard title="Products Sold" value={overview?.soldUnits || 0} icon={Boxes} color="violet" />
      </div>
      <div className="rounded-2xl border border-borderBeige bg-white p-6 shadow-sm">
        <h3 className="font-display text-xl text-inkPrimary mb-4">Sales Overview</h3>
        <MiniBarChart data={analyticsData.map((d) => d.revenue || 0)} labels={analyticsData.map((_, i) => `M${i + 1}`)} />
      </div>
    </div>
  )

  const renderAboutTab = () => {
    const about = overview || {}
    const handleAboutImageChange = (e) => {
      const f = e.target.files?.[0] || null
      setAboutImageFile(f)
      if (f && f.type?.startsWith('image/')) {
        setAboutImagePreview(URL.createObjectURL(f))
      } else {
        setAboutImagePreview(null)
      }
    }

    return (
      <form onSubmit={submitAbout} className="space-y-4 rounded-2xl border border-borderBeige bg-white p-6 max-w-2xl shadow-sm">
        <h2 className="font-display text-2xl text-inkPrimary mb-4">About Content</h2>
        {(aboutImagePreview || aboutImageFile) && (
          <div className="relative inline-block">
            <img src={aboutImagePreview} alt="About preview" className="h-40 w-full max-w-sm object-cover rounded-xl" />
            <button type="button" onClick={() => { setAboutImageFile(null); setAboutImagePreview(null) }} className="absolute -top-2 -right-2 rounded-full bg-ink text-white p-1"><X size={14} /></button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-xl border border-sand bg-linen px-4 py-2 text-2xs font-medium uppercase tracking-widest text-ink hover:bg-sand transition">
            {aboutImagePreview ? 'Change Image' : 'Upload Image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleAboutImageChange} />
          </label>
          {aboutImageFile && <span className="text-2xs text-ink/50">Selected: {aboutImageFile.name}</span>}
        </div>
        <textarea value={aboutForm.story || about?.story || ''} onChange={(e) => setAboutForm((a) => ({ ...a, story: e.target.value }))} className="h-32 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" placeholder="Our Story" required />
        <textarea value={aboutForm.mission || about?.mission || ''} onChange={(e) => setAboutForm((a) => ({ ...a, mission: e.target.value }))} className="h-24 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" placeholder="Mission" required />
        <textarea value={aboutForm.vision || about?.vision || ''} onChange={(e) => setAboutForm((a) => ({ ...a, vision: e.target.value }))} className="h-24 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm outline-none" placeholder="Vision" />
        <ProgressBar />
        <button className="rounded-xl bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition disabled:opacity-50" disabled={isUploading}>
          {isUploading ? 'Saving…' : 'Save About'}
        </button>
      </form>
    )
  }

  const renderChat = () => (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="text-center text-ink/40 py-10">No messages yet</p>
      ) : (
        <div className="grid gap-3">
          {messages.map((msg) => (
            <div key={msg._id} className="rounded-2xl border border-sand/60 bg-white p-4 shadow-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-ink">{msg.name}</p>
                  <p className="text-sm text-ink/60">{msg.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-2xs ${!msg.isRead ? 'bg-orange/10 text-orange' : 'bg-linen text-ink/60'}`}>{!msg.isRead ? 'New' : 'Read'}</span>
              </div>
              <p className="text-sm mt-2">{msg.subject}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const Sidebar = () => (
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-warmBrown text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} ${mobileSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="flex items-center gap-3 h-16 px-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-elegantOrange flex items-center justify-center flex-shrink-0">
          <LayoutDashboard size={18} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="text-2xs uppercase tracking-widest text-white/45">Admin</p>
            <p className="text-sm font-semibold whitespace-nowrap">HOK Panel</p>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {tabs.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileSidebar(false) }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${isActive ? 'bg-white/15 text-white shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              title={item.label}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={() => { logout?.(); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition ${!sidebarOpen ? 'justify-center' : ''}`}>
          <LogOut size={18} className="flex-shrink-0" />
          {sidebarOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )

  const Topbar = () => (
    <header className="sticky top-0 z-30 flex items-center gap-4 bg-white/90 backdrop-blur-md border-b border-borderBeige px-5 h-16">
      <button onClick={() => setSidebarOpen((s) => !s)} className="hidden lg:flex p-2 rounded-lg hover:bg-softBeige transition text-inkPrimary">
        {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
      <button onClick={() => setMobileSidebar(true)} className="lg:hidden p-2 rounded-lg hover:bg-softBeige transition text-inkPrimary">
        <Menu size={18} />
      </button>
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkSecondary/50" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search…"
          className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-borderBeige bg-white focus:ring-2 focus:ring-elegantOrange/30 outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <button className="relative p-2.5 rounded-full hover:bg-linen transition text-ink/70">
          <Bell size={18} />
          {messages.length > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange" />}
        </button>
        <div className="flex items-center gap-2 pl-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange to-warm flex items-center justify-center text-white text-sm font-semibold">
            {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-ink leading-tight">{user?.fullName || 'Admin'}</p>
            <p className="text-2xs text-ink/40 capitalize">{user?.role || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  )

  return (
    <div className="min-h-screen bg-creamWhite">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
        <Topbar />
        <main className="p-5 md:p-8">
          <div className="mb-6">
            <h1 className="font-display text-3xl md:text-4xl capitalize text-inkPrimary">{activeTab.replace('-', ' ')}</h1>
            <p className="text-sm text-inkSecondary mt-1">Manage your {activeTab.replace('-', ' ')}</p>
          </div>

          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${status.includes('ERROR') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}
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
               {activeTab === 'user-management' && renderUserManagement()}
               {activeTab === 'reports' && renderReports()}
               {activeTab === 'settings' && renderSettings()}
               {activeTab === 'about' && renderAboutTab()}
               {activeTab === 'orders' && renderOrders()}
               {activeTab === 'customers' && renderCustomers()}
               {activeTab === 'testimonials' && renderTestimonials()}
               {activeTab === 'blog' && renderBlog()}
               {activeTab === 'media' && renderMedia()}
             </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {mobileSidebar && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileSidebar(false)} />}

      <AnimatePresence>
        {deleteConfirm.type && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-lift">
              <h3 className="font-display text-xl text-ink mb-2">Confirm Delete</h3>
              <p className="text-sm text-ink/60 mb-5">Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm({ type: null, id: null })} className="px-4 py-2 text-xs uppercase tracking-widest border border-sand rounded-xl hover:bg-linen transition">Cancel</button>
                <button
                  onClick={() => {
                    if (deleteConfirm.type === 'project') deleteProject(deleteConfirm.id)
                    else if (deleteConfirm.type === 'portfolio') deletePortfolio(deleteConfirm.id)
                    else if (deleteConfirm.type === 'virtual') deleteVirtual(deleteConfirm.id)
                  }}
                  className="px-4 py-2 text-xs uppercase tracking-widest bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
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

export { AdminPage }
