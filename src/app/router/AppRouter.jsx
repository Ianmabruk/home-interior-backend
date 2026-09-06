import { lazy, Suspense, memo, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from '@components/layout/Layout'
import { ErrorBoundary } from '@components/common/ErrorBoundary'
import { usePrefetchOnIdle } from '@hooks/useRoutePrefetch'

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
  </div>
)

const ErrorFallback = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <p className="font-display text-2xl text-[var(--primary)]">Failed to load page</p>
    <button onClick={() => window.location.reload()} className="mt-4 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[var(--accent)]/90">
      Reload Page
    </button>
  </div>
)

const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Lazy-loaded page components with caching
const routeCache = new Map()

const lazyWithCache = (importFn, cacheKey) => {
  return lazy(async () => {
    if (routeCache.has(cacheKey)) {
      return routeCache.get(cacheKey)
    }
    const module = await importFn()
    routeCache.set(cacheKey, module)
    return module
  })
}

// Public pages
const HomePage = lazyWithCache(() => import('@pages/public/HomePage'), 'home')
const PortfolioPage = lazyWithCache(() => import('@pages/public/PortfolioPage'), 'portfolio')
const PortfolioDetailPage = lazyWithCache(() => import('@pages/public/PortfolioDetailPage').then(m => ({ default: m.PortfolioDetailPage })), 'portfolio-detail')
const ShopPage = lazyWithCache(() => import('@pages/public/ShopPage'), 'shop')
const ProductDetailPage = lazyWithCache(() => import('@pages/public/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })), 'product-detail')
const ServicesPage = lazyWithCache(() => import('@pages/public/ServicesPage'), 'services')
const VirtualDesignPage = lazyWithCache(() => import('@pages/public/VirtualDesignPage'), 'virtual-design')
const VirtualDesignDetailPage = lazyWithCache(() => import('@pages/public/VirtualDesignDetailPage').then(m => ({ default: m.VirtualDesignDetailPage })), 'virtual-design-detail')
const AboutPage = lazyWithCache(() => import('@pages/public/AboutPage'), 'about')
const ContactPage = lazyWithCache(() => import('@pages/public/ContactPage'), 'contact')
const WorkWithUsPage = lazyWithCache(() => import('@pages/public/WorkWithUsPage'), 'work-with-us')
const TestimonialsPage = lazyWithCache(() => import('@pages/public/TestimonialsPage'), 'testimonials')
const SocialsPage = lazyWithCache(() => import('@pages/public/SocialsPage'), 'socials')
const BlogPage = lazyWithCache(() => import('@pages/public/BlogPage').then(m => ({ default: m.BlogPage })), 'blog')
const BlogDetailPage = lazyWithCache(() => import('@pages/public/BlogDetailPage').then(m => ({ default: m.BlogDetailPage })), 'blog-detail')
const ChatPage = lazyWithCache(() => import('@pages/public/ChatPage').then(m => ({ default: m.ChatPage })), 'chat')
const TrackOrderPage = lazyWithCache(() => import('@pages/public/TrackOrderPage'), 'track-order')
const UnsubscribePage = lazyWithCache(() => import('@pages/public/UnsubscribePage').then(m => ({ default: m.UnsubscribePage })), 'unsubscribe')
const NotFoundPage = lazyWithCache(() => import('@pages/public/NotFoundPage').then(m => ({ default: m.NotFoundPage })), 'not-found')

// Auth pages
const AuthShell = lazyWithCache(() => import('@pages/auth/AuthShell').then(m => ({ default: m.AuthShell })), 'auth-shell')
const LoginPage = lazyWithCache(() => import('@pages/auth/LoginPage').then(m => ({ default: m.LoginPage })), 'login')
const SignupPage = lazyWithCache(() => import('@pages/auth/SignupPage').then(m => ({ default: m.SignupPage })), 'signup')

// Account pages
const CartPage = lazyWithCache(() => import('@pages/account/CartPage').then(m => ({ default: m.CartPage })), 'cart')
const CheckoutPage = lazyWithCache(() => import('@pages/account/CheckoutPage').then(m => ({ default: m.CheckoutPage })), 'checkout')
const OrderConfirmationPage = lazyWithCache(() => import('@pages/account/OrderConfirmationPage').then(m => ({ default: m.OrderConfirmationPage })), 'order-confirmation')
const OrdersPage = lazyWithCache(() => import('@pages/account/OrdersPage').then(m => ({ default: m.OrdersPage })), 'orders')
const AccountPage = lazyWithCache(() => import('@pages/account/AccountPage').then(m => ({ default: m.AccountPage })), 'account')

// Admin pages
const AdminPage = lazyWithCache(() => import('@pages/admin/AdminPage').then(m => ({ default: m.AdminPage })), 'admin')
const DashboardOverview = lazyWithCache(() => import('@components/admin/DashboardOverview').then(m => ({ default: m.DashboardOverview })), 'dashboard-overview')
const PortfolioDashboard = lazyWithCache(() => import('@components/admin/PortfolioDashboard').then(m => ({ default: m.default })), 'portfolio-dashboard')
const VirtualDesignDashboard = lazyWithCache(() => import('@components/admin/VirtualDesignDashboard').then(m => ({ default: m.default })), 'virtual-design-dashboard')
const ServicesDashboard = lazyWithCache(() => import('@components/admin/ServicesDashboard').then(m => ({ default: m.default })), 'services-dashboard')
const ShopDashboard = lazyWithCache(() => import('@components/admin/ShopDashboard').then(m => ({ default: m.default })), 'shop-dashboard')
const HeroImagesDashboard = lazyWithCache(() => import('@components/admin/HeroImagesDashboard').then(m => ({ default: m.default })), 'hero-images-dashboard')
const ConsultationDashboard = lazyWithCache(() => import('@components/admin/ConsultationDashboard').then(m => ({ default: m.default })), 'consultation-dashboard')
const OrderDashboard = lazyWithCache(() => import('@components/admin/OrderDashboard').then(m => ({ default: m.default })), 'order-dashboard')
const SettingsDashboard = lazyWithCache(() => import('@components/admin/SettingsDashboard').then(m => ({ default: m.default })), 'settings-dashboard')
const BlogDashboard = lazyWithCache(() => import('@components/admin/BlogDashboard').then(m => ({ default: m.default })), 'blog-dashboard')
const AboutDashboard = lazyWithCache(() => import('@components/admin/AboutDashboard').then(m => ({ default: m.AboutDashboard })), 'about-dashboard')
const SocialDashboard = lazyWithCache(() => import('@components/admin/SocialDashboard').then(m => ({ default: m.SocialDashboard })), 'social-dashboard')
const WorkWithUsDashboard = lazyWithCache(() => import('@components/admin/WorkWithUsDashboard').then(m => ({ default: m.default })), 'work-with-us-dashboard')
const TestimonialsDashboard = lazyWithCache(() => import('@components/admin/TestimonialDashboard').then(m => ({ default: m.default })), 'testimonials-dashboard')
const CircularTabDashboard = lazyWithCache(() => import('@components/admin/CircularTabDashboard').then(m => ({ default: m.default })), 'circular-tab-dashboard')

const ErrorBoundaryRoute = memo(({ element }) => (
  <ErrorBoundary fallback={<ErrorFallback />}>
    {element}
  </ErrorBoundary>
))

const PrefetchOnIdle = () => {
  const { prefetch } = usePrefetchOnIdle()

  useEffect(() => {
    const prefetchRoutes = [
      () => import('@pages/public/ShopPage'),
      () => import('@pages/public/PortfolioPage'),
      () => import('@pages/public/ServicesPage'),
      () => import('@pages/public/VirtualDesignPage'),
      () => import('@pages/public/AboutPage'),
      () => import('@pages/public/WorkWithUsPage'),
      () => import('@pages/public/TestimonialsPage'),
      () => import('@pages/public/BlogPage'),
      () => import('@pages/public/SocialsPage'),
      () => import('@pages/public/ContactPage'),
    ]

    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000))
    const id = idleCallback(() => {
      prefetchRoutes.forEach((p) => prefetch(p))
    })

    return () => {
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(id)
      } else {
        clearTimeout(id)
      }
    }
  }, [prefetch])

  return null
}

