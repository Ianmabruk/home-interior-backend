import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache the built app shell so repeat visits render instantly and
      // the site works offline. The SW updates itself in the background.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        // Never let the SW cache/handle API calls as navigations.
        navigateFallbackDenylist: [/^\/api/, /\/api\//],
        runtimeCaching: [
          {
            // Cloudinary images — cache-first, they are immutable per URL.
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*\/image\/upload\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cloudinary videos — cache-first with range support for seeking.
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*\/video\/upload\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-videos',
              rangeRequests: true,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Read-only public content/product APIs — stale-while-revalidate so
            // the UI is instant while fresh data loads in the background.
            urlPattern: /\/api\/(content|products)(\/.*)?$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-content',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'HOK Interior Designs',
        short_name: 'HOK',
        description: 'Luxury interior design, curated furniture, and premium virtual design services.',
        theme_color: '#f5f1ea',
        background_color: '#f5f1ea',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // es2020 lets Vite/Rolldown emit modern syntax without legacy helpers
    // (optional chaining, nullish coalescing), shrinking the JS and cutting
    // main-thread parse/exec time (TBT) on mobile.
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Split heavy vendors into their own long-term-cacheable chunks so the
        // initial app chunk stays small and unchanged vendors are served from
        // cache on repeat visits. This directly cuts main-thread parse/exec
        // time on mobile.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('framer-motion') || id.includes('motion-')) return 'vendor-motion'
          if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router'
          if (id.includes('react-dom') || id.includes('scheduler') || id.includes('/react/')) return 'vendor-react'
          if (id.includes('lucide-react') || id.includes('react-icons')) return 'vendor-icons'
          if (id.includes('axios')) return 'vendor-axios'
          return 'vendor'
        },
      },
    },
  },
})
