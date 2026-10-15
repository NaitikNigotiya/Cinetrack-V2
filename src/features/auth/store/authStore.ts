import { create } from 'zustand'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/services/firebase/auth'
import { getUserDocRef, getPreferencesDocRef } from '@/services/firebase/collections'
import { getDoc } from 'firebase/firestore'
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
  fetchUserData: (uid: string) => Promise<void>
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
  fetchUserData: async (uid: string) => {
    try {
      const [userSnap, prefSnap] = await Promise.all([
        getDoc(getUserDocRef(uid)),
        getDoc(getPreferencesDocRef(uid)),
      ])
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
  useAuthStore.setState({ user: firebaseUser, isLoading: false, isInitialized: true })
  if (firebaseUser) {
    await useAuthStore.getState().fetchUserData(firebaseUser.uid)
  } else {
    useAuthStore.setState({ profile: null, preferences: null })
  }
})
