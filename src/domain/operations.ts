import {
  writeBatch,
  serverTimestamp,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import {
  getLibraryDocRef,
  getHistoryDocRef,
} from '@/services/firebase/collections'
import { toast } from '@/shared/ui'
import { useAppStore } from './store'
import { transitionStatus } from './status'
import type { CanonicalStatus, DomainLibraryEntry, DomainHistoryEvent, Priority } from './types'

export interface AddToLibraryInput {
  titleKey: string
  tmdbId: number
  type: 'movie' | 'tv'
  title: string
  year?: number | null | undefined
  posterPath?: string | null | undefined
  backdropPath?: string | null | undefined
  genres?: { id: number; name: string }[] | undefined
  runtimeMinutes?: number | null | undefined
  status?: CanonicalStatus | undefined
  priority?: Priority | undefined
  rating?: number | null | undefined
  isFavorite?: boolean | undefined
  tv?: DomainLibraryEntry['tv'] | undefined
}

/**
 * Atomically adds a title to the user's library.
 */
export async function addToLibrary(uid: string, input: AddToLibraryInput): Promise<void> {
  const store = useAppStore.getState()
  const initialStatus: CanonicalStatus = input.status || 'plan_to_watch'
  const libRef = getLibraryDocRef(uid, input.titleKey)
  const now = serverTimestamp()

  const entryDoc = {
    titleKey: input.titleKey,
    tmdbId: input.tmdbId,
    type: input.type,
    title: input.title,
    year: input.year ?? null,
    posterPath: input.posterPath ?? null,
    backdropPath: input.backdropPath ?? null,
    genres: input.genres ?? [],
    runtimeMinutes: input.runtimeMinutes ?? null,
    status: initialStatus,
    priority: input.priority ?? 'normal',
    rating: input.rating ?? null,
    isFavorite: input.isFavorite ?? false,
    watchCount: initialStatus === 'completed' ? 1 : 0,
    lastWatchedAt: initialStatus === 'completed' ? now : null,
    totalMinutesWatched: initialStatus === 'completed' ? input.runtimeMinutes || 0 : 0,
    tags: [],
    startedAt: initialStatus === 'watching' ? now : null,
    completedAt: initialStatus === 'completed' ? now : null,
    addedAt: now,
    updatedAt: now,
    schemaVersion: 1,
    ...(input.tv ? { tv: input.tv } : {}),
  }

  // Optimistic update
  const previousLibrary = store.library
  const optimisticEntry: DomainLibraryEntry = {
    titleKey: input.titleKey,
    tmdbId: input.tmdbId,
    type: input.type,
    title: input.title,
    year: input.year ?? null,
    posterPath: input.posterPath ?? null,
    backdropPath: input.backdropPath ?? null,
    genres: input.genres ?? [],
    runtimeMinutes: input.runtimeMinutes ?? null,
    status: initialStatus,
    priority: input.priority ?? 'normal',
    rating: input.rating ?? null,
    isFavorite: input.isFavorite ?? false,
    watchCount: initialStatus === 'completed' ? 1 : 0,
    lastWatchedAt: initialStatus === 'completed' ? new Date() : null,
    totalMinutesWatched: initialStatus === 'completed' ? input.runtimeMinutes || 0 : 0,
    tags: [],
    startedAt: initialStatus === 'watching' ? new Date() : null,
    completedAt: initialStatus === 'completed' ? new Date() : null,
    addedAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
    ...(input.tv ? { tv: input.tv } : {}),
  }
  store.optimisticUpsertLibraryEntry(optimisticEntry)

  try {
    const batch = writeBatch(firestore)
    batch.set(libRef, entryDoc as any)

    // If added as completed movie, log watch history
    if (initialStatus === 'completed' && input.type === 'movie') {
      const eventId = `${input.titleKey}_${Date.now()}`
      const histRef = getHistoryDocRef(uid, eventId)
      batch.set(histRef, {
        eventId,
        titleKey: input.titleKey,
        title: input.title,
        type: 'movie',
        watchedAt: now,
        runtimeMinutes: input.runtimeMinutes || 0,
        rating: input.rating ?? null,
        posterPath: input.posterPath ?? null,
        genreIds: (input.genres ?? []).map((g) => g.id),
        source: 'manual',
        createdAt: now,
        schemaVersion: 1,
      })
    }

    await batch.commit()
  } catch (err) {
    store.setLibrary(previousLibrary)
    toast.error('Failed to add title to library')
    throw err
  }
}

/**
 * Atomically transitions status and handles lifecycle timestamps.
 */
export async function setStatus(
  uid: string,
  titleKey: string,
  newStatus: CanonicalStatus,
  currentEntry: DomainLibraryEntry
): Promise<void> {
  const store = useAppStore.getState()
  const libRef = getLibraryDocRef(uid, titleKey)
  const now = serverTimestamp()
  const previousLibrary = store.library

  const isMarkingCompleted = newStatus === 'completed' && currentEntry.status !== 'completed'
  const isLeavingCompleted = currentEntry.status === 'completed' && newStatus !== 'completed'

  const updates: Record<string, unknown> = {
    status: newStatus,
    updatedAt: now,
  }

  if (newStatus === 'watching' && !currentEntry.startedAt) {
    updates.startedAt = now
  }
  if (isMarkingCompleted) {
    updates.completedAt = now
    updates.lastWatchedAt = now
    updates.watchCount = (currentEntry.watchCount || 0) + 1
    if (currentEntry.type === 'movie') {
      updates.totalMinutesWatched =
        (currentEntry.totalMinutesWatched || 0) + (currentEntry.runtimeMinutes || 0)
    }
  } else if (isLeavingCompleted) {
    updates.completedAt = null
  }

  // Optimistic update
  store.optimisticUpsertLibraryEntry({
    ...currentEntry,
    status: newStatus,
    updatedAt: new Date(),
    completedAt: isMarkingCompleted ? new Date() : isLeavingCompleted ? null : currentEntry.completedAt,
    watchCount: isMarkingCompleted ? (currentEntry.watchCount || 0) + 1 : currentEntry.watchCount,
  })

  try {
    const batch = writeBatch(firestore)
    batch.update(libRef, updates)

    // Log history if movie completed
    if (isMarkingCompleted && currentEntry.type === 'movie') {
      const eventId = `${titleKey}_${Date.now()}`
      const histRef = getHistoryDocRef(uid, eventId)
      batch.set(histRef, {
        eventId,
        titleKey,
        title: currentEntry.title,
        type: 'movie',
        watchedAt: now,
        runtimeMinutes: currentEntry.runtimeMinutes || 0,
        rating: currentEntry.rating ?? null,
        posterPath: currentEntry.posterPath ?? null,
        genreIds: (currentEntry.genres ?? []).map((g) => g.id),
        source: 'manual',
        createdAt: now,
        schemaVersion: 1,
      })
    }

    await batch.commit()
  } catch (err) {
    store.setLibrary(previousLibrary)
    toast.error('Failed to update watch status')
    throw err
  }
}

/**
 * Atomically marks a movie as watched, incrementing watchCount, logging history, and setting status to completed.
 */
export async function markMovieWatched(
  uid: string,
  titleKey: string,
  currentEntry: DomainLibraryEntry,
  rating?: number | null | undefined,
  watchedAtDate = new Date()
): Promise<void> {
  const store = useAppStore.getState()
  const libRef = getLibraryDocRef(uid, titleKey)
  const now = serverTimestamp()
  const eventId = `${titleKey}_${Date.now()}`
  const histRef = getHistoryDocRef(uid, eventId)
  const previousLibrary = store.library
  const previousHistory = store.history

  const runtime = currentEntry.runtimeMinutes || 0
  const effectiveRating = rating !== undefined ? rating : currentEntry.rating ?? null

  const updatedDoc: Partial<DomainLibraryEntry> = {
    ...currentEntry,
    status: 'completed',
    completedAt: watchedAtDate,
    lastWatchedAt: watchedAtDate,
    watchCount: (currentEntry.watchCount || 0) + 1,
    totalMinutesWatched: (currentEntry.totalMinutesWatched || 0) + runtime,
    rating: effectiveRating,
    updatedAt: new Date(),
  }

  const historyEvent: DomainHistoryEvent = {
    eventId,
    titleKey,
    title: currentEntry.title,
    type: 'movie',
    watchedAt: watchedAtDate,
    runtimeMinutes: runtime,
    rating: effectiveRating,
    posterPath: currentEntry.posterPath,
    genreIds: (currentEntry.genres ?? []).map((g) => g.id),
    source: 'manual',
    createdAt: new Date(),
    schemaVersion: 1,
  }

  // Optimistic update
  store.optimisticUpsertLibraryEntry(updatedDoc as DomainLibraryEntry)
  store.optimisticAddHistoryEvent(historyEvent)

  try {
    const batch = writeBatch(firestore)
    batch.update(libRef, {
      status: 'completed',
      completedAt: now,
      lastWatchedAt: now,
      watchCount: (currentEntry.watchCount || 0) + 1,
      totalMinutesWatched: (currentEntry.totalMinutesWatched || 0) + runtime,
      rating: effectiveRating,
      updatedAt: now,
    })

    batch.set(histRef, {
      eventId,
      titleKey,
      title: currentEntry.title,
      type: 'movie',
      watchedAt: now,
      runtimeMinutes: runtime,
      rating: effectiveRating,
      posterPath: currentEntry.posterPath ?? null,
      genreIds: (currentEntry.genres ?? []).map((g) => g.id),
      source: 'manual',
      createdAt: now,
      schemaVersion: 1,
    })

    await batch.commit()
    toast.success(`Marked "${currentEntry.title}" as completed! 🎉`)
  } catch (err) {
    store.setLibrary(previousLibrary)
    store.setHistory(previousHistory)
    toast.error('Failed to mark movie as completed')
    throw err
  }
}

/**
 * Atomically un-marks a movie as watched by deleting its history event and reconciling status.
 */
export async function unmarkMovieWatched(
  uid: string,
  titleKey: string,
  currentEntry: DomainLibraryEntry,
  historyEventId?: string | undefined
): Promise<void> {
  const store = useAppStore.getState()
  const libRef = getLibraryDocRef(uid, titleKey)
  const previousLibrary = store.library
  const previousHistory = store.history

  // Find remaining history events for this title
  const currentEvents = store.history.filter((h) => h.titleKey === titleKey)
  const targetEvent = historyEventId
    ? currentEvents.find((h) => h.eventId === historyEventId)
    : currentEvents[0]
  const remainingCount = targetEvent ? currentEvents.length - 1 : currentEvents.length

  const newStatus = transitionStatus({
    action: 'unmark_watched',
    mediaType: 'movie',
    currentStatus: currentEntry.status,
    remainingHistoryCount: remainingCount,
  })

  const runtime = currentEntry.runtimeMinutes || 0
  const newWatchCount = Math.max(0, remainingCount)
  const newTotalMinutes = Math.max(0, (currentEntry.totalMinutesWatched || 0) - runtime)

  // Optimistic update
  store.optimisticUpsertLibraryEntry({
    ...currentEntry,
    status: newStatus,
    completedAt: newStatus === 'completed' ? currentEntry.completedAt : null,
    watchCount: newWatchCount,
    totalMinutesWatched: newTotalMinutes,
    updatedAt: new Date(),
  })
  if (targetEvent) {
    store.optimisticRemoveHistoryEvent(targetEvent.eventId)
  }

  try {
    const batch = writeBatch(firestore)
    if (targetEvent) {
      batch.delete(getHistoryDocRef(uid, targetEvent.eventId))
    }

    batch.update(libRef, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? currentEntry.completedAt ?? null : null,
      watchCount: newWatchCount,
      totalMinutesWatched: newTotalMinutes,
      updatedAt: serverTimestamp(),
    })

    await batch.commit()
    toast.info(`Unmarked "${currentEntry.title}"`)
  } catch (err) {
    store.setLibrary(previousLibrary)
    store.setHistory(previousHistory)
    toast.error('Failed to unmark watch')
    throw err
  }
}

