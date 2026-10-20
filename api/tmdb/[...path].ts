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
  code: ProxyErrorCode | string,
  message: string,
  path: string,
  details?: unknown
) {
  console.error(
    `[TMDB Proxy Error] Status: ${status} | Code: ${code} | Path: "${path}" | Message: ${message}`,
    details !== undefined ? details : ''
  )

  if (!res.headersSent) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    res.end(
      JSON.stringify({
        error: { code, message, status, path },
        code,
        message,
        path,
        status,
      })
    )
  }
}

/**
 * Derives and normalizes the TMDB path from either req.url or catch-all params.
 * In production, the catch-all param can be a string, an array, or missing.
 */
export function normalizeTmdbPath(
  urlStr?: string,
  catchAllParam?: string | string[] | undefined
): string {
  // 1. Try from req.url first (most reliable, preserves requested path)
  if (urlStr) {
    try {
      const parsed = new URL(urlStr, 'http://localhost')
      let path = parsed.pathname
        .replace(/^\/?api\/tmdb\/?/i, '')
        .replace(/^\/+|\/+$/g, '')

      if (path && path !== '[...path]' && !path.includes('[...')) {
        return path
      }
    } catch {
      // Ignore URL parsing errors and fallback to catchAllParam
    }
  }

  // 2. Fallback to catch-all query parameter (string or string[])
  if (catchAllParam !== undefined && catchAllParam !== null) {
    let path = Array.isArray(catchAllParam)
      ? catchAllParam.filter(Boolean).join('/')
      : String(catchAllParam)

    path = path.replace(/^\/?api\/tmdb\/?/i, '').replace(/^\/+|\/+$/g, '')
    if (path && path !== '[...path]' && !path.includes('[...')) {
      return path
    }
  }

  return ''
}

async function fetchWithRetry(url: string, token: string): Promise<Response> {
  const delays = [300, 900]
  let attempt = 0
  const cleanToken = token.trim()
  const is32Hex = /^[a-f0-9]{32}$/i.test(cleanToken)

  while (attempt <= 2) {
    try {
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

      // If bearer token returned 401, check if token contains a 32-hex key (fallback)
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

      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        return res
      }

      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        attempt++
        const retryAfterHeader = res.headers.get('Retry-After')
        let waitMs = delays[attempt - 1] ?? 500
        if (retryAfterHeader) {
          const parsedSeconds = parseInt(retryAfterHeader, 10)
          if (!isNaN(parsedSeconds)) {
            waitMs = Math.min(parsedSeconds * 1000, 5000)
          }
        } else {
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

  // Derive and normalise target TMDB path immediately
  const reqQuery = (req as { query?: Record<string, string | string[]> }).query
  const rawPathParam = reqQuery?.['path'] ?? reqQuery?.['...path']
  const targetPath = normalizeTmdbPath(req.url, rawPathParam)

  try {
    // Method check: GET only
    if (req.method !== 'GET') {
      sendJsonError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed', targetPath)
      return
    }

    // Auth: require Authorization: Bearer <Firebase ID token>
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendJsonError(
        res,
        401,
        'UNAUTHENTICATED',
        'Missing or invalid Authorization header',
        targetPath
      )
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
          `Invalid or expired Firebase ID token: ${authErr instanceof Error ? authErr.message : String(authErr)}`,
          targetPath,
          authErr
        )
        return
      }
    }

    // Security check: reject with 403 FORBIDDEN unless email_verified is true and matches OWNER_EMAIL
    const configuredOwnerEmail = (
      process.env.OWNER_EMAIL ||
      process.env.VITE_OWNER_EMAIL ||
      ''
    )
      .trim()
      .toLowerCase()
      .replace(/^["']|["']$/g, '')

    const tokenEmail = decoded.email?.trim().toLowerCase()

    if (
      !configuredOwnerEmail ||
      decoded.email_verified !== true ||
      !tokenEmail ||
      tokenEmail !== configuredOwnerEmail
    ) {
      sendJsonError(
        res,
        403,
        'FORBIDDEN',
        'Access restricted to owner account',
        targetPath,
        `Token email "${tokenEmail}" (verified: ${decoded.email_verified}) does not match configured owner`
      )
      return
    }

    const uid = decoded.uid

    // Per-user rate limit: 60 requests per minute per uid
    if (!checkRateLimit(uid)) {
      sendJsonError(
        res,
        429,
        'RATE_LIMITED',
        'Rate limit exceeded. Maximum 60 requests per minute.',
        targetPath
      )
      return
    }

    // Check empty path
    if (!targetPath) {
      sendJsonError(res, 400, 'BAD_PATH', 'Missing TMDB resource path', targetPath)
      return
    }

    // Allow-list and path validation against normalised path
    const matchedRule = matchRoute(targetPath)
    if (!matchedRule) {
      sendJsonError(
        res,
        400,
        'PATH_NOT_ALLOWED',
        `Disallowed or invalid path: ${targetPath}`,
        targetPath
      )
      return
    }

    let tmdbToken = (
      process.env.TMDB_READ_TOKEN ||
      process.env.TMDB_API_KEY ||
      process.env.VITE_TMDB_READ_TOKEN ||
      process.env.VITE_TMDB_API_KEY ||
      ''
    ).trim()

    if (tmdbToken.startsWith('"') && tmdbToken.endsWith('"')) {
      tmdbToken = tmdbToken.slice(1, -1)
    }
    if (!tmdbToken) {
      sendJsonError(
        res,
        500,
        'UPSTREAM_ERROR',
        'TMDB_READ_TOKEN not configured on server',
        targetPath
      )
      return
    }

    // Collect query params from URL and Vercel parsed query
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
    const rawParams = new URLSearchParams()
    url.searchParams.forEach((val, key) => {
      if (key !== 'path' && key !== '...path') rawParams.set(key, val)
    })
    if (reqQuery) {
      for (const [key, val] of Object.entries(reqQuery)) {
        if (key !== 'path' && key !== '...path' && val !== undefined) {
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
        sendJsonError(
          res,
          404,
          'NOT_FOUND',
          'The requested TMDB resource was not found',
          targetPath
        )
        return
      }

      if (upstreamRes.status === 429) {
        sendJsonError(
          res,
          429,
          'RATE_LIMITED',
          'TMDB upstream rate limit exceeded',
          targetPath
        )
        return
      }

      if (!upstreamRes.ok) {
        sendJsonError(
          res,
          upstreamRes.status >= 500 ? 502 : upstreamRes.status,
          'UPSTREAM_ERROR',
          `Upstream TMDB error (HTTP ${upstreamRes.status})`,
          targetPath
        )
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
    } catch (fetchErr: unknown) {
      const isTimeout =
        fetchErr instanceof Error &&
        (fetchErr.name === 'TimeoutError' ||
          fetchErr.message.includes('timeout') ||
          fetchErr.message.includes('aborted'))
      if (isTimeout) {
        sendJsonError(res, 504, 'TIMEOUT', 'TMDB upstream request timed out', targetPath, fetchErr)
      } else {
        sendJsonError(
          res,
          502,
          'UPSTREAM_ERROR',
          'Network error communicating with TMDB upstream',
          targetPath,
          fetchErr
        )
      }
    }
  } catch (uncaughtErr: unknown) {
    sendJsonError(
      res,
      500,
      'INTERNAL_SERVER_ERROR',
      `Unexpected server error: ${uncaughtErr instanceof Error ? uncaughtErr.message : String(uncaughtErr)}`,
      targetPath,
      uncaughtErr
    )
  }
}
