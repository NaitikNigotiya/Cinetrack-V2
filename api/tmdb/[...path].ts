import type { IncomingMessage, ServerResponse } from 'node:http'
import { verifyFirebaseIdToken } from '../_lib/admin'
import { checkRateLimit } from '../_lib/rateLimiter'
import {
  matchRoute,
  sanitizeParams,
  getCacheControlHeader,
  type ProxyErrorCode,
} from '../_lib/allowList'

const TMDB_API_BASE = 'https://api.themoviedb.org/3'

function sendJsonError(
  res: ServerResponse,
  status: number,
  code: ProxyErrorCode,
  message: string
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.end(JSON.stringify({ error: { code, message, status } }))
}

async function fetchWithRetry(url: string, token: string): Promise<Response> {
  const delays = [300, 900]
  let attempt = 0
  const cleanToken = token.trim()
  const is32Hex = /^[a-f0-9]{32}$/i.test(cleanToken)

  while (attempt <= 2) {
    try {
      // 10s timeout per attempt
      const signal = AbortSignal.timeout(10_000)
      let fetchUrl = url
      const headers: Record<string, string> = {
        Accept: 'application/json',
      }

      if (is32Hex) {
        const sep = fetchUrl.includes('?') ? '&' : '?'
        fetchUrl = `${fetchUrl}${sep}api_key=${cleanToken}`
      } else {
        headers['Authorization'] = `Bearer ${cleanToken}`
      }

      let res = await fetch(fetchUrl, {
        headers,
        signal,
      })

      // If bearer token returned 401, check if token contains a 32-hex key (e.g. from aud claim)
      if (res.status === 401 && !is32Hex) {
        const match = cleanToken.match(/[a-f0-9]{32}/i)
        if (match) {
          const sep = url.includes('?') ? '&' : '?'
          const fallbackRes = await fetch(`${url}${sep}api_key=${match[0]}`, {
            headers: { Accept: 'application/json' },
            signal,
          })
          if (fallbackRes.ok) {
            return fallbackRes
          }
        }
      }

      // Non-retryable responses: success or standard 4xx (except 429)
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        return res
      }

      // Retryable: 429 or 5xx
      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        attempt++
        const retryAfterHeader = res.headers.get('Retry-After')
        let waitMs = delays[attempt - 1] ?? 500
        if (retryAfterHeader) {
          const parsedSeconds = parseInt(retryAfterHeader, 10)
          if (!isNaN(parsedSeconds)) {
            waitMs = Math.min(parsedSeconds * 1000, 5000) // max 5s wait
          }
        } else {
          // Add random jitter between 0 and 100ms
          waitMs += Math.floor(Math.random() * 100)
        }
        await new Promise((resolve) => setTimeout(resolve, waitMs))
        continue
      }

      return res
    } catch (err: unknown) {
      if (attempt < 2) {
        attempt++
        const jitter = Math.floor(Math.random() * 100)
        const waitMs = (delays[attempt - 1] ?? 500) + jitter
        await new Promise((resolve) => setTimeout(resolve, waitMs))
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  // Method check: GET only
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed', status: 405 } }))
    return
  }

  // Auth: require Authorization: Bearer <Firebase ID token>
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendJsonError(res, 401, 'UNAUTHENTICATED', 'Missing or invalid Authorization header')
    return
  }

  const idToken = authHeader.slice(7).trim()
  let decoded: { uid: string; email?: string; email_verified?: boolean }
  try {
    decoded = await verifyFirebaseIdToken(idToken)
  } catch (authErr: unknown) {
    // In local development, if verifyIdToken fails due to missing service account private key, allow fallback
    if (process.env.NODE_ENV === 'development' && idToken.length > 50) {
      decoded = {
        uid: 'dev-user',
        email: process.env.OWNER_EMAIL,
        email_verified: true,
      }
    } else {
      sendJsonError(
        res,
        401,
        'UNAUTHENTICATED',
        `Invalid or expired Firebase ID token: ${authErr instanceof Error ? authErr.message : String(authErr)}`
      )
      return
    }
  }

  // Security check: reject with 403 FORBIDDEN unless email_verified is true and matches OWNER_EMAIL
  // Never log tokens or emails.
  const configuredOwnerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase().replace(/^["']|["']$/g, '')
  const tokenEmail = decoded.email?.trim().toLowerCase()

  if (
    !configuredOwnerEmail ||
    decoded.email_verified !== true ||
    !tokenEmail ||
    tokenEmail !== configuredOwnerEmail
  ) {
    sendJsonError(res, 403, 'FORBIDDEN', 'Access restricted to owner account')
    return
  }

  const uid = decoded.uid

  // Per-user rate limit: 60 requests per minute per uid
  if (!checkRateLimit(uid)) {
    sendJsonError(res, 429, 'RATE_LIMITED', 'Rate limit exceeded. Maximum 60 requests per minute.')
    return
  }

  // Parse path from URL or Vercel query parameter
  const reqQuery = (req as { query?: Record<string, string | string[]> }).query
  let targetPath = ''

  if (reqQuery && reqQuery['path']) {
    const p = reqQuery['path']
    targetPath = Array.isArray(p) ? p.join('/') : p
  }

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
  if (!targetPath || targetPath === '[...path]') {
    targetPath = url.pathname.replace(/^\/api\/tmdb\/?/, '')
  }

  targetPath = targetPath.replace(/^\/+|\/+$/g, '')

  // Allow-list and path validation
  const matchedRule = matchRoute(targetPath)
  if (!matchedRule) {
    sendJsonError(res, 400, 'PATH_NOT_ALLOWED', `Disallowed or invalid path: ${targetPath}`)
    return
  }

  let tmdbToken = (process.env.TMDB_READ_TOKEN || process.env.TMDB_API_KEY || '').trim()
  if (tmdbToken.startsWith('"') && tmdbToken.endsWith('"')) {
    tmdbToken = tmdbToken.slice(1, -1)
  }
  if (!tmdbToken) {
    sendJsonError(res, 500, 'UPSTREAM_ERROR', 'TMDB_READ_TOKEN not configured on server')
    return
  }

  // Collect query params from both URL and Vercel parsed query
  const rawParams = new URLSearchParams()
  url.searchParams.forEach((val, key) => {
    if (key !== 'path') rawParams.set(key, val)
  })
  if (reqQuery) {
    for (const [key, val] of Object.entries(reqQuery)) {
      if (key !== 'path' && val !== undefined) {
        rawParams.set(key, Array.isArray(val) ? val[0] : String(val))
      }
    }
  }

  // Sanitize query params (drop unknown, clamp page & query length, force include_adult=false)
  const cleanParams = sanitizeParams(rawParams, matchedRule.allowedParams)
  const queryString = cleanParams.toString()
  const upstreamUrl = `${TMDB_API_BASE}/${targetPath}${queryString ? `?${queryString}` : ''}`

  try {
    const upstreamRes = await fetchWithRetry(upstreamUrl, tmdbToken)

    if (upstreamRes.status === 404) {
      sendJsonError(res, 404, 'NOT_FOUND', 'The requested TMDB resource was not found')
      return
    }

    if (upstreamRes.status === 429) {
      sendJsonError(res, 429, 'RATE_LIMITED', 'TMDB upstream rate limit exceeded')
      return
    }

    if (!upstreamRes.ok) {
      sendJsonError(res, 502, 'UPSTREAM_ERROR', `Upstream TMDB error (HTTP ${upstreamRes.status})`)
      return
    }

    // Set cache headers per matched category
    const cacheHeader = getCacheControlHeader(matchedRule.cacheCategory)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', cacheHeader)
    res.setHeader('Access-Control-Allow-Origin', '*')

    const data = await upstreamRes.text()
    res.end(data)
  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error &&
      (err.name === 'TimeoutError' || err.message.includes('timeout') || err.message.includes('aborted'))
    if (isTimeout) {
      sendJsonError(res, 504, 'TIMEOUT', 'TMDB upstream request timed out')
    } else {
      sendJsonError(res, 502, 'UPSTREAM_ERROR', 'Network error communicating with TMDB upstream')
    }
  }
}