export const AppRouter = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ErrorBoundaryRoute element={<HomePage />} />} />
          <Route path="/shop" element={<ErrorBoundaryRoute element={<ShopPage />} />} />
          <Route path="/shop/mirror" element={<ErrorBoundaryRoute element={<ShopPage category="mirror" />} />} />
          <Route path="/shop/artwork" element={<ErrorBoundaryRoute element={<ShopPage category="artwork" />} />} />
          <Route path="/shop/throw-pillows" element={<ErrorBoundaryRoute element={<ShopPage category="throw-pillows" />} />} />
          <Route path="/shop/:id" element={<ErrorBoundaryRoute element={<ProductDetailPage />} />} />
          <Route path="/portfolio" element={<ErrorBoundaryRoute element={<PortfolioPage />} />} />
          <Route path="/portfolio/:id" element={<ErrorBoundaryRoute element={<PortfolioDetailPage />} />} />
          <Route path="/about" element={<ErrorBoundaryRoute element={<AboutPage />} />} />
          <Route path="/services" element={<ErrorBoundaryRoute element={<ServicesPage />} />} />
          <Route path="/virtual-design" element={<ErrorBoundaryRoute element={<VirtualDesignPage />} />} />
          <Route path="/virtual-design/:id" element={<ErrorBoundaryRoute element={<VirtualDesignDetailPage />} />} />
          <Route path="/socials" element={<ErrorBoundaryRoute element={<SocialsPage />} />} />
          <Route path="/blog" element={<ErrorBoundaryRoute element={<BlogPage />} />} />
          <Route path="/blog/:id" element={<ErrorBoundaryRoute element={<BlogDetailPage />} />} />
           <Route path="/contact" element={<ErrorBoundaryRoute element={<ContactPage />} />} />
           <Route path="/work-with-us" element={<ErrorBoundaryRoute element={<WorkWithUsPage />} />} />
           <Route path="/testimonials" element={<ErrorBoundaryRoute element={<TestimonialsPage />} />} />
           <Route path="/chat" element={<ErrorBoundaryRoute element={<ChatPage />} />} />
            <Route path="/cart" element={<ErrorBoundaryRoute element={<CartPage />} />} />
            <Route path="/checkout" element={<ErrorBoundaryRoute element={<CheckoutPage />} />} />
            <Route path="/track-order" element={<ErrorBoundaryRoute element={<TrackOrderPage />} />} />
            <Route path="/unsubscribe" element={<ErrorBoundaryRoute element={<UnsubscribePage />} />} />
            <Route path="/orders" element={<ErrorBoundaryRoute element={<OrdersPage />} />} />
            <Route path="/account" element={<ErrorBoundaryRoute element={<AccountPage />} />}>
              <Route index element={<ErrorBoundaryRoute element={<AccountPage />} />} />
              <Route path="orders" element={<ErrorBoundaryRoute element={<AccountPage />} />} />
              <Route path="wishlist" element={<ErrorBoundaryRoute element={<AccountPage />} />} />
              <Route path="settings" element={<ErrorBoundaryRoute element={<AccountPage />} />} />
            </Route>
            <Route path="/account/orders/:id" element={<ErrorBoundaryRoute element={<OrderConfirmationPage />} />} />
            <Route path="/order-confirmation/:id" element={<ErrorBoundaryRoute element={<OrderConfirmationPage />} />} />

          <Route path="/admin" element={<ErrorBoundaryRoute element={<AdminPage />} />}>
              <Route index element={<ErrorBoundaryRoute element={<DashboardOverview />} />} />
              <Route path="hero-images" element={<ErrorBoundaryRoute element={<HeroImagesDashboard />} />} />
              <Route path="portfolio" element={<ErrorBoundaryRoute element={<PortfolioDashboard />} />} />
              <Route path="virtual-designs" element={<ErrorBoundaryRoute element={<VirtualDesignDashboard />} />} />
              <Route path="services" element={<ErrorBoundaryRoute element={<ServicesDashboard />} />} />
              <Route path="socials" element={<ErrorBoundaryRoute element={<SocialDashboard />} />} />
              <Route path="about" element={<ErrorBoundaryRoute element={<AboutDashboard />} />} />
              <Route path="shop" element={<ErrorBoundaryRoute element={<ShopDashboard />} />} />
              <Route path="blog" element={<ErrorBoundaryRoute element={<BlogDashboard />} />} />
               <Route path="orders" element={<ErrorBoundaryRoute element={<OrderDashboard />} />} />
               <Route path="consultations" element={<ErrorBoundaryRoute element={<ConsultationDashboard />} />} />
               <Route path="work-with-us" element={<ErrorBoundaryRoute element={<WorkWithUsDashboard />} />} />
<Route path="testimonials" element={<ErrorBoundaryRoute element={<TestimonialsDashboard />} />} />
                <Route path="circular-tabs" element={<ErrorBoundaryRoute element={<CircularTabDashboard />} />} />
                <Route path="settings" element={<ErrorBoundaryRoute element={<SettingsDashboard />} />} />
             </Route>

           <Route element={<AuthShell />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ScrollToTop />
      <PrefetchOnIdle />
    </Suspense>
  )
}