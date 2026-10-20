import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import handler from '../[...path]'
import { normalizeTmdbPath } from '../[...path]'
import { resetRateLimiter } from '../../_lib/rateLimiter'

const TEST_OWNER_EMAIL = 'nigotiyanaitik@gmail.com'

vi.mock('../../_lib/admin', () => ({
  verifyFirebaseIdToken: vi.fn(async (token: string) => {
    if (token === 'valid-owner-token' || token === 'owner-token') {
      return {
        uid: 'user-owner',
        email: TEST_OWNER_EMAIL,
        email_verified: true,
      }
    }
    if (token === 'non-owner-token') {
      return {
        uid: 'user-intruder',
        email: 'intruder@example.com',
        email_verified: true,
      }
    }
    throw new Error('Invalid token')
  }),
  initAdmin: vi.fn(() => ({ ok: true, status: 'ok' })),
}))

interface MockResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}

function createVercelReqRes(options: {
  method?: string
  url?: string
  query?: Record<string, string | string[]>
  authHeader?: string | null
}): {
  req: IncomingMessage
  res: ServerResponse
  mockRes: MockResponse
} {
  const req = {
    method: options.method ?? 'GET',
    url: options.url ?? '/api/tmdb/discover/movie',
    query: options.query,
    headers: {
      host: 'cinetrack-v2-bice.vercel.app',
      ...(options.authHeader === null
        ? {}
        : { authorization: options.authHeader ?? 'Bearer valid-owner-token' }),
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

describe('Vercel-style Request Handling & Path Normalization', () => {
  beforeEach(() => {
    process.env.TMDB_READ_TOKEN = 'mock-tmdb-read-token'
    process.env.OWNER_EMAIL = TEST_OWNER_EMAIL
    resetRateLimiter()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('normalizeTmdbPath unit tests', () => {
    it('handles query param as an array', () => {
      expect(normalizeTmdbPath(undefined, ['discover', 'movie'])).toBe('discover/movie')
      expect(normalizeTmdbPath('/api/tmdb/[...path]', ['movie', '550', 'credits'])).toBe('movie/550/credits')
    })

    it('handles query param as a string', () => {
      expect(normalizeTmdbPath(undefined, 'discover/movie')).toBe('discover/movie')
      expect(normalizeTmdbPath('/api/tmdb/[...path]', 'tv/1396/season/1')).toBe('tv/1396/season/1')
    })

    it('handles missing query param with path derived from req.url', () => {
      expect(normalizeTmdbPath('/api/tmdb/discover/movie?language=en-US', undefined)).toBe('discover/movie')
      expect(normalizeTmdbPath('/api/tmdb/trending/all/day', undefined)).toBe('trending/all/day')
      expect(normalizeTmdbPath('/api/tmdb/person/287', undefined)).toBe('person/287')
    })

    it('handles empty path', () => {
      expect(normalizeTmdbPath('/api/tmdb', undefined)).toBe('')
      expect(normalizeTmdbPath('/api/tmdb/', undefined)).toBe('')
      expect(normalizeTmdbPath(undefined, undefined)).toBe('')
    })
  })

  describe('Vercel-style proxy execution', () => {
    const mockSuccess = { page: 1, results: [{ id: 1, title: 'Mock' }] }

    beforeEach(() => {
      const fetchMock = vi.fn().mockImplementation(() =>
        new Response(JSON.stringify(mockSuccess), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      vi.stubGlobal('fetch', fetchMock)
    })

    it('returns 200 for allowed endpoint with array path param', async () => {
      const { req, res, mockRes } = createVercelReqRes({
        url: '/api/tmdb/[...path]?language=en-US',
        query: { path: ['discover', 'movie'] },
      })

      await handler(req, res)

      expect(mockRes.statusCode).toBe(200)
      expect(JSON.parse(mockRes.body)).toEqual(mockSuccess)
    })

    it('returns 200 for allowed endpoint with string path param', async () => {
      const { req, res, mockRes } = createVercelReqRes({
        url: '/api/tmdb/[...path]?region=US',
        query: { path: 'discover/tv' },
      })

      await handler(req, res)

      expect(mockRes.statusCode).toBe(200)
      expect(JSON.parse(mockRes.body)).toEqual(mockSuccess)
    })

    it('returns 200 for allowed endpoint with missing query param and path in req.url', async () => {
      const { req, res, mockRes } = createVercelReqRes({
        url: '/api/tmdb/trending/all/day?language=en-US',
        query: undefined,
      })

      await handler(req, res)

      expect(mockRes.statusCode).toBe(200)
      expect(JSON.parse(mockRes.body)).toEqual(mockSuccess)
    })

    it('returns 200 for all required endpoints in prompt item 2', async () => {
      const endpoints = [
        'discover/movie',
        'discover/tv',
        'trending/all/day',
        'trending/movie/week',
        'movie/550',
        'tv/1396',
        'tv/1396/season/1',
        'tv/1396/season/1/episode/1',
        'search/multi',
        'search/movie',
        'search/person',
        'genre/movie/list',
        'genre/tv/list',
        'person/287',
        'person/287/movie_credits',
        'watch/providers/movie',
        'movie/550/credits',
        'movie/550/aggregate_credits',
        'movie/550/images',
        'movie/550/watch/providers',
      ]

      for (const ep of endpoints) {
        const { req, res, mockRes } = createVercelReqRes({
          url: `/api/tmdb/${ep}`,
        })
        await handler(req, res)
        expect(mockRes.statusCode).toBe(200)
      }
    })

    it('returns JSON 400 for empty path with { error, code, path }', async () => {
      const { req, res, mockRes } = createVercelReqRes({
        url: '/api/tmdb',
        query: {},
      })

      await handler(req, res)

      expect(mockRes.statusCode).toBe(400)
      const data = JSON.parse(mockRes.body)
      expect(data.code).toBe('BAD_PATH')
      expect(data.error).toBeDefined()
      expect(data.path).toBe('')
    })

    it('returns JSON 400 for disallowed endpoints with { error, code, path }', async () => {
      const { req, res, mockRes } = createVercelReqRes({
        url: '/api/tmdb/admin/secrets',
        query: { path: 'admin/secrets' },
      })

      await handler(req, res)

      expect(mockRes.statusCode).toBe(400)
      const data = JSON.parse(mockRes.body)
      expect(data.code).toBe('PATH_NOT_ALLOWED')
      expect(data.error).toBeDefined()
      expect(data.path).toBe('admin/secrets')
    })

    it('returns JSON 403 NOT_OWNER for non-owner tokens', async () => {
      const { req, res, mockRes } = createVercelReqRes({
        url: '/api/tmdb/discover/movie',
        authHeader: 'Bearer non-owner-token',
      })

      await handler(req, res)

      expect(mockRes.statusCode).toBe(403)
      const data = JSON.parse(mockRes.body)
      expect(data.code).toBe('NOT_OWNER')
      expect(data.error).toBeDefined()
      expect(data.path).toBe('discover/movie')
    })

    describe('Auth path end-to-end verification (Requirement 6)', () => {
      it('no token → 401 MISSING_TOKEN', async () => {
        const { req, res, mockRes } = createVercelReqRes({
          url: '/api/tmdb/discover/movie',
          authHeader: null,
        })
        await handler(req, res)
        expect(mockRes.statusCode).toBe(401)
        const data = JSON.parse(mockRes.body)
        expect(data.code).toBe('MISSING_TOKEN')
        expect(data.error.code).toBe('MISSING_TOKEN')
      })

      it('bad token → 401 INVALID_TOKEN', async () => {
        const { req, res, mockRes } = createVercelReqRes({
          url: '/api/tmdb/discover/movie',
          authHeader: 'Bearer invalid-token',
        })
        await handler(req, res)
        expect(mockRes.statusCode).toBe(401)
        const data = JSON.parse(mockRes.body)
        expect(data.code).toBe('INVALID_TOKEN')
        expect(data.error.code).toBe('INVALID_TOKEN')
      })

      it('non-owner → 403 NOT_OWNER', async () => {
        const { req, res, mockRes } = createVercelReqRes({
          url: '/api/tmdb/discover/movie',
          authHeader: 'Bearer non-owner-token',
        })
        await handler(req, res)
        expect(mockRes.statusCode).toBe(403)
        const data = JSON.parse(mockRes.body)
        expect(data.code).toBe('NOT_OWNER')
        expect(data.error.code).toBe('NOT_OWNER')
      })

      it('owner → 200', async () => {
        const { req, res, mockRes } = createVercelReqRes({
          url: '/api/tmdb/discover/movie',
          authHeader: 'Bearer owner-token',
        })
        await handler(req, res)
        expect(mockRes.statusCode).toBe(200)
        const data = JSON.parse(mockRes.body)
        expect(data).toEqual(mockSuccess)
      })
    })
  })
})
