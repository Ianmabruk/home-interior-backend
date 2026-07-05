import { BarChart3, Boxes, Film, FolderKanban, Info, Mail, Sparkles, LayoutDashboard, ShoppingBag, TrendingUp, Users, FileText, Settings, Search, Filter, Grid, List, Check, Trash2, Edit, Eye, EyeOff } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../services/api'

const tabs = [
  { id: 'general', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'products', label: 'Products', icon: Boxes },
  { id: 'projects', label: 'Projects', icon: Film },
  { id: 'portfolio', label: 'Portfolio', icon: FolderKanban },
  { id: 'virtual', label: 'Virtual Interior', icon: Sparkles },
  { id: 'chat', label: 'Chat', icon: Mail },
  { id: 'user-management', label: 'Users', icon: Users },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about', label: 'About', icon: Info },
]

const PRODUCT_CATEGORIES = [
  'Living Room', 'Kitchen', 'Bedroom', 'Dining', 'Outdoor',
  'Commercial', 'Decor', 'Lighting', 'Office', 'Custom Designs',
]

const PROJECT_CATEGORIES = [
  'Residential', 'Commercial', 'Renovation', 'New Build', 'Interior',
]

function AdminPage() {
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

  const [mediaFile, setMediaFile] = useState(null)
  const [productImageFile, setProductImageFile] = useState(null)
  const [virtualVideoFile, setVirtualVideoFile] = useState(null)
  const [resourceType, setResourceType] = useState('video')
  const [editingProject, setEditingProject] = useState(null)
  const [editingPortfolio, setEditingPortfolio] = useState(null)
  const [editingVirtual, setEditingVirtual] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ type: null, id: null })

  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    const doFetch = () => {
      Promise.all([
        api.get('/admin/overview').catch(() => ({ data: null })),
        api.get('/content/projects').catch(() => ({ data: [] })),
        api.get('/content/portfolio').catch(() => ({ data: [] })),
        api.get('/products', { params: { sort: '-createdAt', limit: 100 } }).catch(() => ({ data: { items: [] } })),
        api.get('/messages').catch(() => ({ data: [] })),
        api.get('/content/virtual-design').catch(() => ({ data: [] })),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/analytics').catch(() => ({ data: [] })),
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
    doFetch()
  }, [])

const fetchAll = () => {
    // Re-fetch all data
    const doFetch = () => {
      Promise.all([
        api.get('/admin/overview').catch(() => ({ data: null })),
        api.get('/content/projects').catch(() => ({ data: [] })),
        api.get('/content/portfolio').catch(() => ({ data: [] })),
        api.get('/products', { params: { sort: '-createdAt', limit: 100 } }).catch(() => ({ data: { items: [] } })),
        api.get('/messages').catch(() => ({ data: [] })),
        api.get('/content/virtual-design').catch(() => ({ data: [] })),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/analytics').catch(() => ({ data: [] })),
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
    doFetch()
  }

  const sortedProducts = useMemo(() => [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [products])

  const setSuccess = (message) => setStatus(`SUCCESS: ${message}`)
  const setFailure = (error, fallback) => setStatus(`ERROR: ${error?.response?.data?.message || fallback}`)

  const submitProject = async (event) => {
    event.preventDefault()
    try {
      const payload = new FormData()
      payload.append('title', projectForm.title)
      payload.append('description', projectForm.description)
      payload.append('category', projectForm.category)
      payload.append('order', String(projectForm.order || 0))
      payload.append('resourceType', resourceType)
      if (mediaFile) payload.append('media', mediaFile)
      if (editingProject) {
        await api.patch(`/content/projects/${editingProject._id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
        setEditingProject(null)
      } else {
        await api.post('/content/projects', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      setProjectForm({ title: '', description: '', category: 'Residential', order: 0 })
      setMediaFile(null)
      window.dispatchEvent(new CustomEvent('admin-data-changed', { detail: { type: 'projects-changed' } }))
      fetchAll()
      setSuccess('Project saved successfully.')
    } catch (error) { setFailure(error, 'Project save failed.') }
  }

  const deleteProject = async (id) => {
    try {
      await api.delete(`/content/projects/${id}`)
      setDeleteConfirm({ type: null, id: null })
      fetchAll()
      setSuccess('Project deleted.')
    } catch (error) { setFailure(error, 'Delete failed.') }
  }

  const submitPortfolio = async (event) => {
    event.preventDefault()
    try {
      const payload = new FormData()
      payload.append('title', portfolioForm.title)
      payload.append('category', portfolioForm.category)
      if (mediaFile) payload.append('media', mediaFile)
      if (editingPortfolio) {
        await api.patch(`/content/portfolio/${editingPortfolio._id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
        setEditingPortfolio(null)
      } else {
        await api.post('/content/portfolio', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      setPortfolioForm({ title: '', category: '' })
      setMediaFile(null)
      window.dispatchEvent(new CustomEvent('admin-data-changed', { detail: { type: 'portfolio-changed' } }))
      fetchAll()
      setSuccess('Portfolio item saved.')
    } catch (error) { setFailure(error, 'Portfolio save failed.') }
  }

  const deletePortfolio = async (id) => {
    try {
      await api.delete(`/content/portfolio/${id}`)
      setDeleteConfirm({ type: null, id: null })
      fetchAll()
      setSuccess('Portfolio item deleted.')
    } catch (error) { setFailure(error, 'Delete failed.') }
  }

  const submitProduct = async (event) => {
    event.preventDefault()
    try {
      const payload = new FormData()
      Object.entries(productForm).forEach(([key, value]) => payload.append(key, value))
      if (productImageFile) payload.append('images', productImageFile)
      await api.post('/products', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      setProductForm({ name: '', description: '', price: '', discountPrice: '', category: '', stock: '', sku: '' })
      setProductImageFile(null)
      window.dispatchEvent(new CustomEvent('admin-data-changed', { detail: { type: 'products-changed' } }))
      fetchAll()
      setSuccess('Product saved.')
    } catch (error) { setFailure(error, 'Product save failed.') }
  }

  const submitVirtual = async (event) => {
    event.preventDefault()
    try {
      const payload = new FormData()
      payload.append('title', virtualForm.title)
      payload.append('description', virtualForm.description)
      payload.append('services', virtualForm.services)
      if (virtualVideoFile) payload.append('media', virtualVideoFile)
      if (editingVirtual) {
        await api.patch(`/content/virtual-design/${editingVirtual._id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
        setEditingVirtual(null)
      } else {
        await api.post('/content/virtual-design', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      setVirtualForm({ title: '', description: '', services: '', videoUrl: '' })
      setVirtualVideoFile(null)
      fetchAll()
      setSuccess('Virtual design saved.')
    } catch (error) { setFailure(error, 'Virtual design save failed.') }
  }

  const deleteVirtual = async (id) => {
    try {
      await api.delete(`/content/virtual-design/${id}`)
      setDeleteConfirm({ type: null, id: null })
      fetchAll()
      setSuccess('Virtual design deleted.')
    } catch (error) { setFailure(error, 'Delete failed.') }
  }

  const submitSettings = async (event) => {
    event.preventDefault()
    try {
      await api.put('/admin/settings', settingsForm)
      fetchAll()
      setSuccess('Settings saved.')
    } catch (error) { setFailure(error, 'Settings save failed.') }
  }

  const submitAbout = async (event) => {
    event.preventDefault()
    try {
      await api.put('/about', aboutForm)
      fetchAll()
      setSuccess('About content saved.')
    } catch (error) { setFailure(error, 'About save failed.') }
  }

  const handleUserAction = async (userId, action) => {
    try {
      await api.patch(`/admin/users/${userId}/${action}`)
      fetchAll()
      setSuccess(`User ${action} successfully.`)
    } catch (error) { setFailure(error, `Failed to ${action} user.`) }
  }

  const renderDashboard = () => (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <MetricCard title="Total Sales" value={`$${overview?.totalSales?.toLocaleString() || 0}`} icon={TrendingUp} color="emerald" />
      <MetricCard title="Revenue" value={`$${overview?.revenue?.toLocaleString() || 0}`} icon={BarChart3} color="blue" />
      <MetricCard title="Monthly Sales" value={`$${overview?.monthlySales?.toLocaleString() || 0}`} icon={TrendingUp} color="violet" />
      <MetricCard title="Total Users" value={overview?.userCount || 0} icon={Users} color="pink" />
      <MetricCard title="Products" value={overview?.productCount || 0} icon={Boxes} color="orange" />
      <MetricCard title="Orders" value={overview?.ordersCount || 0} icon={ShoppingBag} color="cyan" />
      <MetricCard title="Projects" value={overview?.projectCount || 0} icon={Film} color="indigo" />
      <MetricCard title="Portfolio" value={overview?.portfolioCount || 0} icon={FolderKanban} color="amber" />
      <MetricCard title="Visits" value={overview?.visits || 0} icon={Eye} color="sky" />
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex gap-2">
        {['7D', '30D', '90D', 'All'].map((range) => (
          <button key={range} className="px-4 py-2 text-xs uppercase tracking-widest border border-sand rounded-xl hover:bg-linen transition">
            {range}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Visitors" value={analyticsData.reduce((sum, d) => sum + (d.visits || 0), 0)} icon={Eye} color="blue" />
        <MetricCard title="Total Revenue" value={`$${analyticsData.reduce((sum, d) => sum + (d.revenue || 0), 0).toLocaleString()}`} icon={BarChart3} color="emerald" />
        <MetricCard title="New Users" value={analyticsData.reduce((sum, d) => sum + (d.newUsers || 0), 0)} icon={Users} color="violet" />
        <MetricCard title="Orders" value={analyticsData.reduce((sum, d) => sum + (d.orders || 0), 0)} icon={ShoppingBag} color="orange" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Visitor Trends">
          <div className="h-64 flex items-center justify-center text-ink/30">
            <BarChart3 size={48} />
            <p className="ml-2">Chart visualization placeholder</p>
          </div>
        </ChartCard>
        <ChartCard title="Revenue">
          <div className="h-64 flex items-center justify-center text-ink/30">
            <TrendingUp size={48} />
            <p className="ml-2">Revenue chart placeholder</p>
          </div>
        </ChartCard>
      </div>
    </div>
  )

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-sand bg-white focus:ring-2 focus:ring-orange/30"
          />
        </div>
        <button className="px-4 py-2.5 text-xs uppercase tracking-widest border border-sand rounded-xl hover:bg-linen transition">
          <Filter size={14} />
        </button>
      </div>

      <div className="rounded-2xl border border-sand bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-linen border-b border-sand">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
              <tr key={user._id} className="border-b border-sand last:border-0 hover:bg-linen transition">
                <td className="px-4 py-3">{user.fullName}</td>
                <td className="px-4 py-3 text-ink/60">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-lg text-2xs ${user.role === 'admin' ? 'bg-orange/10 text-orange' : 'bg-linen text-ink/60'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-lg text-2xs ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="p-1.5 rounded-lg border border-sand hover:bg-white transition">
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleUserAction(user._id, user.isActive ? 'suspend' : 'activate')}
                      className="p-1.5 rounded-lg border border-sand hover:bg-white transition"
                    >
                      {user.isActive ? <EyeOff size={14} /> : <Check size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg border ${viewMode === 'grid' ? 'border-ink bg-ink text-white' : 'border-sand hover:bg-linen'}`}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg border ${viewMode === 'list' ? 'border-ink bg-ink text-white' : 'border-sand hover:bg-linen'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <form onSubmit={submitProject} className="space-y-4 rounded-2xl border border-sand bg-linen p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">{editingProject ? 'Edit' : 'Add'} Project</h2>
          {editingProject && <button type="button" onClick={() => setEditingProject(null)} className="text-xs text-ink/50">Cancel</button>}
        </div>
        <input value={projectForm.title} onChange={(e) => setProjectForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Title" required />
        <textarea value={projectForm.description} onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))} className="h-24 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Description" required />
        <select value={projectForm.category} onChange={(e) => setProjectForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30">
          {PROJECT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm">
          <option value="video">Video</option>
          <option value="image">Image</option>
        </select>
        <input type="file" accept="video/*,image/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} className="w-full text-sm" required={!editingProject} />
        <button className="w-full rounded-xl bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition">
          {editingProject ? 'Update' : 'Upload'}
        </button>
      </form>

      <div className={viewMode === 'grid' ? 'grid gap-5 sm:grid-cols-2' : 'space-y-4'}>
        {projects.map((item) => (
          <article key={item._id} className={`overflow-hidden rounded-2xl border border-sand bg-white ${viewMode === 'list' ? 'flex' : ''}`}>
            <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
              {item.videoUrl ? <video src={item.videoUrl} className="h-44 w-full object-cover" autoPlay muted /> : <img src={item.coverImageUrl} alt={item.title} className="h-44 w-full object-cover" />}
            </div>
            <div className="p-4 flex-1">
              <h3 className="font-display text-xl text-ink">{item.title}</h3>
              <p className="text-xs text-ink/50 mt-1">{item.category}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditingProject(item); setProjectForm({ title: item.title, description: item.description, category: item.category || 'Residential', order: item.order || 0 }) }} className="text-xs px-3 py-1.5 rounded-lg border border-sand hover:bg-linen transition flex items-center gap-1">
                  <Edit size={12} /> Edit
                </button>
                <button onClick={() => setDeleteConfirm({ type: 'project', id: item._id })} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6 max-w-2xl">
      <form onSubmit={submitSettings} className="space-y-4 rounded-2xl border border-sand bg-linen p-6">
        <h2 className="font-display text-xl mb-4">Website Settings</h2>
        <div>
          <label className="label">Site Name</label>
          <input value={settingsForm.siteName} onChange={(e) => setSettingsForm((s) => ({ ...s, siteName: e.target.value }))} className="input-box w-full" placeholder="HOK Interior Designs" />
        </div>
        <div>
          <label className="label">Support Email</label>
          <input value={settingsForm.supportEmail} onChange={(e) => setSettingsForm((s) => ({ ...s, supportEmail: e.target.value }))} type="email" className="input-box w-full" placeholder="info@hokinterior.com" />
        </div>
        <div>
          <label className="label">Default Currency</label>
          <select value={settingsForm.currency} onChange={(e) => setSettingsForm((s) => ({ ...s, currency: e.target.value }))} className="input-box w-full">
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
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="Conversion Rate" value={`${analyticsData.length > 0 ? (analyticsData.reduce((sum, d) => sum + d.orders, 0) / analyticsData.reduce((sum, d) => sum + d.visits, 0) * 100).toFixed(1) : 0}%`} icon={TrendingUp} color="emerald" />
        <MetricCard title="Avg Order Value" value={`$${overview?.ordersCount > 0 ? (overview.totalSales / overview.ordersCount).toFixed(2) : '0.00'}`} icon={ShoppingBag} color="blue" />
        <MetricCard title="Products Sold" value={overview?.soldUnits || 0} icon={Boxes} color="violet" />
      </div>
      <div className="rounded-2xl border border-sand bg-white p-6">
        <h3 className="font-display text-xl mb-4">Sales Overview</h3>
        <div className="h-64 flex items-center justify-center text-ink/30">Sales chart placeholder</div>
      </div>
    </div>
  )

  const renderVirtual = () => (
    <div className="space-y-6">
      <form onSubmit={submitVirtual} className="space-y-4 rounded-2xl border border-sand bg-linen p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">{editingVirtual ? 'Edit' : 'Add'} Virtual Design</h2>
          {editingVirtual && <button type="button" onClick={() => setEditingVirtual(null)} className="text-xs text-ink/50">Cancel</button>}
        </div>
        <input value={virtualForm.title} onChange={(e) => setVirtualForm((v) => ({ ...v, title: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Title" required />
        <textarea value={virtualForm.description} onChange={(e) => setVirtualForm((v) => ({ ...v, description: e.target.value }))} className="h-24 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Description" required />
        <input value={virtualForm.services} onChange={(e) => setVirtualForm((v) => ({ ...v, services: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Services (comma separated)" />
        <input type="file" accept="video/*" onChange={(e) => setVirtualVideoFile(e.target.files?.[0] || null)} className="w-full text-sm" required={!editingVirtual} />
        <button className="w-full rounded-xl bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition">
          {editingVirtual ? 'Update' : 'Upload'}
        </button>
      </form>

      <div className="grid gap-5 sm:grid-cols-2">
        {virtualDesigns.map((item) => (
          <article key={item._id} className="overflow-hidden rounded-2xl border border-sand bg-white">
            {item.videoUrl && <video src={item.videoUrl} className="h-44 w-full object-cover" autoPlay muted />}
            <div className="p-4">
              <h3 className="font-display text-xl text-ink">{item.title}</h3>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditingVirtual(item); setVirtualForm({ title: item.title, description: item.description, services: item.services?.join(', ') || '' }) }} className="text-xs px-3 py-1.5 rounded-lg border border-sand hover:bg-linen transition flex items-center gap-1">
                  <Edit size={12} /> Edit
                </button>
                <button onClick={() => setDeleteConfirm({ type: 'virtual', id: item._id })} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )

  const renderAboutTab = () => (
    <form onSubmit={submitAbout} className="space-y-4 rounded-2xl border border-sand bg-linen p-6 max-w-2xl">
      <h2 className="font-display text-xl mb-4">About Content</h2>
      <textarea value={aboutForm.story} onChange={(e) => setAboutForm((a) => ({ ...a, story: e.target.value }))} className="h-32 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Our Story" required />
      <textarea value={aboutForm.mission} onChange={(e) => setAboutForm((a) => ({ ...a, mission: e.target.value }))} className="h-24 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Mission" required />
      <textarea value={aboutForm.vision} onChange={(e) => setAboutForm((a) => ({ ...a, vision: e.target.value }))} className="h-24 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Vision" />
      <button className="rounded-xl bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition">Save About</button>
    </form>
  )

  return (
    <div className="min-h-screen bg-linen">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="sticky top-0 h-screen w-full overflow-y-auto border-r border-sand bg-white p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-ink/45">Admin</p>
              <p className="text-sm font-semibold text-ink">Panel</p>
            </div>
          </div>
          <nav className="space-y-1">
            {tabs.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${isActive ? 'bg-ink text-white shadow-md' : 'text-ink/60 hover:bg-linen hover:text-ink'}`}
                >
                  <Icon size={18} className={isActive ? 'text-orange' : 'text-ink/40'} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange" />}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="p-8">
          <div className="rounded-3xl border border-ink/10 bg-white p-8 shadow-xl">
            <div className="mb-8">
              <h1 className="font-display text-4xl capitalize">{activeTab}</h1>
              <p className="text-sm text-ink/60 mt-1">Manage your {activeTab}</p>
            </div>

            {status && (
              <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${status.includes('ERROR') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {status}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'general' && renderDashboard()}
                {activeTab === 'analytics' && renderAnalytics()}
                {activeTab === 'products' && (
                  <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
                    <form onSubmit={submitProduct} className="space-y-4 rounded-2xl border border-sand bg-linen p-6">
                      <h2 className="font-display text-2xl">Add Product</h2>
                      <input value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Name" required />
                      <textarea value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} className="h-24 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Description" required />
                      <div className="grid grid-cols-2 gap-3">
                        <input value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} type="number" step="0.01" className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Price" required />
                        <input value={productForm.discountPrice} onChange={(e) => setProductForm((p) => ({ ...p, discountPrice: e.target.value }))} type="number" step="0.01" className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Discount" />
                      </div>
                      <select value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" required>
                        <option value="" disabled>Category</option>
                        {PRODUCT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <input value={productForm.sku} onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="SKU" required />
                      <input value={productForm.stock} onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))} type="number" className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Stock" required />
                      <input type="file" accept="image/*" onChange={(e) => setProductImageFile(e.target.files?.[0] || null)} className="w-full text-sm" required />
                      <button className="w-full rounded-xl bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition">Upload</button>
                    </form>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {sortedProducts.map((item) => (
                        <article key={item._id} className="overflow-hidden rounded-2xl border border-sand bg-white hover:shadow-lg transition-shadow">
                          <img src={item.images?.[0]?.url} alt={item.name} className="h-44 w-full object-cover" />
                          <div className="p-4">
                            <p className="font-display text-xl text-ink">{item.name}</p>
                            <p className="text-xs text-ink/50">{item.category}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'projects' && renderProjects()}
                {activeTab === 'portfolio' && (
                  <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
                    <form onSubmit={submitPortfolio} className="space-y-4 rounded-2xl border border-sand bg-linen p-6">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-2xl">{editingPortfolio ? 'Edit' : 'Add'} Portfolio</h2>
                        {editingPortfolio && <button type="button" onClick={() => setEditingPortfolio(null)} className="text-xs text-ink/50">Cancel</button>}
                      </div>
                      <input value={portfolioForm.title} onChange={(e) => setPortfolioForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Title" required />
                      <input value={portfolioForm.category} onChange={(e) => setPortfolioForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange/30" placeholder="Category" required />
                      <input type="file" accept="image/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} className="w-full text-sm" required={!editingPortfolio} />
                      <button className="w-full rounded-xl bg-ink px-6 py-2.5 text-xs font-medium uppercase tracking-widest text-white hover:bg-charcoal transition">
                        {editingPortfolio ? 'Update' : 'Upload'}
                      </button>
                    </form>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {portfolio.map((item) => (
                        <article key={item._id} className="overflow-hidden rounded-2xl border border-sand bg-white">
                          <img src={item.imageUrl} alt={item.title} className="h-44 w-full object-cover" />
                          <div className="p-4">
                            <p className="font-display text-xl text-ink">{item.title}</p>
                            <p className="text-xs uppercase tracking-widest text-orange">{item.category}</p>
                            <div className="mt-3 flex gap-2">
                              <button onClick={() => { setEditingPortfolio(item); setPortfolioForm({ title: item.title, category: item.category }) }} className="text-xs px-3 py-1.5 rounded-lg border border-sand hover:bg-linen transition flex items-center gap-1">
                                <Edit size={12} /> Edit
                              </button>
                              <button onClick={() => setDeleteConfirm({ type: 'portfolio', id: item._id })} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center gap-1">
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'virtual' && renderVirtual()}
                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <p className="text-center text-ink/40 py-10">No messages yet</p>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg._id} className="rounded-xl border border-sand bg-linen p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-ink">{msg.name}</p>
                              <p className="text-sm text-ink/60">{msg.email}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-2xs ${!msg.isRead ? 'bg-orange/10 text-orange' : 'bg-linen text-ink/60'}`}>
                              {!msg.isRead ? 'New' : 'Read'}
                            </span>
                          </div>
                          <p className="text-sm mt-2">{msg.subject}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {activeTab === 'user-management' && renderUserManagement()}
                {activeTab === 'reports' && renderReports()}
                {activeTab === 'settings' && renderSettings()}
                {activeTab === 'about' && renderAboutTab()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {deleteConfirm.type && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm mx-4"
            >
              <h3 className="font-display text-xl mb-2">Confirm Delete</h3>
              <p className="text-sm text-ink/60 mb-4">Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</p>
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

const MetricCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl border border-sand bg-white p-5 shadow-sm`}
  >
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium uppercase tracking-widest text-ink/50">{title}</p>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorClass(color)}`}>
        <Icon size={18} className="text-ink" />
      </div>
    </div>
    <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
  </motion.div>
)

const ChartCard = ({ title, children }) => (
  <div className="rounded-2xl border border-sand bg-white p-5">
    <h3 className="font-display text-lg mb-4">{title}</h3>
    {children}
  </div>
)

const getColorClass = (color) => {
  const map = {
    emerald: 'bg-emerald-50',
    blue: 'bg-blue-50',
    violet: 'bg-violet-50',
    orange: 'bg-orange-50',
    cyan: 'bg-cyan-50',
    pink: 'bg-pink-50',
    indigo: 'bg-indigo-50',
    amber: 'bg-amber-50',
  }
  return map[color] || 'bg-linen'
}

export { AdminPage }