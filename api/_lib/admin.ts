import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export interface AdminInitResult {
  ok: boolean
  status: string
}

let lastInitResult: AdminInitResult = { ok: false, status: 'error:uninitialized' }

export function normalizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined
  let clean = key.trim()
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim()
  }
  // Replace escaped \r\n and \n sequences with actual newlines
  clean = clean.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
  return clean
}

export function initAdmin(): AdminInitResult {
  if (getApps().length > 0) {
    lastInitResult = { ok: true, status: 'ok' }
    return lastInitResult
  }

  // Parse service account JSON if provided in env
  let serviceAccountJson: Record<string, string> | null = null
  const rawServiceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (rawServiceAccount) {
    try {
      serviceAccountJson = JSON.parse(rawServiceAccount)
    } catch {
      // Ignore JSON parse errors for non-JSON content
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
      lastInitResult = { ok: true, status: 'ok' }
      return lastInitResult
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Firebase Admin Init Error]', msg)
      const shortReason = msg.toLowerCase().includes('private key')
        ? 'invalid_private_key'
        : 'cert_failed'
      lastInitResult = { ok: false, status: `error:${shortReason}` }
      return lastInitResult
    }
  } else if (projectId) {
    try {
      initializeApp({ projectId })
      lastInitResult = { ok: true, status: 'ok' }
      return lastInitResult
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      lastInitResult = { ok: false, status: `error:${msg.slice(0, 30)}` }
      return lastInitResult
    }
  }

  lastInitResult = { ok: false, status: 'error:missing_credentials' }
  return lastInitResult
}

export function getAdminInitStatus(): AdminInitResult {
  return lastInitResult
}

export interface DecodedAuthToken {
  uid: string
  email?: string
  email_verified?: boolean
}

/**
 * Verifies a Firebase ID token and returns the caller's decoded auth token.
 * Never logs tokens or emails.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedAuthToken> {
  // 1. Try Firebase Admin SDK verification if credentials are configured
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
    // 2. Fallback: Verify ID token securely via Google Identity Toolkit REST API
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
        // Fall through to throw original admin error
      }
    }

    throw adminErr
  }
}
