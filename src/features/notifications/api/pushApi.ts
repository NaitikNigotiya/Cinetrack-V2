import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import { createZodConverter } from '@/services/firebase/converters'
import {
  PushPreferencesSchema,
  PushTokenDocSchema,
  type PushPreferences,
  type PushTokenDoc,
} from '../schemas/push.schema'
import { hashToken } from '../lib/tokenHash'

const prefsConverter = createZodConverter(PushPreferencesSchema, 'pushPreferences')
const tokenConverter = createZodConverter(PushTokenDocSchema, 'pushToken')

export async function fetchPushPreferences(uid: string): Promise<PushPreferences> {
  const ref = doc(firestore, `users/${uid}/settings/push`).withConverter(prefsConverter)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return snap.data()
  }

  const defaultTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const defaults: PushPreferences = {
    pushEnabled: false,
    genres: [],
    includeTv: true,
    digestHourLocal: 18,
    lastSentAt: null,
    recentlyNotifiedKeys: [],
    timezone: defaultTz,
  }
  return defaults
}

export async function updatePushPreferences(
  uid: string,
  prefs: Partial<PushPreferences>
): Promise<void> {
  const ref = doc(firestore, `users/${uid}/settings/push`)
  await setDoc(
    ref,
    {
      ...prefs,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

function detectDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device'
  const ua = navigator.userAgent
  let browser = 'Browser'
  if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'

  let os = 'Device'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Macintosh')) os = 'macOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Linux')) os = 'Linux'

  return `${browser} on ${os}`
}

export async function registerPushToken(uid: string, token: string): Promise<string> {
  const tokenHash = await hashToken(token)
  const ref = doc(firestore, `users/${uid}/settings/push/tokens/${tokenHash}`).withConverter(
    tokenConverter
  )

  const docData: PushTokenDoc = {
    token,
    tokenHash,
    deviceLabel: detectDeviceLabel(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  }

  await setDoc(ref, docData, { merge: true })
  return tokenHash
}

export async function unregisterPushToken(uid: string, tokenHash: string): Promise<void> {
  const ref = doc(firestore, `users/${uid}/settings/push/tokens/${tokenHash}`)
  await deleteDoc(ref)
}

export async function fetchRegisteredTokens(uid: string): Promise<PushTokenDoc[]> {
  const colRef = collection(firestore, `users/${uid}/settings/push/tokens`).withConverter(
    tokenConverter
  )
  const snap = await getDocs(colRef)
  return snap.docs.map((d) => d.data())
}