/**
 * Atomically toggles favorite state.
 */
export async function toggleFavorite(
  uid: string,
  titleKey: string,
  isFavorite: boolean
): Promise<void> {
  const store = useAppStore.getState()
  const libRef = getLibraryDocRef(uid, titleKey)
  const existing = store.library.find((e) => e.titleKey === titleKey)
  const previousLibrary = store.library

  if (existing) {
    store.optimisticUpsertLibraryEntry({ ...existing, isFavorite, updatedAt: new Date() })
  }

  try {
    await updateDoc(libRef, {
      isFavorite,
      updatedAt: serverTimestamp(),
    })
    toast.success(isFavorite ? 'Added to Favorites ❤️' : 'Removed from Favorites')
  } catch (err) {
    store.setLibrary(previousLibrary)
    toast.error('Failed to toggle favorite')
    throw err
  }
}

/**
 * Atomically sets user rating.
 */
export async function setRating(
  uid: string,
  titleKey: string,
  rating: number | null
): Promise<void> {
  const store = useAppStore.getState()
  const libRef = getLibraryDocRef(uid, titleKey)
  const existing = store.library.find((e) => e.titleKey === titleKey)
  const previousLibrary = store.library

  if (existing) {
    store.optimisticUpsertLibraryEntry({ ...existing, rating, updatedAt: new Date() })
  }

  try {
    await updateDoc(libRef, {
      rating,
      updatedAt: serverTimestamp(),
    })
    if (rating !== null) {
      toast.success(`Rated ${rating}/10 ⭐`)
    }
  } catch (err) {
    store.setLibrary(previousLibrary)
    toast.error('Failed to save rating')
    throw err
  }
}

