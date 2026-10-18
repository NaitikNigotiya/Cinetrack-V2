import {
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/services/firebase/db'
import {
  getHistoryCollection,
  getHistoryDocRef,
  getStatsSummaryDocRef,
} from '@/services/firebase/collections'
import type { HistoryEvent } from '@/shared/schemas'
import { toast } from '@/shared/ui'

export async function fetchHistory(uid: string, limitCount = 150): Promise<HistoryEvent[]> {
  const colRef = getHistoryCollection(uid)
  const q = query(colRef, orderBy('watchedAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}

export async function logPastWatch(
  uid: string,
  event: Omit<HistoryEvent, 'createdAt' | 'schemaVersion' | 'source'>
): Promise<void> {
  const historyRef = getHistoryDocRef(uid, event.eventId)
  const statsRef = getStatsSummaryDocRef(uid)
  const now = serverTimestamp()

  const batch = writeBatch(db)

  batch.set(historyRef, {
    ...event,
    source: 'manual',
    createdAt: now,
    schemaVersion: 1,
  })

  // Update stats summary
  const isMovie = event.type === 'movie'
  batch.set(
    statsRef,
    {
      moviesWatched: increment(isMovie ? 1 : 0),
      episodesWatched: increment(!isMovie ? 1 : 0),
      minutesWatched: increment(event.runtimeMinutes || 0),
      updatedAt: now,
    },
    { merge: true }
  )

  await batch.commit()
}

export async function deleteHistoryEventWithUndo(
  uid: string,
  event: HistoryEvent
): Promise<void> {
  const historyRef = getHistoryDocRef(uid, event.eventId)
  const statsRef = getStatsSummaryDocRef(uid)
  const isMovie = event.type === 'movie'
  const runtime = event.runtimeMinutes || 0

  const batch = writeBatch(db)
  batch.delete(historyRef)
  batch.set(
    statsRef,
    {
      moviesWatched: increment(isMovie ? -1 : 0),
      episodesWatched: increment(!isMovie ? -1 : 0),
      minutesWatched: increment(-runtime),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  await batch.commit()

  toast.info(`Deleted watch event for "${event.title}"`, {
    label: 'Undo',
    onClick: async () => {
      await logPastWatch(uid, event)
      toast.success(`Restored watch event for "${event.title}"`)
    },
  })
}
