import type { IncomingMessage, ServerResponse } from 'node:http'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export type ProxyErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'PATH_NOT_ALLOWED'
  | 'BAD_PATH'
  | 'BAD_PARAMS'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'TIMEOUT'
  | 'METHOD_NOT_ALLOWED'
  | 'INTERNAL_ERROR'

export interface RouteRule {
  pattern: RegExp
  allowedParams: readonly string[]
  cacheCategory: 'details' | 'lists' | 'search'
}

export const ROUTE_RULES: RouteRule[] = [
  // Search
  {
    pattern: /^search\/(multi|movie|tv|person|collection|company|keyword)$/,
    allowedParams: [
      'query',
      'year',
      'primary_release_year',
      'first_air_date_year',
      'region',
      'page',
      'language',
      'include_adult',
    ],
    cacheCategory: 'search',
  },
  {
    pattern: /^find\/[a-zA-Z0-9_-]+$/,
    allowedParams: ['external_source', 'language'],
    cacheCategory: 'search',
  },
  // Details & Seasons
  {
    pattern: /^movie\/\d+$/,
    allowedParams: ['append_to_response', 'language', 'include_image_language', 'region'],
    cacheCategory: 'details',
  },
  {
    pattern: /^tv\/\d+$/,
    allowedParams: ['append_to_response', 'language', 'include_image_language', 'region'],
    cacheCategory: 'details',
  },
  {
    pattern: /^tv\/\d+\/season\/\d+$/,
    allowedParams: ['append_to_response', 'language', 'include_image_language'],
    cacheCategory: 'details',
  },
  {
    pattern: /^tv\/\d+\/season\/\d+\/episode\/\d+$/,
    allowedParams: ['append_to_response', 'language', 'include_image_language'],
    cacheCategory: 'details',
  },
  // Sub-resources (credits, aggregate_credits, images, videos, etc.)
  {
    pattern:
      /^(movie|tv)\/\d+\/(recommendations|similar|videos|credits|aggregate_credits|watch\/providers|release_dates|external_ids|keywords|content_ratings)$/,
    allowedParams: ['page', 'language', 'region', 'watch_region'],
    cacheCategory: 'details',
  },
  {
    pattern: /^(movie|tv)\/\d+\/images$/,
    allowedParams: ['include_image_language', 'language'],
    cacheCategory: 'details',
  },
  {
    pattern: /^(movie|tv)\/\d+\/reviews$/,
    allowedParams: ['page', 'language'],
    cacheCategory: 'details',
  },
  // Person
  {
    pattern: /^person\/\d+$/,
    allowedParams: ['append_to_response', 'language'],
    cacheCategory: 'details',
  },
  {
    pattern:
      /^person\/\d+\/(movie_credits|tv_credits|combined_credits|images|external_ids|tagged_images)$/,
    allowedParams: ['language', 'page'],
    cacheCategory: 'details',
  },
  {
    pattern: /^person\/(popular|latest)$/,
    allowedParams: ['page', 'language'],
    cacheCategory: 'lists',
  },
  // Trending & Lists
  {
    pattern: /^trending\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/,
    allowedParams: ['page', 'language', 'region'],
    cacheCategory: 'lists',
  },
  {
    pattern: /^movie\/(popular|top_rated|upcoming|now_playing)$/,
    allowedParams: ['page', 'language', 'region'],
    cacheCategory: 'lists',
  },
  {
    pattern: /^tv\/(popular|top_rated|on_the_air|airing_today)$/,
    allowedParams: ['page', 'language'],
    cacheCategory: 'lists',
  },
  // Discover
  {
    pattern: /^discover\/(movie|tv)$/,
    allowedParams: [
      'page',
      'language',
      'region',
      'sort_by',
      'with_genres',
      'without_genres',
      'with_original_language',
      'with_watch_providers',
      'watch_region',
      'with_watch_monetization_types',
      'primary_release_year',
      'first_air_date_year',
      'primary_release_date.gte',
      'primary_release_date.lte',
      'first_air_date.gte',
      'first_air_date.lte',
      'release_date.gte',
      'release_date.lte',
      'air_date.gte',
      'air_date.lte',
      'vote_average.gte',
      'vote_average.lte',
      'vote_count.gte',
      'vote_count.lte',
      'with_runtime.gte',
      'with_runtime.lte',
      'include_adult',
      'include_video',
    ],
    cacheCategory: 'lists',
  },
  // Genres & Providers
  {
    pattern: /^genre\/(movie|tv)\/list$/,
    allowedParams: ['language'],
    cacheCategory: 'details',
  },
  {
    pattern: /^watch\/providers\/(movie|tv|regions)$/,
    allowedParams: ['language', 'watch_region'],
    cacheCategory: 'details',
  },
]

