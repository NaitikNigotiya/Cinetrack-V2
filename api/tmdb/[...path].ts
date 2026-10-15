import type { IncomingMessage, ServerResponse } from 'node:http'

const TMDB_API_BASE = 'https://api.themoviedb.org/3'

const ALLOWED_PATH_PATTERNS = [
  /^search\/(multi|movie|tv)$/,
  /^trending\/(all|movie|tv)\/(day|week)$/,
  /^discover\/(movie|tv)$/,
  /^(movie|tv)\/\d+$/,
  /^tv\/\d+\/season\/\d+$/,
  /^genre\/(movie|tv)\/list$/,
  /^(movie|tv)\/\d+\/(recommendations|similar|videos|credits|watch\/providers)$/,
]

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Allow CORS for local dev / Vercel preview
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: { code: 405, message: 'Method Not Allowed' } }))
    return
  }

  // Parse path from URL
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
  // Remove /api/tmdb/ prefix
  const targetPath = url.pathname.replace(/^\/api\/tmdb\/?/, '')

  const isAllowed = ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(targetPath))
  if (!isAllowed) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: { code: 400, message: `Disallowed TMDB path: ${targetPath}` } }))
    return
  }

  const token = process.env.TMDB_READ_TOKEN
  if (!token) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: { code: 500, message: 'TMDB_READ_TOKEN not configured on server' } }))
    return
  }

  try {
    const upstreamUrl = new URL(`${TMDB_API_BASE}/${targetPath}`)
    // Forward query params
    url.searchParams.forEach((val, key) => {
      upstreamUrl.searchParams.set(key, val)
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    // Set cache headers based on path type
    const isStable = targetPath.startsWith('movie/') || targetPath.startsWith('tv/') || targetPath.startsWith('genre/')
    const cacheHeader = isStable
      ? 'public, s-maxage=3600, stale-while-revalidate=86400'
      : 'public, s-maxage=300, stale-while-revalidate=1800'

    res.statusCode = upstreamRes.status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', cacheHeader)

    const data = await upstreamRes.text()
    res.end(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upstream error'
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: { code: 502, message } }))
  }
}
