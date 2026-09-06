// Route prefetch mapping for hover-based prefetching
export const prefetchMap = {
  '/': () => import('../pages/public/HomePage'),
  '/shop': () => import('../pages/public/ShopPage'),
  '/portfolio': () => import('../pages/public/PortfolioPage'),
  '/portfolio/:id': () => import('../pages/public/PortfolioDetailPage').then(m => ({ default: m.PortfolioDetailPage })),
  '/services': () => import('../pages/public/ServicesPage'),
  '/virtual-design': () => import('../pages/public/VirtualDesignPage'),
  '/about': () => import('../pages/public/AboutPage'),
  '/contact': () => import('../pages/public/ContactPage'),
  '/work-with-us': () => import('../pages/public/WorkWithUsPage'),
  '/testimonials': () => import('../pages/public/TestimonialsPage'),
  '/socials': () => import('../pages/public/SocialsPage'),
  '/blog': () => import('../pages/public/BlogPage').then(m => ({ default: m.BlogPage })),
  '/blog/:id': () => import('../pages/public/BlogDetailPage').then(m => ({ default: m.BlogDetailPage })),
  '/login': () => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })),
  '/cart': () => import('../pages/account/CartPage').then(m => ({ default: m.CartPage })),
  '/checkout': () => import('../pages/account/CheckoutPage').then(m => ({ default: m.CheckoutPage })),
}