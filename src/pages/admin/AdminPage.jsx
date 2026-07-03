import { BarChart3, Boxes, Film, FolderKanban, Info, Mail, PackageSearch, Sparkles, LayoutDashboard, ShoppingCart, TrendingUp, AlertTriangle, Eye } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'

const tabs = [
  { id: 'general', label: 'General', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Boxes },
  { id: 'projects', label: 'Projects', icon: Film },
  { id: 'portfolio', label: 'Portfolio', icon: FolderKanban },
  { id: 'about', label: 'About', icon: Info },
  { id: 'virtual', label: 'Virtual Interior', icon: Sparkles },
]

const PRODUCT_CATEGORIES = [
  'Living Room',
  'Kitchen',
  'Bedroom',
  'Dining',
  'Outdoor',
  'Commercial',
  'Decor',
  'Lighting',
  'Office',
  'Custom Designs',
]

export const AdminPage = () => {
  const [overview, setOverview] = useState(null)
  const [projects, setProjects] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [about, setAbout] = useState(null)
  const [virtualDesign, setVirtualDesign] = useState([])
  const [products, setProducts] = useState([])
  const [activeTab, setActiveTab] = useState('general')
  const [status, setStatus] = useState('')

  const [projectForm, setProjectForm] = useState({ title: '', description: '', order: 0 })
  const [portfolioForm, setPortfolioForm] = useState({ title: '', category: '', order: 0 })
  const [aboutForm, setAboutForm] = useState({
    story: '',
    companyDescription: '',
    mission: '',
    vision: '',
    location: '',
    contactEmail: '',
    instagram: '',
    tiktok: '',
    pinterest: '',
    facebook: '',
  })
  const [virtualForm, setVirtualForm] = useState({ title: '', description: '', servicesJson: '[]' })
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: '',
    stock: '',
    sku: '',
  })

  const [mediaFile, setMediaFile] = useState(null)
  const [productImageFile, setProductImageFile] = useState(null)
  const [resourceType, setResourceType] = useState('video')
  const [emailTarget, setEmailTarget] = useState('')
  const [editingProject, setEditingProject] = useState(null)

  const fetchAll = async () => {
    const [overviewRes, projectsRes, portfolioRes, aboutRes, virtualRes, productsRes] = await Promise.all([
      api.get('/admin/overview'),
      api.get('/content/projects'),
      api.get('/content/portfolio'),
      api.get('/content/about'),
      api.get('/content/virtual-design'),
      api.get('/products', { params: { sort: '-createdAt', limit: 100 } }),
    ])

    setOverview(overviewRes.data)
    setProjects(projectsRes.data || [])
    setPortfolio(portfolioRes.data || [])
    setAbout(aboutRes.data)
    setVirtualDesign(virtualRes.data || [])
    setProducts(productsRes.data?.items || [])

    setAboutForm({
      story: aboutRes.data?.story || '',
      companyDescription: aboutRes.data?.companyDescription || '',
      mission: aboutRes.data?.mission || '',
      vision: aboutRes.data?.vision || '',
      location: aboutRes.data?.location || '',
      contactEmail: aboutRes.data?.contactEmail || '',
      instagram: aboutRes.data?.socials?.instagram || '',
      tiktok: aboutRes.data?.socials?.tiktok || '',
      pinterest: aboutRes.data?.socials?.pinterest || '',
      facebook: aboutRes.data?.socials?.facebook || '',
    })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll().catch(() => setStatus('Failed to load admin data.'))
  }, [])

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [products])

  const setSuccess = (message) => setStatus(`SUCCESS: ${message}`)
  const setFailure = (error, fallback) => setStatus(`ERROR: ${error?.response?.data?.message || fallback}`)

  const submitProject = async (event) => {
    event.preventDefault()
    try {
      const payload = new FormData()
      payload.append('title', projectForm.title)
      payload.append('description', projectForm.description)
      payload.append('order', String(projectForm.order || 0))
      payload.append('resourceType', resourceType)
      if (mediaFile) payload.append('media', mediaFile)

      if (editingProject) {
        await api.patch(`/content/projects/${editingProject._id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
        setEditingProject(null)
        setSuccess('Project updated successfully.')
      } else {
        await api.post('/content/projects', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
        setSuccess('Project uploaded and synced to homepage.')
      }
      setProjectForm({ title: '', description: '', order: 0 })
      setMediaFile(null)
      emitAdminDataChanged({ type: 'projects-changed' })
      await fetchAll()
    } catch (error) {
      setFailure(error, editingProject ? 'Project update failed.' : 'Project upload failed.')
    }
  }

  const startEditProject = (item) => {
    setEditingProject(item)
    setProjectForm({ title: item.title, description: item.description, order: item.order || 0 })
    setResourceType(item.media?.[0]?.type === 'image' ? 'image' : 'video')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEditProject = () => {
    setEditingProject(null)
    setProjectForm({ title: '', description: '', order: 0 })
    setMediaFile(null)
    setResourceType('video')
  }

  const deleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return
    try {
      await api.delete(`/content/projects/${id}`)
      if (editingProject?._id === id) cancelEditProject()
      emitAdminDataChanged({ type: 'projects-changed' })
      await fetchAll()
      setSuccess('Project deleted successfully.')
    } catch (error) {
      setFailure(error, 'Project delete failed.')
    }
  }

  const submitPortfolio = async (event) => {
    event.preventDefault()
    try {
      const payload = new FormData()
      payload.append('title', portfolioForm.title)
      payload.append('category', portfolioForm.category)
      payload.append('order', String(portfolioForm.order || 0))
      payload.append('resourceType', 'image')
      if (mediaFile) payload.append('media', mediaFile)

      await api.post('/content/portfolio', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      setPortfolioForm({ title: '', category: '', order: 0 })
      setMediaFile(null)
      emitAdminDataChanged({ type: 'portfolio-changed' })
      await fetchAll()
      setSuccess('Portfolio image uploaded and synced to homepage + portfolio page.')
    } catch (error) {
      setFailure(error, 'Portfolio upload failed.')
    }
  }

  const submitAbout = async (event) => {
    event.preventDefault()
    try {
      const payload = new FormData()
      payload.append('story', aboutForm.story)
      payload.append('companyDescription', aboutForm.companyDescription)
      payload.append('mission', aboutForm.mission)
      payload.append('vision', aboutForm.vision)
      payload.append('location', aboutForm.location)
      payload.append('contactEmail', aboutForm.contactEmail)
      payload.append(
        'socials',
        JSON.stringify({
          instagram: aboutForm.instagram,
          tiktok: aboutForm.tiktok,
          pinterest: aboutForm.pinterest,
          facebook: aboutForm.facebook,
        }),
      )
      if (mediaFile) payload.append('media', mediaFile)

      await api.put('/content/about', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMediaFile(null)
      emitAdminDataChanged({ type: 'about-changed' })
      await fetchAll()
      setSuccess('About content synced to homepage, about page, and footer social links.')
    } catch (error) {
      setFailure(error, 'About update failed.')
    }
  }

  const submitVirtual = async (event) => {
    event.preventDefault()
    try {
      const payload = new FormData()
      payload.append('title', virtualForm.title)
      payload.append('description', virtualForm.description)
      payload.append('services', virtualForm.servicesJson)
      payload.append('resourceType', 'video')
      if (mediaFile) payload.append('media', mediaFile)

      await api.post('/content/virtual-design', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      setVirtualForm({ title: '', description: '', servicesJson: '[]' })
      setMediaFile(null)
      emitAdminDataChanged({ type: 'virtual-changed' })
      await fetchAll()
      setSuccess('Virtual interior design media synced.')
    } catch (error) {
      setFailure(error, 'Virtual interior upload failed.')
    }
  }

  const submitProduct = async (event) => {
    event.preventDefault()
    try {
      const payload = new FormData()
      payload.append('name', productForm.name)
      payload.append('description', productForm.description)
      payload.append('price', productForm.price)
      if (productForm.discountPrice) payload.append('discountPrice', productForm.discountPrice)
      payload.append('category', productForm.category)
      payload.append('stock', productForm.stock)
      payload.append('sku', productForm.sku)
      if (productImageFile) payload.append('images', productImageFile)

      await api.post('/products', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      setProductForm({ name: '', description: '', price: '', discountPrice: '', category: '', stock: '', sku: '' })
      setProductImageFile(null)
      emitAdminDataChanged({ type: 'products-changed' })
      await fetchAll()
      setSuccess('Product uploaded and available on shop + new arrivals.')
    } catch (error) {
      setFailure(error, 'Product upload failed.')
    }
  }

  const sendTestEmail = async () => {
    try {
      const result = await api.post('/admin/test-email', { to: emailTarget || undefined })
      if (result.data.sent) {
        setSuccess(`SendGrid test email delivered to ${result.data.to}.`)
      } else {
        setStatus(`WARNING: ${result.data.reason}`)
      }
    } catch (error) {
      setFailure(error, 'SendGrid test failed.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
        <aside className="rounded-3xl border border-black/10 bg-white p-5 shadow-soft h-fit sticky top-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-ink flex items-center justify-center">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/45">Admin</p>
              <p className="text-sm font-semibold text-ink">Dashboard</p>
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
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all ${
                    isActive
                      ? 'bg-ink text-white shadow-lg shadow-ink/20'
                      : 'text-ink/70 hover:bg-cream hover:text-ink'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-orange' : 'text-ink/50'} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange" />}
                </button>
              )
            })}
          </nav>
          <div className="mt-6 pt-6 border-t border-black/10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 mb-3">Quick Actions</p>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-ink/50" />
              <input
                value={emailTarget}
                onChange={(e) => setEmailTarget(e.target.value)}
                placeholder="Test email (optional)"
                className="flex-1 rounded-xl border border-black/10 bg-cream/50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange/30"
              />
            </div>
            <button onClick={sendTestEmail} className="mt-3 w-full rounded-2xl bg-orange px-4 py-2.5 text-xs uppercase tracking-[0.14em] font-semibold text-ink hover:bg-orange/90 transition">
              Test SendGrid
            </button>
          </div>
        </aside>

        <main>
          <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-soft md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-display text-4xl capitalize">{activeTab}</h1>
                <p className="text-sm text-ink/60 mt-1">Manage your {activeTab} settings and content</p>
              </div>
            </div>

            {status ? (
              <div className={`mb-6 rounded-2xl px-4 py-3 text-sm ${status.startsWith('ERROR') ? 'bg-red-50 text-red-700 border border-red-100' : status.startsWith('SUCCESS') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-cream text-ink/80 border border-black/10'}`}>
                {status}
              </div>
            ) : null}

            {activeTab === 'general' ? (
              <section className="space-y-8">
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric title="Total Sales" value={`$${overview?.totalSales?.toLocaleString?.() || overview?.totalSales || 0}`} icon={TrendingUp} color="text-emerald-600 bg-emerald-50" />
                  <Metric title="Monthly Sales" value={`$${overview?.monthlySales?.toLocaleString?.() || overview?.monthlySales || 0}`} icon={BarChart3} color="text-blue-600 bg-blue-50" />
                  <Metric title="Sold Units" value={overview?.soldUnits || 0} icon={ShoppingCart} color="text-violet-600 bg-violet-50" />
                  <Metric title="Loss Amount" value={`$${overview?.lossAmount?.toLocaleString?.() || overview?.lossAmount || 0}`} icon={AlertTriangle} color="text-red-600 bg-red-50" />
                  <Metric title="Stock Available" value={overview?.stockAvailable || 0} icon={PackageSearch} color="text-amber-600 bg-amber-50" />
                  <Metric title="Out of Stock" value={overview?.outOfStockCount || 0} icon={AlertTriangle} color="text-rose-600 bg-rose-50" />
                  <Metric title="Low Stock" value={overview?.lowStockCount || 0} icon={PackageSearch} color="text-orange-600 bg-orange-50" />
                  <Metric title="Visits" value={overview?.visits || 0} icon={Eye} color="text-cyan-600 bg-cyan-50" />
                </div>

                <div className="rounded-2xl border border-black/10 bg-cream p-6">
                  <h2 className="font-display text-2xl mb-4">Most Sold Products</h2>
                  <div className="grid gap-3">
                    {(overview?.topProducts || []).map((item, idx) => (
                      <article key={item.productId} className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-xs text-white font-bold">{idx + 1}</span>
                          <p className="font-medium">{item.name}</p>
                        </div>
                        <p className="font-semibold text-ink/70">{item.units} sold</p>
                      </article>
                    ))}
                    {(overview?.topProducts || []).length === 0 && (
                      <p className="text-sm text-ink/50">No sales data yet.</p>
                    )}
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === 'products' ? (
              <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
                <form onSubmit={submitProduct} className="space-y-3 rounded-2xl border border-black/10 bg-cream p-5">
                  <h2 className="font-display text-2xl">Product Upload</h2>
                  <input value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Name" required />
                  <textarea value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} className="h-20 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Description" required />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} type="number" step="0.01" className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Price" required />
                    <input value={productForm.discountPrice} onChange={(e) => setProductForm((p) => ({ ...p, discountPrice: e.target.value }))} type="number" step="0.01" className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Discount Price" />
                  </div>
                  <select value={productForm.category} onChange={(e) => setProductForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" required>
                    <option value="" disabled>Select category</option>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={productForm.stock} onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))} type="number" className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Stock" required />
                    <input value={productForm.sku} onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="SKU" required />
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => setProductImageFile(e.target.files?.[0] || null)} className="w-full text-sm" required />
                  <button className="w-full rounded-full bg-orange px-4 py-3 text-xs uppercase tracking-[0.14em] font-semibold text-ink hover:bg-orange/90 transition">Upload Product</button>
                </form>

                <div className="grid gap-4 sm:grid-cols-2">
                  {sortedProducts.map((item) => (
                    <article key={item._id} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                      <img src={item.images?.[0]?.url} alt={item.name} className="h-44 w-full object-cover" />
                      <div className="p-3">
                        <p className="font-display text-2xl">{item.name}</p>
                        <p className="text-xs text-ink/60">{item.category}</p>
                        <p className="text-sm font-semibold">${item.discountPrice || item.price}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === 'projects' ? (
              <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
                <form onSubmit={submitProject} className="space-y-3 rounded-2xl border border-black/10 bg-cream p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl">{editingProject ? 'Edit Project' : 'Project Upload'}</h2>
                    {editingProject && (
                      <button type="button" onClick={cancelEditProject} className="text-xs text-ink/50 hover:text-ink transition">Cancel</button>
                    )}
                  </div>
                  <input value={projectForm.title} onChange={(e) => setProjectForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Title" required />
                  <textarea value={projectForm.description} onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))} className="h-20 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Description" required />
                  <input value={projectForm.order} onChange={(e) => setProjectForm((p) => ({ ...p, order: Number(e.target.value) }))} type="number" className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Order" />
                  <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30">
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                  </select>
                  <input type="file" accept="video/*,image/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} className="w-full text-sm" />
                  <button className="w-full rounded-full bg-orange px-4 py-3 text-xs uppercase tracking-[0.14em] font-semibold text-ink hover:bg-orange/90 transition">
                    {editingProject ? 'Update Project' : 'Upload Hero Media'}
                  </button>
                </form>

                <div className="grid gap-4 sm:grid-cols-2">
                  {projects.map((item) => (
                    <article key={item._id} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                      {item.media?.[0]?.type === 'video' || item.videoUrl ? (
                        <video src={item.media?.[0]?.url || item.videoUrl} className="h-44 w-full object-cover" muted loop autoPlay playsInline />
                      ) : (
                        <img src={item.media?.[0]?.url || item.coverImageUrl} alt={item.title} className="h-44 w-full object-cover" />
                      )}
                      <div className="p-3">
                        <p className="font-display text-2xl">{item.title}</p>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => startEditProject(item)} className="text-xs px-3 py-1.5 rounded-lg border border-black/10 hover:bg-cream transition">Edit</button>
                          <button onClick={() => deleteProject(item._id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition">Delete</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === 'portfolio' ? (
              <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
                <form onSubmit={submitPortfolio} className="space-y-3 rounded-2xl border border-black/10 bg-cream p-5">
                  <h2 className="font-display text-2xl">Portfolio Upload</h2>
                  <input value={portfolioForm.title} onChange={(e) => setPortfolioForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Title" required />
                  <input value={portfolioForm.category} onChange={(e) => setPortfolioForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Category" required />
                  <input value={portfolioForm.order} onChange={(e) => setPortfolioForm((p) => ({ ...p, order: Number(e.target.value) }))} type="number" className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Order" />
                  <input type="file" accept="image/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} className="w-full text-sm" required />
                  <button className="w-full rounded-full bg-orange px-4 py-3 text-xs uppercase tracking-[0.14em] font-semibold text-ink hover:bg-orange/90 transition">Upload Portfolio Image</button>
                </form>

                <div className="grid gap-4 sm:grid-cols-2">
                  {portfolio.map((item) => (
                    <article key={item._id} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                      <img src={item.imageUrl} alt={item.title} className="h-44 w-full object-cover" />
                      <div className="p-3">
                        <p className="font-display text-2xl">{item.title}</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-orange">{item.category}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === 'about' ? (
              <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
                <form onSubmit={submitAbout} className="space-y-3 rounded-2xl border border-black/10 bg-cream p-5">
                  <h2 className="font-display text-2xl">About Dashboard</h2>
                  <textarea value={aboutForm.story} onChange={(e) => setAboutForm((p) => ({ ...p, story: e.target.value }))} className="h-20 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Story" required />
                  <textarea value={aboutForm.companyDescription} onChange={(e) => setAboutForm((p) => ({ ...p, companyDescription: e.target.value }))} className="h-20 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Company Description" required />
                  <input value={aboutForm.mission} onChange={(e) => setAboutForm((p) => ({ ...p, mission: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Mission" required />
                  <input value={aboutForm.vision} onChange={(e) => setAboutForm((p) => ({ ...p, vision: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Vision" required />
                  <input value={aboutForm.location} onChange={(e) => setAboutForm((p) => ({ ...p, location: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Location" required />
                  <input value={aboutForm.contactEmail} onChange={(e) => setAboutForm((p) => ({ ...p, contactEmail: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Contact Email" required />
                  <input value={aboutForm.instagram} onChange={(e) => setAboutForm((p) => ({ ...p, instagram: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Instagram" />
                  <input value={aboutForm.tiktok} onChange={(e) => setAboutForm((p) => ({ ...p, tiktok: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="TikTok" />
                  <input value={aboutForm.pinterest} onChange={(e) => setAboutForm((p) => ({ ...p, pinterest: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Pinterest" />
                  <input value={aboutForm.facebook} onChange={(e) => setAboutForm((p) => ({ ...p, facebook: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Facebook" />
                  <input type="file" accept="image/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} className="w-full text-sm" />
                  <button className="w-full rounded-full bg-orange px-4 py-3 text-xs uppercase tracking-[0.14em] font-semibold text-ink hover:bg-orange/90 transition">Save About</button>
                </form>

                <div className="rounded-2xl border border-black/10 bg-cream p-5">
                  {about?.aboutImageUrl && (
                    <img src={about.aboutImageUrl} alt="About" className="h-52 w-full rounded-xl bg-white object-cover" />
                  )}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-black/10 bg-white p-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-ink/55">Mission</p>
                      <p className="mt-1 text-sm text-ink/80">{about?.mission || '—'}</p>
                    </div>
                    <div className="rounded-xl border border-black/10 bg-white p-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-ink/55">Vision</p>
                      <p className="mt-1 text-sm text-ink/80">{about?.vision || '—'}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-ink/80">{about?.story}</p>
                </div>
              </section>
            ) : null}

            {activeTab === 'virtual' ? (
              <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
                <form onSubmit={submitVirtual} className="space-y-3 rounded-2xl border border-black/10 bg-cream p-5">
                  <h2 className="font-display text-2xl">Virtual Interior Dashboard</h2>
                  <input value={virtualForm.title} onChange={(e) => setVirtualForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Title" required />
                  <textarea value={virtualForm.description} onChange={(e) => setVirtualForm((p) => ({ ...p, description: e.target.value }))} className="h-20 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder="Description" required />
                  <textarea value={virtualForm.servicesJson} onChange={(e) => setVirtualForm((p) => ({ ...p, servicesJson: e.target.value }))} className="h-24 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange/30" placeholder='[{"title":"Walkthrough","description":"..."}]' />
                  <input type="file" accept="video/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} className="w-full text-sm" />
                  <button className="w-full rounded-full bg-orange px-4 py-3 text-xs uppercase tracking-[0.14em] font-semibold text-ink hover:bg-orange/90 transition">Upload Virtual Media</button>
                </form>

                <div className="grid gap-4 sm:grid-cols-2">
                  {virtualDesign.map((item) => (
                    <article key={item._id} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                      <video src={item.videoUrl} className="h-44 w-full object-cover" autoPlay muted loop playsInline />
                      <div className="p-3">
                        <p className="font-display text-2xl">{item.title}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
            </div>
          </main>
        </div>
      </div>
  )
}

const Metric = ({ title, value, icon: Icon, color }) => (
  <article className={`rounded-2xl border border-black/10 bg-white p-5 transition hover:shadow-md ${color || ''}`}>
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-[0.16em] text-ink/55">{title}</p>
      {Icon && <Icon size={16} className="text-ink/30" />}
    </div>
    <p className="mt-3 font-display text-3xl">{value}</p>
  </article>
)
