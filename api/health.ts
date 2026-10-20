import type { IncomingMessage, ServerResponse } from 'node:http'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

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

export function checkAdminInit(): { ok: boolean; status: string } {
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
      // Ignore parse error
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
      console.error('[Firebase Admin Init Error]', msg)
      const shortReason = msg.toLowerCase().includes('private key')
        ? 'invalid_private_key'
        : 'cert_failed'
      return { ok: false, status: `error:${shortReason}` }
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
    res.end(
      JSON.stringify({
        error: 'Method Not Allowed',
        code: 'METHOD_NOT_ALLOWED',
        path: '/api/health',
      })
    )
    return
  }

  try {
    const rawToken = (
      process.env.TMDB_READ_TOKEN ||
      process.env.TMDB_API_KEY ||
      process.env.VITE_TMDB_READ_TOKEN ||
      process.env.VITE_TMDB_API_KEY ||
      ''
    )
      .trim()
      .replace(/^["']|["']$/g, '')
    const tmdbTokenPresent = rawToken.length > 0

    let firebaseAdminOk = false
    let adminInit = 'error:uninitialized'
    try {
      const adminRes = checkAdminInit()
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
  } catch (fatalErr: unknown) {
    console.error('[Health Check Fatal Error]', fatalErr)
    res.statusCode = 500
    res.end(
      JSON.stringify({
        ok: false,
        error: 'Internal health check failure',
        details: fatalErr instanceof Error ? fatalErr.message : String(fatalErr),
      })
    )
  }
}
