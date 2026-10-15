import {
  writeBatch,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore'
import { db } from '@/services/firebase/db'
import {
  getLibraryDocRef,
  getHistoryDocRef,
  getStatsSummaryDocRef,
} from '@/services/firebase/collections'
import type { LibraryEntry, LibraryStatus } from '@/shared/schemas'
import { toast } from '@/shared/ui'

// In-memory snapshot cache for 8-second undo of removed titles
const removedSnapshotsCache = new Map<string, { entry: LibraryEntry; timer: ReturnType<typeof setTimeout> }>()

/**
 * Atomically adds a title to the user's library and updates stats.
 */
export async function addToLibrary(uid: string, entry: Omit<LibraryEntry, 'addedAt' | 'updatedAt' | 'schemaVersion'>): Promise<void> {
  const libRef = getLibraryDocRef(uid, entry.titleKey)
  const statsRef = getStatsSummaryDocRef(uid)
  const now = serverTimestamp()

  const batch = writeBatch(db)

  batch.set(libRef, {
    ...entry,
    addedAt: now,
    updatedAt: now,
    schemaVersion: 1,
  })

  // Increment status count in stats summary
  const statusField = `statusCounts.${entry.status}`
  batch.set(
    statsRef,
    {
      [statusField]: increment(1),
      updatedAt: now,
    },
    { merge: true }
  )

  await batch.commit()
}

/**
 * Atomically sets title status with accurate lifecycle timestamps.
 * If a movie moves to 'completed', also logs history and increments watch count.
 */
export async function setStatus(
  uid: string,
  titleKey: string,
  newStatus: LibraryStatus,
  currentEntry: LibraryEntry
): Promise<void> {
  const libRef = getLibraryDocRef(uid, titleKey)
  const statsRef = getStatsSummaryDocRef(uid)
  const now = serverTimestamp()

  const batch = writeBatch(db)
  const oldStatus = currentEntry.status

  const updates: Record<string, unknown> = {
    status: newStatus,
    updatedAt: now,
  }

  // Handle lifecycle timestamps
  if (newStatus === 'watching' && !currentEntry.startedAt) {
    updates.startedAt = now
  }
  if (newStatus === 'completed') {
    updates.completedAt = now
    updates.lastWatchedAt = now
    updates.watchCount = (currentEntry.watchCount || 0) + 1

    // If it's a movie, log watch history atomically
    if (currentEntry.type === 'movie') {
      const autoHistoryId = `${titleKey}_${Date.now()}`
      const historyRef = getHistoryDocRef(uid, autoHistoryId)
      const runtime = currentEntry.runtimeMinutes || 0

      batch.set(historyRef, {
        eventId: autoHistoryId,
        titleKey,
        title: currentEntry.title,
        type: 'movie',
        watchedAt: now,
        runtimeMinutes: runtime,
        rating: currentEntry.rating,
        posterPath: currentEntry.posterPath,
        genreIds: currentEntry.genres.map((g) => g.id),
        source: 'manual',
        createdAt: now,
        schemaVersion: 1,
      })

      updates.totalMinutesWatched = (currentEntry.totalMinutesWatched || 0) + runtime

      batch.set(
        statsRef,
        {
          moviesWatched: increment(1),
          minutesWatched: increment(runtime),
          titlesCompleted: increment(1),
        },
        { merge: true }
      )
    }
  } else if (oldStatus === 'completed') {
    updates.completedAt = null
    batch.set(statsRef, { titlesCompleted: increment(-1) }, { merge: true })
  }

  // Update status counts
  batch.set(
    statsRef,
    {
      [`statusCounts.${oldStatus}`]: increment(-1),
      [`statusCounts.${newStatus}`]: increment(1),
      updatedAt: now,
    },
    { merge: true }
  )

  batch.update(libRef, updates)
  await batch.commit()
}

/**
 * Toggles favourite state.
 */
export async function toggleFavorite(uid: string, titleKey: string, isFavorite: boolean): Promise<void> {
  const libRef = getLibraryDocRef(uid, titleKey)
  await updateDoc(libRef, {
    isFavorite,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Sets canonical rating (0.5..10).
 */
export async function setRating(
  uid: string,
  titleKey: string,
  newRating: number | null,
  previousRating: number | null
): Promise<void> {
  const libRef = getLibraryDocRef(uid, titleKey)
  const statsRef = getStatsSummaryDocRef(uid)
  const now = serverTimestamp()

  const batch = writeBatch(db)
  batch.update(libRef, {
    rating: newRating,
    updatedAt: now,
  })

  // Update stats rating sum and count
  const ratingDelta = (newRating ?? 0) - (previousRating ?? 0)
  const countDelta = (newRating !== null ? 1 : 0) - (previousRating !== null ? 1 : 0)

  batch.set(
    statsRef,
    {
      ratingSum: increment(ratingDelta),
      ratingCount: increment(countDelta),
      updatedAt: now,
    },
    { merge: true }
  )

  await batch.commit()
}

/**
 * Removes title from library with 8-second in-memory undo restoration.
 */
export async function removeFromLibraryWithUndo(
  uid: string,
  titleKey: string,
  currentEntry: LibraryEntry
): Promise<void> {
  const libRef = getLibraryDocRef(uid, titleKey)
  const statsRef = getStatsSummaryDocRef(uid)

  // Store in memory snapshot
  const timer = setTimeout(() => {
    removedSnapshotsCache.delete(`${uid}_${titleKey}`)
  }, 8000)

  removedSnapshotsCache.set(`${uid}_${titleKey}`, { entry: currentEntry, timer })

  const batch = writeBatch(db)
  batch.delete(libRef)
  batch.set(
    statsRef,
    {
      [`statusCounts.${currentEntry.status}`]: increment(-1),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  await batch.commit()

  toast.info(`Removed "${currentEntry.title}" from library`, {
    label: 'Undo',
    onClick: async () => {
      const cached = removedSnapshotsCache.get(`${uid}_${titleKey}`)
      if (cached) {
        clearTimeout(cached.timer)
        removedSnapshotsCache.delete(`${uid}_${titleKey}`)
        await addToLibrary(uid, cached.entry)
        toast.success(`Restored "${cached.entry.title}" to library`)
      }
    },
  })
}
