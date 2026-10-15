import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import handler from '../[...path]'
import {
  matchRoute,
  sanitizeParams,
  getCacheControlHeader,
} from '../../_lib/allowList'
import { checkRateLimit, resetRateLimiter } from '../../_lib/rateLimiter'

vi.mock('../../_lib/admin', () => ({
  verifyFirebaseIdToken: vi.fn(async (token: string) => {
    if (token === 'valid-user-token') {
      return 'user-123'
    }
    if (token === 'rate-limit-user-token') {
      return 'user-rate-limited'
    }
    throw new Error('Firebase ID token has expired or is invalid')
  }),
}))

interface MockResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}

function createMockReqRes(options: {
  method?: string
  url?: string
  authHeader?: string
}): {
  req: IncomingMessage
  res: ServerResponse
  mockRes: MockResponse
} {
  const req = {
    method: options.method ?? 'GET',
    url: options.url ?? '/api/tmdb/movie/550',
    headers: {
      host: 'localhost:3000',
      ...(options.authHeader !== undefined
        ? { authorization: options.authHeader }
        : {}),
    },
  } as unknown as IncomingMessage

  const mockRes: MockResponse = {
    statusCode: 200,
    headers: {},
    body: '',
  }

  const res = {
    get statusCode() {
      return mockRes.statusCode
    },
    set statusCode(val: number) {
      mockRes.statusCode = val
    },
    setHeader(name: string, value: string) {
      mockRes.headers[name.toLowerCase()] = value
      return this
    },
    getHeader(name: string) {
      return mockRes.headers[name.toLowerCase()]
    },
    end(data?: string) {
      if (data) {
        mockRes.body = data
      }
      return this
    },
  } as unknown as ServerResponse

  return { req, res, mockRes }
}

describe('TMDB Server Proxy Allow-list & Param Sanitization', () => {
  it('matches permitted routes across all categories', () => {
    expect(matchRoute('search/multi')).not.toBeNull()
    expect(matchRoute('search/movie')).not.toBeNull()
    expect(matchRoute('search/tv')).not.toBeNull()
    expect(matchRoute('find/tt1234567')).not.toBeNull()
    expect(matchRoute('movie/550')).not.toBeNull()
    expect(matchRoute('tv/1396')).not.toBeNull()
    expect(matchRoute('tv/1396/season/1')).not.toBeNull()
    expect(matchRoute('tv/1396/season/1/episode/1')).not.toBeNull()
    expect(matchRoute('movie/550/credits')).not.toBeNull()
    expect(matchRoute('movie/550/watch/providers')).not.toBeNull()
    expect(matchRoute('trending/all/day')).not.toBeNull()
    expect(matchRoute('movie/popular')).not.toBeNull()
    expect(matchRoute('discover/movie')).not.toBeNull()
    expect(matchRoute('genre/movie/list')).not.toBeNull()
    expect(matchRoute('configuration')).not.toBeNull()
  })

  it('rejects disallowed paths and path traversal attempts', () => {
    expect(matchRoute('account')).toBeNull()
    expect(matchRoute('authentication/token/new')).toBeNull()
    expect(matchRoute('movie/1/../../account')).toBeNull()
    expect(matchRoute('movie/1\\account')).toBeNull()
    expect(matchRoute('movie//1')).toBeNull()
    expect(matchRoute('movie/abc')).toBeNull()
  })

  it('sanitizes parameters, drops unknown keys, and caps values', () => {
    const raw = new URLSearchParams({
      query: 'A'.repeat(250),
      page: '999',
      unknown_attack_param: 'hacked',
      include_adult: 'true',
    })
    const allowed = ['query', 'page', 'include_adult']
    const sanitized = sanitizeParams(raw, allowed)

    expect(sanitized.get('unknown_attack_param')).toBeNull()
    expect(sanitized.get('query')?.length).toBe(200)
    expect(sanitized.get('page')).toBe('500')
    expect(sanitized.get('include_adult')).toBe('false')
  })

  it('clamps page below 1 up to 1', () => {
    const raw = new URLSearchParams({ page: '-5' })
    const sanitized = sanitizeParams(raw, ['page'])
    expect(sanitized.get('page')).toBe('1')
  })

  it('returns correct Cache-Control header per path class', () => {
    expect(getCacheControlHeader('details')).toBe(
      'public, s-maxage=86400, stale-while-revalidate=604800'
    )
    expect(getCacheControlHeader('lists')).toBe(
      'public, s-maxage=900, stale-while-revalidate=3600'
    )
    expect(getCacheControlHeader('search')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    )
  })
})