export function matchRoute(path: string): RouteRule | null {
  const cleanPath = path.trim().replace(/^\/+|\/+$/g, '')
  if (cleanPath.includes('..') || cleanPath.includes('//') || cleanPath.includes('\\')) {
    return null
  }
  for (const rule of ROUTE_RULES) {
    if (rule.pattern.test(cleanPath)) {
      return rule
    }
  }
  return null
}

export function sanitizeParams(
  incomingParams: URLSearchParams,
  allowedKeys: readonly string[]
): URLSearchParams {
  const sanitized = new URLSearchParams()
  const allowedSet = new Set(allowedKeys)

  for (const [key, value] of incomingParams.entries()) {
    if (!allowedSet.has(key)) continue

    let cleanedVal = value.trim()
    if (key === 'page') {
      const pageNum = parseInt(cleanedVal, 10)
      if (isNaN(pageNum) || pageNum < 1) continue
      cleanedVal = String(Math.min(pageNum, 500))
    } else if (key === 'query') {
      if (cleanedVal.length > 100) {
        cleanedVal = cleanedVal.slice(0, 100)
      }
    }

    sanitized.append(key, cleanedVal)
  }

  // Force safe defaults
  sanitized.set('include_adult', 'false')

  return sanitized
}

export function getCacheControlHeader(category: 'details' | 'lists' | 'search'): string {
  switch (category) {
    case 'details':
      return 'public, s-maxage=86400, stale-while-revalidate=604800'
    case 'lists':
      return 'public, s-maxage=900, stale-while-revalidate=3600'
    case 'search':
      return 'public, s-maxage=300, stale-while-revalidate=600'
  }
}

// In-memory per-user sliding window rate limiting
const userRequests = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 60

export function checkRateLimit(uid: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS

  let timestamps = userRequests.get(uid)
  if (!timestamps) {
    timestamps = []
    userRequests.set(uid, timestamps)
  }

  const validTimestamps = timestamps.filter((t) => t > windowStart)
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    userRequests.set(uid, validTimestamps)
    return false
  }

  validTimestamps.push(now)
  userRequests.set(uid, validTimestamps)
  return true
}

export function resetRateLimiter() {
  userRequests.clear()
}

// Path Normalizer
export function normalizeTmdbPath(
  reqUrl: string | undefined,
  pathParam: string | string[] | undefined
): string {
  if (Array.isArray(pathParam)) {
    return pathParam.join('/').replace(/^\/+|\/+$/g, '')
  }
  if (typeof pathParam === 'string' && pathParam.trim()) {
    return pathParam.trim().replace(/^\/+|\/+$/g, '')
  }
  if (reqUrl) {
    try {
      const urlObj = new URL(reqUrl, 'http://localhost')
      let pathname = urlObj.pathname
      const prefix = '/api/tmdb/'
      const exactPrefix = '/api/tmdb'

      if (pathname.startsWith(prefix)) {
        pathname = pathname.slice(prefix.length)
      } else if (pathname === exactPrefix) {
        pathname = ''
      }
      return pathname.replace(/^\/+|\/+$/g, '')
    } catch {
      // Fall through
    }
  }
  return ''
}

function normalizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined
  let clean = key.trim()
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim()
  }
  return clean.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
}

