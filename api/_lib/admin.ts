import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function initAdmin() {
  if (getApps().length > 0) {
    return
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY
  const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  } else if (projectId) {
    initializeApp({ projectId })
  } else {
    initializeApp()
  }
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
  initAdmin()
  const auth = getAuth()
  const decoded = await auth.verifyIdToken(idToken)
  return {
    uid: decoded.uid,
    email: decoded.email,
    email_verified: decoded.email_verified,
  }
}