describe('TMDB Server Proxy Handler', () => {
  const originalEnv = process.env.TMDB_READ_TOKEN

  beforeEach(() => {
    process.env.TMDB_READ_TOKEN = 'test-tmdb-token-abc123xyz'
    resetRateLimiter()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    process.env.TMDB_READ_TOKEN = originalEnv
  })

  it('returns 405 Method Not Allowed on non-GET methods', async () => {
    const { req, res, mockRes } = createMockReqRes({ method: 'POST' })
    await handler(req, res)
    expect(mockRes.statusCode).toBe(405)
    const body = JSON.parse(mockRes.body)
    expect(body.error.code).toBe('METHOD_NOT_ALLOWED')
  })

  it('returns 204 on OPTIONS preflight request', async () => {
    const { req, res, mockRes } = createMockReqRes({ method: 'OPTIONS' })
    await handler(req, res)
    expect(mockRes.statusCode).toBe(204)
  })

  it('returns 401 UNAUTHENTICATED when Authorization header is missing', async () => {
    const { req, res, mockRes } = createMockReqRes({})
    await handler(req, res)
    expect(mockRes.statusCode).toBe(401)
    const body = JSON.parse(mockRes.body)
    expect(body.error.code).toBe('UNAUTHENTICATED')
    expect(mockRes.headers['cache-control']).toBe('no-store')
  })

  it('returns 401 UNAUTHENTICATED on invalid Firebase ID token without leaking token', async () => {
    const { req, res, mockRes } = createMockReqRes({
      authHeader: 'Bearer invalid-token-xyz',
    })
    await handler(req, res)
    expect(mockRes.statusCode).toBe(401)
    const body = JSON.parse(mockRes.body)
    expect(body.error.code).toBe('UNAUTHENTICATED')
    expect(mockRes.body).not.toContain('invalid-token-xyz')
  })

  it('returns 400 PATH_NOT_ALLOWED on unknown path', async () => {
    const { req, res, mockRes } = createMockReqRes({
      url: '/api/tmdb/not-allowed/path',
      authHeader: 'Bearer valid-user-token',
    })
    await handler(req, res)
    expect(mockRes.statusCode).toBe(400)
    const body = JSON.parse(mockRes.body)
    expect(body.error.code).toBe('PATH_NOT_ALLOWED')
  })

  it('returns 400 PATH_NOT_ALLOWED on path traversal attempt', async () => {
    const { req, res, mockRes } = createMockReqRes({
      url: '/api/tmdb/movie/1/../../account',
      authHeader: 'Bearer valid-user-token',
    })
    await handler(req, res)
    expect(mockRes.statusCode).toBe(400)
    const body = JSON.parse(mockRes.body)
    expect(body.error.code).toBe('PATH_NOT_ALLOWED')
  })

  it('passes upstream JSON unchanged on success and sets correct cache headers', async () => {
    const mockData = { id: 550, title: 'Fight Club' }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { req, res, mockRes } = createMockReqRes({
      url: '/api/tmdb/movie/550?append_to_response=credits&malicious=1',
      authHeader: 'Bearer valid-user-token',
    })

    await handler(req, res)

    expect(mockRes.statusCode).toBe(200)
    expect(mockRes.headers['cache-control']).toBe(
      'public, s-maxage=86400, stale-while-revalidate=604800'
    )
    expect(JSON.parse(mockRes.body)).toEqual(mockData)

    // Verify upstream fetch URL contains dropped params and forced include_adult=false
    const calledUrl = fetchMock.mock.calls[0]?.[0] as string
    expect(calledUrl).toContain('append_to_response=credits')
    expect(calledUrl).toContain('include_adult=false')
    expect(calledUrl).not.toContain('malicious=1')
  })

  it('maps 404 upstream response to NOT_FOUND error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status_message: 'The resource could not be found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { req, res, mockRes } = createMockReqRes({
      url: '/api/tmdb/movie/99999999',
      authHeader: 'Bearer valid-user-token',
    })

    await handler(req, res)

    expect(mockRes.statusCode).toBe(404)
    const body = JSON.parse(mockRes.body)
    expect(body.error.code).toBe('NOT_FOUND')
    expect(mockRes.headers['cache-control']).toBe('no-store')
  })

  it('retries on 429 upstream and returns 200 on subsequent success', async () => {
    const mockSuccess = { page: 1, results: [] }
    let callCount = 0
    const fetchMock = vi.fn().mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        return new Response(JSON.stringify({ status_message: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Retry-After': '0' },
        })
      }
      return new Response(JSON.stringify(mockSuccess), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { req, res, mockRes } = createMockReqRes({
      url: '/api/tmdb/search/movie?query=Inception',
      authHeader: 'Bearer valid-user-token',
    })

    await handler(req, res)

    expect(callCount).toBe(2)
    expect(mockRes.statusCode).toBe(200)
    expect(JSON.parse(mockRes.body)).toEqual(mockSuccess)
    expect(mockRes.headers['cache-control']).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    )
  })

  it('handles upstream timeout with 504 TIMEOUT', async () => {
    const timeoutErr = new Error('The operation was aborted due to timeout')
    timeoutErr.name = 'TimeoutError'
    const fetchMock = vi.fn().mockRejectedValue(timeoutErr)
    vi.stubGlobal('fetch', fetchMock)

    const { req, res, mockRes } = createMockReqRes({
      url: '/api/tmdb/movie/550',
      authHeader: 'Bearer valid-user-token',
    })

    await handler(req, res)

    expect(mockRes.statusCode).toBe(504)
    const body = JSON.parse(mockRes.body)
    expect(body.error.code).toBe('TIMEOUT')
    expect(mockRes.headers['cache-control']).toBe('no-store')
  })

  it('enforces 60 requests per minute per user rate limit', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    // Simulate 60 successful requests
    for (let i = 0; i < 60; i++) {
      expect(checkRateLimit('burst-user')).toBe(true)
    }

    // 61st request should be rejected
    expect(checkRateLimit('burst-user')).toBe(false)
  })
})
