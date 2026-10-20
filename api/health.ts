import type { IncomingMessage, ServerResponse } from 'node:http'
import { getApps } from 'firebase-admin/app'
import { initAdmin } from './_lib/admin'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED', path: '/api/health' }))
    return
  }

  const rawToken = (
    process.env.TMDB_READ_TOKEN ||
    process.env.TMDB_API_KEY ||
    process.env.VITE_TMDB_READ_TOKEN ||
    process.env.VITE_TMDB_API_KEY ||
    ''
  ).trim().replace(/^["']|["']$/g, '')
  const tmdbTokenPresent = rawToken.length > 0

  let firebaseAdminOk = false
  let adminInit = 'error:uninitialized'
  try {
    const adminRes = initAdmin()
    firebaseAdminOk = adminRes.ok && getApps().length > 0
    adminInit = adminRes.status
  } catch (err: unknown) {
    console.error('[Health Check Error] Firebase Admin initialization failed:', err)
    firebaseAdminOk = false
    const msg = err instanceof Error ? err.message : String(err)
    adminInit = `error:${msg.slice(0, 30)}`
  }

  const ok = tmdbTokenPresent && firebaseAdminOk

  res.statusCode = 200
  res.end(
    JSON.stringify({
      ok,
      tmdbTokenPresent,
      firebaseAdminOk,
      adminInit,
    })
  )
}
