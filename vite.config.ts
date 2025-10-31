import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'
import { VitePWA } from 'vite-plugin-pwa'

const isProd = process.env.BUILD_MODE === 'prod'
export default defineConfig({
  plugins: [
    react(), 
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB
        runtimeCaching: [
          {
            // API caching for task execution results
            urlPattern: /^https:\/\/api\.babyagi\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              backgroundSync: {
                name: 'task-results-queue',
                options: {
                  maxRetentionTime: 24 * 60 // 24 hours in minutes
                }
              }
            }
          },
          {
            // Static assets caching
            urlPattern: /\.(?:js|css|wasm|webp|png|jpg|jpeg|svg|gif|ico|woff2)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Navigation fallback for SPA
            urlPattern: /^https:\/\/.*\/$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'page-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Font caching
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              }
            }
          },
          {
            // Images caching
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      includeAssets: [
        'favicon.ico', 
        'apple-touch-icon.png', 
        'masked-icon.svg',
        'pwa-192x192.png',
        'pwa-256x256.png',
        'pwa-384x384.png',
        'pwa-512x512.png'
      ],
      manifest: {
        name: 'BabyAGI - Autonomous AI Agent',
        short_name: 'BabyAGI',
        description: 'An interactive simulator demonstrating autonomous AI agent principles with real AI integration and task execution',
        theme_color: '#3b82f6',
        background_color: '#0f172a',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'developer', 'simulation', 'ai'],
        lang: 'en',
        dir: 'ltr',
        prefer_related_applications: false,
        screenshots: [
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'BabyAGI interface'
          },
          {
            src: 'pwa-256x256.png',
            sizes: '256x256',
            type: 'image/png',
            form_factor: 'wide',
            label: 'BabyAGI desktop view'
          }
        ],
        icons: [
          {
            src: 'favicon.ico',
            sizes: '48x48',
            type: 'image/x-icon'
          },
          {
            src: 'pwa-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'pwa-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-256x256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'masked-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'New Objective',
            short_name: 'Objective',
            description: 'Create a new AI objective',
            url: '/?tab=objectives',
            icons: [
              { src: 'pwa-192x192.png', sizes: '192x192' }
            ]
          },
          {
            name: 'View Tasks',
            short_name: 'Tasks',
            description: 'Monitor task execution',
            url: '/?tab=tasks',
            icons: [
              { src: 'pwa-192x192.png', sizes: '192x192' }
            ]
          },
          {
            name: 'Agent Status',
            short_name: 'Status',
            description: 'Check agent health and activity',
            url: '/?tab=status',
            icons: [
              { src: 'pwa-192x192.png', sizes: '192x192' }
            ]
          },
          {
            name: 'Task Results',
            short_name: 'Results',
            description: 'View completed task results',
            url: '/?tab=results',
            icons: [
              { src: 'pwa-192x192.png', sizes: '192x192' }
            ]
          }
        ],
        related_applications: [],
        scope_extensions: []
      },
      // Inject Web Vitals for performance monitoring
      injectRegister: 'auto',
      // Enable dev options for development
      devOptions: {
        enabled: true,
        type: 'module'
      },
      // Enable PWA install prompt
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // Custom service worker configuration
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}']
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          'pwa': ['vite-plugin-pwa', 'workbox-window']
        }
      }
    }
  },
  define: {
    __PWA_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
})

