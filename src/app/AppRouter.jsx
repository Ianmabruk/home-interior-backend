import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { ProtectedRoute } from './ProtectedRoute'

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
const VirtualDesignPage = lazy(() => import('../pages/public/VirtualDesignPage').then((m) => ({ default: m.VirtualDesignPage })))
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-sand border-t-orange" />
  </div>
)

export const AppRouter = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:id" element={<ProductDetailPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/virtual-design" element={<VirtualDesignPage />} />
        <Route path="/virtual-interior-design" element={<VirtualDesignPage />} />
        <Route path="/chat" element={<ChatPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<AccountPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/chat" element={<AdminChatPage />} />
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
    </Suspense>
  )
}
