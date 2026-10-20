import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

function tmdbDevProxyPlugin(env: Record<string, string>): Plugin {
  const rawToken = (env.TMDB_READ_TOKEN || env.TMDB_API_KEY || '').trim()
  const is32Hex = /^[a-f0-9]{32}$/i.test(rawToken)
  const audMatch = rawToken.match(/[a-f0-9]{32}/i)
  const apiKey = is32Hex ? rawToken : (audMatch ? audMatch[0] : (env.TMDB_API_KEY || '').trim())

  return {
    name: 'tmdb-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/tmdb')) {
          return next()
        }

        try {
          const urlObj = new URL(req.url, 'http://localhost:5173')
          const targetPath = urlObj.pathname.replace(/^\/api\/tmdb\/?/, '')

          // Always enforce adult=false
          urlObj.searchParams.set('include_adult', 'false')

          let targetUrl = `https://api.themoviedb.org/3/${targetPath}${urlObj.search}`

          const headers: Record<string, string> = {
            Accept: 'application/json',
          }

          if (apiKey) {
            const sep = targetUrl.includes('?') ? '&' : '?'
            targetUrl = `${targetUrl}${sep}api_key=${apiKey}`
          } else if (rawToken) {
            headers['Authorization'] = `Bearer ${rawToken}`
          }

          const upstreamRes = await fetch(targetUrl, {
            headers,
            signal: AbortSignal.timeout(10_000),
          })

          const data = await upstreamRes.text()

          res.statusCode = upstreamRes.status
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(data)
        } catch (err: unknown) {
          console.error('[TMDB Dev Proxy Error]:', err)
          if (!res.headersSent) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: { code: 'UPSTREAM_ERROR', message: String(err), status: 502 } }))
          }
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) {
    if (v.startsWith('"') && v.endsWith('"')) {
      env[k] = v.slice(1, -1)
    }
  }

  return {
    plugins: [
      react(),
      tmdbDevProxyPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          skipWaiting: true,
          clientsClaim: true,
          navigateFallbackDenylist: [/^\/api\/.*/],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tmdb-images',
                expiration: {
                  maxEntries: 600,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2022',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts'
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase'
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion'
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons'
              }
              if (id.includes('@tanstack')) {
                return 'vendor-query'
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react'
              }
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
      fileParallelism: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  }
})