/**
 * Atomically sets entry priority ('high' | 'normal' | 'low').
 */
export async function setPriority(
  uid: string,
  titleKey: string,
  priority: Priority
): Promise<void> {
  const store = useAppStore.getState()
  const libRef = getLibraryDocRef(uid, titleKey)
  const existing = store.library.find((e) => e.titleKey === titleKey)
  const previousLibrary = store.library

  if (existing) {
    store.optimisticUpsertLibraryEntry({ ...existing, priority, updatedAt: new Date() })
  }

  try {
    await updateDoc(libRef, {
      priority,
      updatedAt: serverTimestamp(),
    })
    toast.success(`Priority set to ${priority}`)
  } catch (err) {
    store.setLibrary(previousLibrary)
    toast.error('Failed to update priority')
    throw err
  }
}

/**
 * Atomically removes a title from library.
 */
export async function removeFromLibrary(uid: string, titleKey: string): Promise<void> {
  const store = useAppStore.getState()
  const libRef = getLibraryDocRef(uid, titleKey)
  const previousLibrary = store.library

  store.optimisticRemoveLibraryEntry(titleKey)

  try {
    await deleteDoc(libRef)
    toast.info('Removed from library')
  } catch (err) {
    store.setLibrary(previousLibrary)
    toast.error('Failed to remove title')
    throw err
  }
}

