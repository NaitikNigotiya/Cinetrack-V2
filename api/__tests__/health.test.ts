import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import handler from '../health'

vi.mock('../_lib/admin', () => ({
  initAdmin: vi.fn(() => ({ ok: true, status: 'ok' })),
}))

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(() => [{ name: '[DEFAULT]' }]),
}))

interface MockResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}

function createMockReqRes(options: { method?: string }) {
  const req = {
    method: options.method ?? 'GET',
    headers: {},
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

describe('Health Check Endpoint GET /api/health', () => {
  beforeEach(() => {
    process.env.TMDB_READ_TOKEN = 'mock-tmdb-token'
  })

  it('returns 200 with boolean health fields and adminInit status', async () => {
    const { req, res, mockRes } = createMockReqRes({ method: 'GET' })

    await handler(req, res)

    expect(mockRes.statusCode).toBe(200)
    expect(mockRes.headers['content-type']).toBe('application/json')
    const json = JSON.parse(mockRes.body)
    expect(json).toEqual({
      ok: true,
      tmdbTokenPresent: true,
      firebaseAdminOk: true,
      adminInit: 'ok',
    })
    expect(typeof json.ok).toBe('boolean')
    expect(typeof json.tmdbTokenPresent).toBe('boolean')
    expect(typeof json.firebaseAdminOk).toBe('boolean')
    expect(json.adminInit).toBe('ok')
  })

  it('returns 204 on OPTIONS preflight', async () => {
    const { req, res, mockRes } = createMockReqRes({ method: 'OPTIONS' })
    await handler(req, res)
    expect(mockRes.statusCode).toBe(204)
  })

  it('returns 405 on non-GET', async () => {
    const { req, res, mockRes } = createMockReqRes({ method: 'POST' })
    await handler(req, res)
    expect(mockRes.statusCode).toBe(405)
  })
})
