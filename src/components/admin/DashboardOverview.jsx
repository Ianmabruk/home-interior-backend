import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  Images,
  ShoppingBag,
  MessageSquare,
  Plus,
  FileText,
  Activity,
  TrendingUp,
  TrendingDown,
  UploadCloud,
  Newspaper,
} from 'lucide-react'
import { api } from '../../services/api'

const AnimatedCounter = ({ value, delay = 0, prefix = '', suffix = '' }) => {
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

  return (
    <span className="flex items-baseline gap-1">
      <span className="text-[var(--primary)]/40 text-xl font-medium">{prefix}</span>
      <motion.span className="font-display text-3xl font-semibold text-[var(--primary)]">{rounded}</motion.span>
      <span className="text-[var(--primary)]/40 text-xl font-medium">{suffix}</span>
    </span>
  )
}

const StatCard = ({ title, value, icon: Icon, delay, trend, trendUp, color, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className={`group cursor-pointer relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white/80 backdrop-blur-xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative flex items-center justify-between">
      <div className="flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/50">{title}</p>
        <p className="mt-3 flex items-baseline gap-1">
          <AnimatedCounter value={value ?? 0} delay={delay * 1000} />
        </p>
        {trend !== undefined && (
          <p className="mt-2 flex items-center gap-1 font-medium text-[10px]">
            <span className={`flex items-center ${trendUp ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
              {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-[var(--primary)]/40">vs last month</span>
          </p>
        )}
      </div>
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
          color === 'gold'
            ? 'bg-gradient-to-br from-[var(--accent)]/15 to-[var(--secondary)]/40 text-[var(--accent)]'
            : 'bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 text-[var(--primary)]'
        }`}
      >
        <Icon size={24} />
      </motion.div>
    </div>
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    />
  </motion.div>
)

const QuickActionCard = ({ label, icon: Icon, color, onClick }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.7 }}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-[var(--secondary)]/40 to-[var(--secondary)]/10 hover:from-[var(--accent)]/5 hover:to-[var(--secondary)]/30 transition-all duration-300 group border border-transparent hover:border-[var(--accent)]/20"
  >
    <motion.div
      whileHover={{ rotate: 10, scale: 1.1 }}
      className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}
    >
      <Icon size={22} />
    </motion.div>
    <span className="text-xs font-medium text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors">
      {label}
    </span>
  </motion.button>
)

export const DashboardOverview = ({ overview, onNavigate }) => {
  const [recentUploads, setRecentUploads] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/portfolio', { params: { sort: '-createdAt', limit: 6 } }),
      api.get('/orders').catch(() => ({ data: [] })),
    ])
      .then(([portfolioRes, ordersRes]) => {
        setRecentUploads(Array.isArray(portfolioRes.data) ? portfolioRes.data : portfolioRes.data?.items || [])
        setRecentOrders(Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.items || [])
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
        <h1 className="font-display text-4xl md:text-5xl text-[var(--primary)] tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--primary)]/50 mt-2 max-w-xl">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-2xl text-[var(--primary)]">Recent Activity</h3>
              <p className="text-xs text-[var(--primary)]/50 mt-1">Latest orders and consultations</p>
            </div>
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/40 flex items-center justify-center text-[var(--accent)]"
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
                className="flex items-center justify-between py-4 px-3 rounded-xl hover:bg-[var(--secondary)]/30 transition-colors duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/40 flex items-center justify-center text-[var(--accent)] group-hover:shadow-md transition-shadow"
                  >
                    <MessageSquare size={18} />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-[var(--primary)]">
                      {order.customerName || order.user?.fullName || 'Customer'}
                    </p>
                    <p className="text-[10px] text-[var(--primary)]/50">
                      Order #{order._id?.slice(-6) || '—'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--primary)]">
                    ${order.total?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-[10px] text-[var(--primary)]/50">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <div className="text-center py-12">
                <p className="text-sm text-[var(--primary)]/50">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-2xl text-[var(--primary)]">Recent Uploads</h3>
              <p className="text-xs text-[var(--primary)]/50 mt-1">Latest portfolio items</p>
            </div>
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/40 flex items-center justify-center text-[var(--accent)]"
            >
              <UploadCloud size={20} />
            </motion.div>
          </div>
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--secondary)]/40 skeleton" />
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
                    className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-[var(--secondary)]/30 transition-colors duration-200"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-10 h-10 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-[var(--secondary)]/40 to-[var(--accent)]/10 flex items-center justify-center text-[var(--primary)]/20">
                        <Images size={16} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--primary)] truncate">{item.title}</p>
                      <p className="text-[10px] text-[var(--primary)]/50">{item.category}</p>
                    </div>
                  </motion.div>
                ))}
            {recentUploads.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-sm text-[var(--primary)]/50">No recent uploads</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
      >
        <div className="mb-6">
          <h3 className="font-display text-2xl text-[var(--primary)]">Quick Actions</h3>
          <p className="text-xs text-[var(--primary)]/50 mt-1">Frequently used shortcuts</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionCard
            label="New Portfolio"
            icon={Plus}
            color="bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]"
            onClick={() => onNavigate?.('portfolio')}
          />
          <QuickActionCard
            label="Add Product"
            icon={ShoppingBag}
            color="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]"
            onClick={() => onNavigate?.('shop')}
          />
          <QuickActionCard
            label="View Messages"
            icon={MessageSquare}
            color="bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]"
            onClick={() => onNavigate?.('consultations')}
          />
          <QuickActionCard
            label="Virtual Design"
            icon={Newspaper}
            color="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]"
            onClick={() => onNavigate?.('virtual')}
          />
        </div>
      </motion.div>
    </div>
  )
}