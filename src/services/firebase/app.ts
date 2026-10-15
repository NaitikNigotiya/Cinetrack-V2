import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'cinetrack-v2.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'cinetrack-v2',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'cinetrack-v2.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
}

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
