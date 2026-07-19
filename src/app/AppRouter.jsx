import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { ProtectedRoute } from './ProtectedRoute'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

const PortfolioDetailPage = lazy(() => import('../pages/public/PortfolioDetailPage').then((m) => ({ default: m.PortfolioDetailPage })))
const VirtualDesignDetailPage = lazy(() => import('../pages/public/VirtualDesignDetailPage').then((m) => ({ default: m.VirtualDesignDetailPage })))

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-borderSubtle border-t-accent" />
  </div>
)

const ErrorFallback = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <p className="font-display text-2xl text-charcoal">Failed to load page</p>
    <button onClick={() => window.location.reload()} className="mt-4 rounded-full bg-forest px-4 py-2 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-forestDark">
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

const AuthShell = lazy(() => import('../pages/auth/AuthShell').then((m) => ({ default: m.AuthShell })))
const AccountPage = lazy(() => import('../pages/account/AccountPage').then((m) => ({ default: m.AccountPage })))
const AdminPage = lazy(() => import('../pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })))
const CheckoutPage = lazy(() => import('../pages/account/CheckoutPage').then((m) => ({ default: m.CheckoutPage })))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const AboutPage = lazy(() => import('../pages/public/AboutPage').then((m) => ({ default: m.AboutPage })))
const CartPage = lazy(() => import('../pages/account/CartPage').then((m) => ({ default: m.CartPage })))
const WishlistPage = lazy(() => import('../pages/account/WishlistPage').then((m) => ({ default: m.WishlistPage })))
const ChatPage = lazy(() => import('../pages/public/ChatPage').then((m) => ({ default: m.ChatPage })))
const AdminChatPage = lazy(() => import('../pages/admin/AdminChatPage').then((m) => ({ default: m.AdminChatPage })))
const HomePage = lazy(() => import('../pages/public/HomePage').then((m) => ({ default: m.HomePage })))
const ProductDetailPage = lazy(() => import('../pages/public/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })))
const PortfolioPage = lazy(() => import('../pages/public/PortfolioPage').then((m) => ({ default: m.PortfolioPage })))
const ShopPage = lazy(() => import('../pages/public/ShopPage').then((m) => ({ default: m.ShopPage })))
const ServicesPage = lazy(() => import('../pages/public/ServicesPage').then((m) => ({ default: m.ServicesPage })))
const VirtualDesignPage = lazy(() => import('../pages/public/VirtualDesignPage').then((m) => ({ default: m.VirtualDesignPage })))
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

const ErrorBoundaryRoute = ({ element }) => (
  <ErrorBoundary fallback={<ErrorFallback />}>
    {element}
  </ErrorBoundary>
)

export const AppRouter = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ErrorBoundaryRoute element={<HomePage />} />} />
        <Route path="/shop" element={<ErrorBoundaryRoute element={<ShopPage />} />} />
        <Route path="/shop/:id" element={<ErrorBoundaryRoute element={<ProductDetailPage />} />} />
        <Route path="/portfolio" element={<ErrorBoundaryRoute element={<PortfolioPage />} />} />
        <Route path="/portfolio/:id" element={<ErrorBoundaryRoute element={<PortfolioDetailPage />} />} />
        <Route path="/about" element={<ErrorBoundaryRoute element={<AboutPage />} />} />
        <Route path="/services" element={<ErrorBoundaryRoute element={<ServicesPage />} />} />
<Route path="/virtual-design" element={<ErrorBoundaryRoute element={<VirtualDesignPage />} />} />
      <Route path="/virtual-design/project/:id" element={<ErrorBoundaryRoute element={<VirtualDesignDetailPage />} />} />
        <Route path="/chat" element={<ErrorBoundaryRoute element={<ChatPage />} />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<ErrorBoundaryRoute element={<AccountPage />} />} />
          <Route path="/wishlist" element={<ErrorBoundaryRoute element={<WishlistPage />} />} />
          <Route path="/cart" element={<ErrorBoundaryRoute element={<CartPage />} />} />
          <Route path="/checkout" element={<ErrorBoundaryRoute element={<CheckoutPage />} />} />
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<ErrorBoundaryRoute element={<AdminPage />} />} />
          <Route path="/admin/chat" element={<ErrorBoundaryRoute element={<AdminChatPage />} />} />
        </Route>
      </Route>

      <Route element={<AuthShell />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ScrollToTop />
    </Suspense>
  )
}