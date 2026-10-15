import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import { createZodConverter } from '@/services/firebase/converters'
import { PlannedWatchSchema, type PlannedWatch } from '@/shared/schemas'

const plannedWatchConverter = createZodConverter(PlannedWatchSchema, 'plannedWatches')

export async function fetchPlannedWatches(uid: string): Promise<PlannedWatch[]> {
  const colRef = collection(firestore, `users/${uid}/plannedWatches`).withConverter(plannedWatchConverter)
  const q = query(colRef, orderBy('plannedFor', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    id: docSnap.id,
  }))
}

export async function savePlannedWatch(
  uid: string,
  watch: {
    id?: string | undefined
    titleKey: string
    title: string
    posterPath: string | null
    type: 'movie' | 'tv'
    plannedFor: string // YYYY-MM-DD
    plannedTime?: string | undefined // HH:mm
    note?: string | undefined
    reminder?: boolean | undefined
  }
): Promise<string> {
  const colRef = collection(firestore, `users/${uid}/plannedWatches`)
  const docRef = watch.id ? doc(colRef, watch.id) : doc(colRef)

  await setDoc(
    docRef,
    {
      titleKey: watch.titleKey,
      title: watch.title,
      posterPath: watch.posterPath,
      type: watch.type,
      plannedFor: watch.plannedFor,
      plannedTime: watch.plannedTime || null,
      note: watch.note || null,
      reminder: watch.reminder ?? false,
      done: false,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )

  return docRef.id
}

export async function updatePlannedWatchDate(
  uid: string,
  watchId: string,
  plannedFor: string
): Promise<void> {
  const docRef = doc(firestore, `users/${uid}/plannedWatches`, watchId)
  await updateDoc(docRef, {
    plannedFor,
    updatedAt: serverTimestamp(),
  })
}

export async function togglePlannedWatchDone(
  uid: string,
  watchId: string,
  done: boolean
): Promise<void> {
  const docRef = doc(firestore, `users/${uid}/plannedWatches`, watchId)
  await updateDoc(docRef, {
    done,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePlannedWatch(uid: string, watchId: string): Promise<void> {
  const docRef = doc(firestore, `users/${uid}/plannedWatches`, watchId)
  await deleteDoc(docRef)
}
