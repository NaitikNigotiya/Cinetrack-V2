import type { IncomingMessage, ServerResponse } from 'node:http'

const TMDB_API_BASE = 'https://api.themoviedb.org/3'

const ALLOWED_PATH_PATTERNS = [
  /^search\/(multi|movie|tv)$/,
  /^find\/[a-zA-Z0-9_-]+$/,
  /^trending\/(all|movie|tv)\/(day|week)$/,
  /^discover\/(movie|tv)$/,
  /^(movie|tv)\/(popular|top_rated|upcoming|now_playing)$/,
  /^tv\/(popular|top_rated|on_the_air|airing_today)$/,
  /^(movie|tv)\/\d+$/,
  /^tv\/\d+\/season\/\d+$/,
  /^tv\/\d+\/season\/\d+\/episode\/\d+$/,
  /^genre\/(movie|tv)\/list$/,
  /^(movie|tv)\/\d+\/(recommendations|similar|videos|credits|watch\/providers)$/,
  /^configuration$/,
  /^watch\/providers\/(movie|tv|regions)$/,
]

async function fetchWithRetry(url: string, token: string, maxRetries = 2): Promise<Response> {
  let attempt = 0
  while (attempt <= maxRetries) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      })
      clearTimeout(timeout)

      // Final non-retryable responses or success
      if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 422 || res.ok) {
        return res
      }

      // Retryable: 429 rate limit or 5xx server errors
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        attempt++
        const retryAfterHeader = res.headers.get('Retry-After')
        const delayMs = retryAfterHeader ? (parseInt(retryAfterHeader, 10) || 1) * 1000 : attempt * 500
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }

      return res
    } catch (err) {
      clearTimeout(timeout)
      if (attempt < maxRetries) {
        attempt++
        await new Promise((resolve) => setTimeout(resolve, attempt * 500))
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

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

    // Strict TMDB facts enforcement
    // 1. Never forward api_key in query params
    upstreamUrl.searchParams.delete('api_key')

    // 2. Always enforce include_adult=false
    upstreamUrl.searchParams.set('include_adult', 'false')

    // 3. Default language to en-US if not specified
    if (!upstreamUrl.searchParams.has('language')) {
      upstreamUrl.searchParams.set('language', 'en-US')
    }

    // 4. Cap page query parameter at TMDB max of 500
    const pageVal = upstreamUrl.searchParams.get('page')
    if (pageVal) {
      const pageNum = parseInt(pageVal, 10)
      if (!isNaN(pageNum) && pageNum > 500) {
        upstreamUrl.searchParams.set('page', '500')
      }
    }

    const upstreamRes = await fetchWithRetry(upstreamUrl.toString(), token)

    // Set cache headers based on path type
    const isStable =
      targetPath.startsWith('movie/') ||
      targetPath.startsWith('tv/') ||
      targetPath.startsWith('genre/') ||
      targetPath.startsWith('configuration') ||
      targetPath.startsWith('watch/providers')
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