export function initAdmin(): { ok: boolean; status: string } {
  if (getApps().length > 0) {
    return { ok: true, status: 'ok' }
  }

  let serviceAccountJson: Record<string, string> | null = null
  const rawServiceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (rawServiceAccount) {
    try {
      serviceAccountJson = JSON.parse(rawServiceAccount)
    } catch {
      // Ignore
    }
  }

  const projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    serviceAccountJson?.project_id ||
    'cinetrack-v2'
  )
    .replace(/^["']|["']$/g, '')
    .trim()

  const clientEmail = (
    process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    serviceAccountJson?.client_email ||
    ''
  )
    .replace(/^["']|["']$/g, '')
    .trim()

  const rawPrivateKey =
    process.env.FIREBASE_PRIVATE_KEY || serviceAccountJson?.private_key
  const privateKey = normalizePrivateKey(rawPrivateKey)

  if (projectId && clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
      return { ok: true, status: 'ok' }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { ok: false, status: `error:${msg.slice(0, 30)}` }
    }
  } else if (projectId) {
    try {
      initializeApp({ projectId })
      return { ok: true, status: 'ok' }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { ok: false, status: `error:${msg.slice(0, 30)}` }
    }
  }

  return { ok: false, status: 'error:missing_credentials' }
}

export interface DecodedToken {
  uid: string
  email?: string
  email_verified?: boolean
}

export async function verifyFirebaseIdTokenInternal(idToken: string): Promise<DecodedToken> {
  try {
    initAdmin()
    const auth = getAuth()
    const decoded = await auth.verifyIdToken(idToken)
    return {
      uid: decoded.uid,
      email: decoded.email,
      email_verified: decoded.email_verified,
    }
  } catch (adminErr: unknown) {
    const apiKey = (
      process.env.VITE_FIREBASE_API_KEY ||
      process.env.FIREBASE_API_KEY ||
      ''
    )
      .replace(/^["']|["']$/g, '')
      .trim()

    if (apiKey) {
      try {
        const lookupRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          }
        )

        if (lookupRes.ok) {
          const data = (await lookupRes.json()) as {
            users?: Array<{ localId: string; email?: string; emailVerified?: boolean }>
          }
          const user = data.users?.[0]
          if (user?.localId) {
            return {
              uid: user.localId,
              email: user.email,
              email_verified: Boolean(user.emailVerified),
            }
          }
        }
      } catch {
        // Fall through
      }
    }

    throw adminErr
  }
}

async function getVerifier(): Promise<(token: string) => Promise<DecodedToken>> {
  if (process.env.NODE_ENV === 'test') {
    try {
      const adminMod = await import('../_lib/admin')
      if (adminMod && typeof adminMod.verifyFirebaseIdToken === 'function') {
        return adminMod.verifyFirebaseIdToken
      }
    } catch {
      // Fallback to internal
    }
  }
  return verifyFirebaseIdTokenInternal
}

export async function verifyFirebaseIdToken(token: string): Promise<DecodedToken> {
  const verifier = await getVerifier()
  return verifier(token)
}

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

  const body = {
    error: {
      message,
      code,
      path,
    },
    code,
    path,
  }

  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(JSON.stringify(body))
}

async function fetchWithRetry(
  url: string,
  token: string,
  maxRetries = 2
): Promise<Response> {
  const delays = [500, 1000]

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (res.status === 429 && attempt < maxRetries) {
        const retryAfter = res.headers.get('Retry-After')
        const jitter = Math.floor(Math.random() * 200)
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000 + jitter
          : (delays[attempt] ?? 500) + jitter
        await new Promise((resolve) => setTimeout(resolve, waitMs))
        continue
      }

      return res
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError'
      if (attempt < maxRetries && !isAbort) {
        const jitter = Math.floor(Math.random() * 200)
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
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const reqQuery = (req as { query?: Record<string, string | string[]> }).query
  const rawPathParam = reqQuery?.['path'] ?? reqQuery?.['...path']
  const targetPath = normalizeTmdbPath(req.url, rawPathParam)

  try {
    if (req.method !== 'GET') {
      sendJsonError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed', targetPath)
      return
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ') || !authHeader.slice(7).trim()) {
      sendJsonError(
        res,
        401,
        'MISSING_TOKEN',
        'Missing or empty Authorization header',
        targetPath,
        'Authorization header was missing, malformed, or empty'
      )
      return
    }

    const idToken = authHeader.slice(7).trim()
    let decoded: DecodedToken
    try {
      const verifier = await getVerifier()
      decoded = await verifier(idToken)
    } catch (authErr: unknown) {
      if (process.env.NODE_ENV === 'development' && idToken.length > 50) {
        decoded = {
          uid: 'dev-user',
          email: process.env.OWNER_EMAIL || 'nigotiyanaitik@gmail.com',
          email_verified: true,
        }
      } else {
        const errMsg = authErr instanceof Error ? authErr.message : String(authErr)
        sendJsonError(
          res,
          401,
          'INVALID_TOKEN',
          `Invalid or expired Firebase ID token: ${errMsg}`,
          targetPath,
          authErr
        )
        return
      }
    }

    const configuredOwnerEmail = (
      process.env.OWNER_EMAIL ||
      process.env.VITE_OWNER_EMAIL ||
      'nigotiyanaitik@gmail.com'
    )
      .trim()
      .toLowerCase()

    const tokenEmail = (decoded.email || '').trim().toLowerCase()
    const emailVerified = decoded.email_verified === true

    if (!tokenEmail || tokenEmail !== configuredOwnerEmail || !emailVerified) {
      sendJsonError(
        res,
        403,
        'NOT_OWNER',
        'Access restricted to owner account',
        targetPath,
        `Token email "${decoded.email}" (verified: ${decoded.email_verified}) does not match configured owner "${process.env.OWNER_EMAIL || 'nigotiyanaitik@gmail.com'}"`
      )
      return
    }

    const uid = decoded.uid
    if (!checkRateLimit(uid)) {
      sendJsonError(
        res,
        429,
        'RATE_LIMITED',
        'Too many requests. Proxy rate limit exceeded.',
        targetPath
      )
      return
    }

    if (!targetPath) {
      sendJsonError(res, 400, 'BAD_PATH', 'Missing TMDB resource path', targetPath)
      return
    }

    const routeRule = matchRoute(targetPath)
    if (!routeRule) {
      sendJsonError(
        res,
        400,
        'PATH_NOT_ALLOWED',
        `Disallowed or invalid path: ${targetPath}`,
        targetPath
      )
      return
    }

    const rawToken = (
      process.env.TMDB_READ_TOKEN ||
      process.env.TMDB_API_KEY ||
      process.env.VITE_TMDB_READ_TOKEN ||
      process.env.VITE_TMDB_API_KEY ||
      ''
    )
      .trim()
      .replace(/^["']|["']$/g, '')

    if (!rawToken) {
      sendJsonError(
        res,
        500,
        'UPSTREAM_ERROR',
        'TMDB_READ_TOKEN not configured on server',
        targetPath
      )
      return
    }

    let parsedQuery = new URLSearchParams()
    if (req.url && req.url.includes('?')) {
      const qIndex = req.url.indexOf('?')
      parsedQuery = new URLSearchParams(req.url.slice(qIndex + 1))
    } else if (reqQuery) {
      for (const [k, v] of Object.entries(reqQuery)) {
        if (k !== 'path' && k !== '...path') {
          if (Array.isArray(v)) {
            v.forEach((val) => parsedQuery.append(k, val))
          } else if (v !== undefined) {
            parsedQuery.append(k, String(v))
          }
        }
      }
    }

    const cleanParams = sanitizeParams(parsedQuery, routeRule.allowedParams)
    const queryString = cleanParams.toString()
    const targetUrl = `${TMDB_API_BASE}/${targetPath}${queryString ? `?${queryString}` : ''}`

    let upstreamResponse: Response
    try {
      upstreamResponse = await fetchWithRetry(targetUrl, rawToken)
    } catch (upstreamErr: unknown) {
      const isTimeout =
        upstreamErr instanceof Error &&
        (upstreamErr.name === 'TimeoutError' ||
          upstreamErr.message.includes('timeout') ||
          upstreamErr.message.includes('aborted'))
      if (isTimeout) {
        sendJsonError(
          res,
          504,
          'TIMEOUT',
          'TMDB upstream request timed out',
          targetPath,
          upstreamErr
        )
      } else {
        sendJsonError(
          res,
          502,
          'UPSTREAM_ERROR',
          'Network error communicating with TMDB upstream',
          targetPath,
          upstreamErr
        )
      }
      return
    }

    if (upstreamResponse.status === 404) {
      sendJsonError(
        res,
        404,
        'NOT_FOUND',
        'The requested TMDB resource was not found',
        targetPath
      )
      return
    }

    if (upstreamResponse.status === 429) {
      sendJsonError(
        res,
        429,
        'RATE_LIMITED',
        'TMDB upstream rate limit exceeded',
        targetPath
      )
      return
    }

    if (!upstreamResponse.ok) {
      sendJsonError(
        res,
        upstreamResponse.status >= 500 ? 502 : upstreamResponse.status,
        'UPSTREAM_ERROR',
        `Upstream TMDB error (HTTP ${upstreamResponse.status})`,
        targetPath
      )
      return
    }

    const cacheHeader = getCacheControlHeader(routeRule.cacheCategory)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', cacheHeader)
    res.setHeader('Access-Control-Allow-Origin', '*')

    const data = await upstreamResponse.text()
    res.end(data)
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
