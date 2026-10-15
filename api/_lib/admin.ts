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

/**
 * Verifies a Firebase ID token and returns the caller's uid.
 * Does not log tokens.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<string> {
  initAdmin()
  const auth = getAuth()
  const decoded = await auth.verifyIdToken(idToken)
  return decoded.uid
}
