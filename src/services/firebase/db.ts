import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore'
import { app } from './app'

let firestoreInstance: Firestore

try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  })
} catch {
  // If already initialized (e.g. HMR or tests), use default
  firestoreInstance = initializeFirestore(app, {})
}

export const db: Firestore = firestoreInstance

// Connect to emulator in development if specified
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
  } catch {
    // Emulator already connected
  }
}