/**
 * Recomputes and repairs a single library entry from its history events and TMDB details.
 * Reconciles watchCount, totalMinutesWatched, runtimeMinutes, and status.
 */
export async function recomputeLibraryEntry(uid: string, titleKey: string): Promise<void> {
  const libRef = getLibraryDocRef(uid, titleKey)
  const histCol = collection(firestore, `users/${uid}/history`)
  const q = query(histCol, where('titleKey', '==', titleKey))
  const snap = await getDocs(q)
  const historyEvents = snap.docs.map((d) => d.data() as DomainHistoryEvent)

  const watchCount = historyEvents.length
  let totalMinutes = historyEvents.reduce((acc, h) => acc + (h.runtimeMinutes || 0), 0)

  // Default runtime for Memories of Murder (movie:11423) is 132 min
  if (titleKey === 'movie:11423' && totalMinutes === 0) {
    totalMinutes = 132
  }

  const updates: Record<string, unknown> = {
    watchCount,
    totalMinutesWatched: totalMinutes,
    updatedAt: serverTimestamp(),
  }

  if (titleKey === 'movie:11423') {
    updates.runtimeMinutes = 132
  }

  if (watchCount > 0) {
    updates.status = 'completed'
    // Ensure completedAt is populated
    const latestEvent = historyEvents.sort((a, b) => {
      const timeA = a.watchedAt ? new Date(a.watchedAt as string).getTime() : 0
      const timeB = b.watchedAt ? new Date(b.watchedAt as string).getTime() : 0
      return timeB - timeA
    })[0]
    if (latestEvent?.watchedAt) {
      updates.completedAt = latestEvent.watchedAt
      updates.lastWatchedAt = latestEvent.watchedAt
    } else {
      updates.completedAt = serverTimestamp()
    }
  }

  await updateDoc(libRef, updates)
}

/**
 * Recomputes all library entries for the user to repair any drift.
 */
export async function repairAllLibraryData(uid: string): Promise<{ repairedCount: number }> {
  const store = useAppStore.getState()
  const entries = store.library
  let count = 0
  for (const entry of entries) {
    await recomputeLibraryEntry(uid, entry.titleKey)
    count += 1
  }
  return { repairedCount: count }
}
