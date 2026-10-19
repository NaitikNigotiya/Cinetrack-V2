import { create } from 'zustand'
import {
  collection,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import {
  LibraryEntrySchema,
  HistoryEventSchema,
  CollectionSchema,
  PlannedWatchSchema,
  type PlannedWatch,
} from '@/shared/schemas'
import type { DomainLibraryEntry, DomainHistoryEvent, DomainCollection } from './types'

interface AppStoreState {
  library: DomainLibraryEntry[]
  history: DomainHistoryEvent[]
  collections: DomainCollection[]
  plannedWatches: PlannedWatch[]
  isReady: boolean
  error: Error | null
  activeUid: string | null

  // State setters
  setLibrary: (entries: DomainLibraryEntry[]) => void
  setHistory: (events: DomainHistoryEvent[]) => void
  setCollections: (collections: DomainCollection[]) => void
  setPlannedWatches: (watches: PlannedWatch[]) => void
  setReady: (ready: boolean) => void
  setError: (error: Error | null) => void

  // Optimistic update actions
  optimisticUpsertLibraryEntry: (entry: DomainLibraryEntry) => void
  optimisticRemoveLibraryEntry: (titleKey: string) => void
  optimisticAddHistoryEvent: (event: DomainHistoryEvent) => void
  optimisticRemoveHistoryEvent: (eventId: string) => void
}

export const useAppStore = create<AppStoreState>((set) => ({
  library: [],
  history: [],
  collections: [],
  plannedWatches: [],
  isReady: false,
  error: null,
  activeUid: null,

  setLibrary: (library) => set({ library }),
  setHistory: (history) => set({ history }),
  setCollections: (collections) => set({ collections }),
  setPlannedWatches: (plannedWatches) => set({ plannedWatches }),
  setReady: (isReady) => set({ isReady }),
  setError: (error) => set({ error }),

  optimisticUpsertLibraryEntry: (entry) =>
    set((state) => {
      const idx = state.library.findIndex((e) => e.titleKey === entry.titleKey)
      if (idx >= 0) {
        const next = [...state.library]
        next[idx] = { ...next[idx], ...entry }
        return { library: next }
      }
      return { library: [entry, ...state.library] }
    }),

  optimisticRemoveLibraryEntry: (titleKey) =>
    set((state) => ({
      library: state.library.filter((e) => e.titleKey !== titleKey),
    })),

  optimisticAddHistoryEvent: (event) =>
    set((state) => ({
      history: [event, ...state.history],
    })),

  optimisticRemoveHistoryEvent: (eventId) =>
    set((state) => ({
      history: state.history.filter((h) => h.eventId !== eventId),
    })),
}))

let activeUnsubscribers: Unsubscribe[] = []
let currentSubscribedUid: string | null = null

/**
 * Top-level real-time subscription to user's library, history, collections, and planned watches.
 * Mounted once in AppShell / App layout.
 * Zod validation is applied to every read, dropping invalid docs with console.warn without crashing.
 */
export function subscribeUserData(uid: string): () => void {
  if (currentSubscribedUid === uid && activeUnsubscribers.length > 0) {
    return () => {}
  }

  // Clear previous subscriptions
  activeUnsubscribers.forEach((unsub) => unsub())
  activeUnsubscribers = []
  currentSubscribedUid = uid

  const store = useAppStore.getState()
  setReadyState(false)
  store.setError(null)

  let libLoaded = false
  let histLoaded = false

  const checkInitialReady = () => {
    if (libLoaded && histLoaded) {
      useAppStore.setState({ isReady: true })
    }
  }

  function setReadyState(ready: boolean) {
    useAppStore.setState({ isReady: ready })
  }

  // 1. Library Subscription
  const libCol = collection(firestore, `users/${uid}/library`)
  const unsubLib = onSnapshot(
    libCol,
    (snapshot) => {
      const validEntries: DomainLibraryEntry[] = []
      snapshot.docs.forEach((docSnap) => {
        const raw = docSnap.data()
        const parsed = LibraryEntrySchema.safeParse(raw)
        if (parsed.success) {
          validEntries.push(parsed.data as unknown as DomainLibraryEntry)
        } else {
          console.warn(`[CineTrack Data Warning] Dropping invalid library doc ${docSnap.id}:`, parsed.error)
        }
      })
      useAppStore.setState({ library: validEntries })
      libLoaded = true
      checkInitialReady()
    },
    (err) => {
      console.error('[CineTrack Sync Error] Library subscription failed:', err)
      useAppStore.setState({ error: err, isReady: true })
    }
  )
  activeUnsubscribers.push(unsubLib)

  // 2. History Subscription
  const histCol = collection(firestore, `users/${uid}/history`)
  const unsubHist = onSnapshot(
    histCol,
    (snapshot) => {
      const validEvents: DomainHistoryEvent[] = []
      snapshot.docs.forEach((docSnap) => {
        const raw = docSnap.data()
        const parsed = HistoryEventSchema.safeParse(raw)
        if (parsed.success) {
          validEvents.push(parsed.data as unknown as DomainHistoryEvent)
        } else {
          console.warn(`[CineTrack Data Warning] Dropping invalid history doc ${docSnap.id}:`, parsed.error)
        }
      })
      useAppStore.setState({ history: validEvents })
      histLoaded = true
      checkInitialReady()
    },
    (err) => {
      console.error('[CineTrack Sync Error] History subscription failed:', err)
      useAppStore.setState({ error: err, isReady: true })
    }
  )
  activeUnsubscribers.push(unsubHist)

  // 3. Collections Subscription
  const colCol = collection(firestore, `users/${uid}/collections`)
  const unsubCol = onSnapshot(
    colCol,
    (snapshot) => {
      const validCols: DomainCollection[] = []
      snapshot.docs.forEach((docSnap) => {
        const raw = docSnap.data()
        const parsed = CollectionSchema.safeParse(raw)
        if (parsed.success) {
          validCols.push(parsed.data as unknown as DomainCollection)
        } else {
          console.warn(`[CineTrack Data Warning] Dropping invalid collection doc ${docSnap.id}:`, parsed.error)
        }
      })
      useAppStore.setState({ collections: validCols })
    },
    (err) => {
      console.warn('[CineTrack Sync Warning] Collections subscription warning:', err)
    }
  )
  activeUnsubscribers.push(unsubCol)

  // 4. Planned Watches Subscription
  const pwCol = collection(firestore, `users/${uid}/plannedWatches`)
  const unsubPw = onSnapshot(
    pwCol,
    (snapshot) => {
      const validPw: PlannedWatch[] = []
      snapshot.docs.forEach((docSnap) => {
        const raw = docSnap.data()
        const parsed = PlannedWatchSchema.safeParse(raw)
        if (parsed.success) {
          validPw.push(parsed.data)
        }
      })
      useAppStore.setState({ plannedWatches: validPw })
    },
    (err) => {
      console.warn('[CineTrack Sync Warning] PlannedWatches subscription warning:', err)
    }
  )
  activeUnsubscribers.push(unsubPw)

  return () => {
    activeUnsubscribers.forEach((u) => u())
    activeUnsubscribers = []
    currentSubscribedUid = null
  }
}
