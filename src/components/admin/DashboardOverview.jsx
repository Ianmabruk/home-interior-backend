import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  Images,
  ShoppingBag,
  FileText,
  Users,
  Activity,
  UploadCloud,
  Plus,
  MessageSquare,
  Newspaper,
} from 'lucide-react'
import { api } from '../../services/api'

const AnimatedCounter = ({ value, delay = 0 }) => {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))

  useEffect(() => {
    const timer = setTimeout(() => {
      animate(count, value || 0, {
        duration: 1.5,
        ease: [0.4, 0, 0.2, 1],
      })
    }, delay)
    return () => clearTimeout(timer)
  }, [value, delay, count])

  return <motion.span>{rounded}</motion.span>
}

const StatCard = ({ title, value, icon: Icon, delay, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="admin-card group cursor-default"
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-charcoal/50">{title}</p>
        <p className="mt-3 font-['Playfair_Display'] text-3xl font-semibold text-charcoal">
          <AnimatedCounter value={value ?? 0} delay={delay * 1000} />
        </p>
      </div>
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
          color === 'gold'
            ? 'bg-gradient-to-br from-bronze/15 to-secondary/40 text-bronze'
            : 'bg-gradient-to-br from-forest/10 to-bronze/10 text-forest'
        }`}
      >
        <Icon size={24} />
      </motion.div>
    </div>
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-bronze/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    />
  </motion.div>
)

export const DashboardOverview = ({ overview, onNavigate }) => {
  const [recentUploads, setRecentUploads] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [newsletterCount, setNewsletterCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/content/portfolio', { params: { sort: '-createdAt', limit: 6 } }),
      api.get('/orders').catch(() => ({ data: [] })),
      api.get('/admin/newsletter').catch(() => ({ data: [] })),
    ])
      .then(([portfolioRes, ordersRes, newsletterRes]) => {
        setRecentUploads(Array.isArray(portfolioRes.data) ? portfolioRes.data : portfolioRes.data?.items || [])
        setRecentOrders(Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.items || [])
        setNewsletterCount(newsletterRes.data?.items?.length || newsletterRes.data?.length || 0)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl text-charcoal tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-textSecondary mt-2 max-w-xl">
          Welcome back. Here is what is happening across your store today.
        </p>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Portfolio Items"
          value={overview?.portfolioCount ?? 0}
          icon={Images}
          delay={0}
          color="gold"
        />
        <StatCard
          title="Products"
          value={overview?.productCount ?? 0}
          icon={ShoppingBag}
          delay={0.1}
          color="forest"
        />
        <StatCard
          title="Consultations"
          value={overview?.ordersCount ?? 0}
          icon={FileText}
          delay={0.2}
          color="gold"
        />
        <StatCard
          title="Newsletter Subscribers"
          value={newsletterCount}
          icon={Users}
          delay={0.3}
          color="forest"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2 admin-card-glass"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-['Playfair_Display'] text-2xl text-charcoal">Recent Activity</h3>
              <p className="text-xs text-textSecondary mt-1">Latest orders and consultations</p>
            </div>
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-bronze/10 to-secondary/40 flex items-center justify-center text-bronze"
            >
              <Activity size={20} />
            </motion.div>
          </div>
          <div className="space-y-1">
            {(recentOrders || []).slice(0, 5).map((order, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center justify-between py-4 px-3 rounded-xl hover:bg-secondary/30 transition-colors duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-11 h-11 rounded-full bg-gradient-to-br from-bronze/10 to-secondary/40 flex items-center justify-center text-bronze group-hover:shadow-md transition-shadow"
                  >
                    <MessageSquare size={18} />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      {order.customerName || order.user?.fullName || 'Customer'}
                    </p>
                    <p className="text-[10px] text-textSecondary">
                      Order #{order._id?.slice(-6) || '—'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-charcoal">
                    ${order.total?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-[10px] text-textSecondary">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <div className="text-center py-12">
                <p className="text-sm text-textSecondary/50">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="admin-card-glass"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-['Playfair_Display'] text-2xl text-charcoal">Recent Uploads</h3>
              <p className="text-xs text-textSecondary mt-1">Latest portfolio items</p>
            </div>
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-bronze/10 to-secondary/40 flex items-center justify-center text-bronze"
            >
              <UploadCloud size={20} />
            </motion.div>
          </div>
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/40 skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded skeleton" />
                      <div className="h-2.5 w-1/2 rounded skeleton" />
                    </div>
                  </div>
                ))
              : recentUploads.map((item, i) => (
                  <motion.div
                    key={item._id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-secondary/30 transition-colors duration-200"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary/40 to-bronze/10 flex items-center justify-center text-charcoal/20">
                        <Images size={16} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{item.title}</p>
                      <p className="text-[10px] text-textSecondary">{item.category}</p>
                    </div>
                  </motion.div>
                ))}
            {recentUploads.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-sm text-textSecondary/50">No recent uploads</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="admin-card-glass"
      >
        <div className="mb-6">
          <h3 className="font-['Playfair_Display'] text-2xl text-charcoal">Quick Actions</h3>
          <p className="text-xs text-textSecondary mt-1">Frequently used shortcuts</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'New Portfolio', icon: Plus, action: 'portfolio', color: 'from-bronze to-bronzeDark' },
            { label: 'Add Product', icon: ShoppingBag, action: 'shop', color: 'from-forest to-forestDark' },
            { label: 'View Messages', icon: MessageSquare, action: 'consultations', color: 'from-bronze to-bronzeDark' },
            { label: 'Virtual Design', icon: Newspaper, action: 'virtual', color: 'from-forest to-forestDark' },
          ].map((action, i) => (
            <motion.button
              key={action.action}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate?.(action.action)}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-secondary/40 to-secondary/10 hover:from-bronze/5 hover:to-secondary/30 transition-all duration-300 group border border-transparent hover:border-bronze/20"
            >
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg`}
              >
                <action.icon size={22} />
              </motion.div>
              <span className="text-xs font-medium text-charcoal group-hover:text-bronze transition-colors">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
