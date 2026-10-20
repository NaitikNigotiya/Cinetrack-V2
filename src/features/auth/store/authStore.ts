import { create } from 'zustand'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/services/firebase/auth'
import {
  getUserDocRef,
  getPreferencesDocRef,
  getStatsSummaryDocRef,
} from '@/services/firebase/collections'
import { getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { UserProfile, UserPreferences } from '@/shared/schemas'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  preferences: UserPreferences | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setPreferences: (preferences: UserPreferences | null) => void
  fetchUserData: (uid: string, currentUser?: User | null) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  preferences: null,
  isLoading: true,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setPreferences: (preferences) => set({ preferences }),
  fetchUserData: async (uid: string, currentUser?: User | null) => {
    try {
      const [userSnap, prefSnap] = await Promise.all([
        getDoc(getUserDocRef(uid)),
        getDoc(getPreferencesDocRef(uid)),
      ])

      // Auto-create profile and default settings on owner first login (Requirement 6)
      if (!userSnap.exists() && currentUser) {
        const now = serverTimestamp()
        const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Owner'
        const email = currentUser.email || ''
        const photoURL = currentUser.photoURL || null
        const timezone = typeof Intl !== 'undefined'
          ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
          : 'UTC'

        const defaultProfile: UserProfile = {
          displayName,
          email,
          photoURL,
          region: 'US',
          language: 'en-US',
          timezone,
          onboarded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          schemaVersion: 1,
        }

        const defaultPreferences: UserPreferences = {
          theme: 'dark',
          ratingScale: 'ten',
          defaultStatus: 'plan_to_watch',
          compactCards: false,
          showSpoilers: false,
          weekStartsOn: 0,
          hiddenTmdbKeys: [],
          updatedAt: new Date(),
        }

        await Promise.all([
          setDoc(getUserDocRef(uid), {
            ...defaultProfile,
            createdAt: now,
            updatedAt: now,
          }),
          setDoc(getPreferencesDocRef(uid), {
            ...defaultPreferences,
            updatedAt: now,
          }),
          setDoc(getStatsSummaryDocRef(uid), {
            moviesWatched: 0,
            episodesWatched: 0,
            minutesWatched: 0,
            titlesCompleted: 0,
            ratingSum: 0,
            ratingCount: 0,
            genreCounts: {},
            statusCounts: {},
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDay: null,
            updatedAt: now,
          }),
        ])

        set({
          profile: defaultProfile,
          preferences: defaultPreferences,
        })
        return
      }

      set({
        profile: userSnap.exists() ? userSnap.data() : null,
        preferences: prefSnap.exists() ? prefSnap.data() : null,
      })
    } catch (err) {
      console.warn('Could not fetch user profile or preferences:', err)
    }
  },
}))

// Synchronize Firebase auth listener
onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser && import.meta.env.DEV) {
    const devOwnerEmail = (import.meta.env.VITE_OWNER_EMAIL || 'nigotiyanaitik@gmail.com').trim().toLowerCase()
    const devOwnerUid = (import.meta.env.VITE_OWNER_UID || '79VupMY8L0UVHWo7gJATx03zJOR2').trim()
    const devUser = {
      uid: devOwnerUid,
      email: devOwnerEmail,
      displayName: 'Owner',
      emailVerified: true,
    } as unknown as User
    useAuthStore.setState({ user: devUser, isLoading: false, isInitialized: true })
    return
  }

  useAuthStore.setState({ user: firebaseUser, isLoading: false, isInitialized: true })
  if (firebaseUser) {
    await useAuthStore.getState().fetchUserData(firebaseUser.uid, firebaseUser)
  } else {
    useAuthStore.setState({ profile: null, preferences: null })
  }
})
