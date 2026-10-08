import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), '');

  const isProduction = mode === 'production';
  const isCapacitor = process.env.VITE_IS_CAPACITOR === 'true';

  const baseFolder = isCapacitor
    ? '/'
    : (isProduction ? '/diary/' : '/');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        base: baseFolder,
        includeAssets: ['pwa-icon.svg'],
        manifest: {
          name: "Diary",
          short_name: "Diary",
          description: "A simple and elegant web application to write and save your life events. All your data is end-to-end encrypted and stored securely.",
          start_url: baseFolder,
          scope: baseFolder,
          display: "standalone",
          background_color: "#FBF8F3",
          theme_color: "#FBF8F3",
          orientation: "portrait-primary",
          icons: [
            {
              src: `${baseFolder === '/' ? '/' : baseFolder}pwa-icon.svg`.replace(/\/\//g, '/'),
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any maskable"
            }
          ],
          screenshots: [
            {
              src: "https://via.placeholder.com/720x1280/6366f1/ffffff?text=Mobile+Timeline",
              sizes: "720x1280",
              type: "image/png",
              label: "Timeline View"
            },
            {
              src: "https://via.placeholder.com/1280x720/FBF8F3/334155?text=Desktop+Editor",
              sizes: "1280x720",
              type: "image/png",
              form_factor: "wide",
              label: "Editor View"
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,gif,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/aistudiocdn\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'aistudiocdn-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'jsdelivr-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/esm\.sh\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'esmsh-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            }
          ]
        }
      })
    ],
    // Base path conditionally set for Capacitor or GitHub Pages deployment
    base: baseFolder,
    build: {
      rollupOptions: {
        // Mark these as external so Vite doesn't try to bundle them.
        // They are provided via <script type="importmap"> in index.html
        external: ['@zip.js/zip.js', 'compromise']
      }
    },
    // Add this to prevent Vite from trying to pre-bundle these dependencies
    // during development. They are handled by the importmap.
    optimizeDeps: {
      exclude: ['@zip.js/zip.js', 'compromise']
    }
  }
})
