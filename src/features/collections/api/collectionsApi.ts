import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import { createZodConverter } from '@/services/firebase/converters'
import { CollectionSchema, type Collection, type CollectionItem } from '@/shared/schemas'

const collectionConverter = createZodConverter(CollectionSchema, 'collections')

export async function fetchCollections(uid: string): Promise<Collection[]> {
  const colRef = collection(firestore, `users/${uid}/collections`).withConverter(collectionConverter)
  const q = query(colRef, orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    id: docSnap.id,
  }))
}

export async function getCollection(uid: string, collectionId: string): Promise<Collection | null> {
  const docRef = doc(firestore, `users/${uid}/collections`, collectionId).withConverter(collectionConverter)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return {
    ...snapshot.data(),
    id: snapshot.id,
  }
}

export async function saveCollection(
  uid: string,
  data: {
    id?: string | undefined
    name: string
    description?: string | undefined
    emoji?: string | undefined
    isPublic?: boolean | undefined
  }
): Promise<string> {
  const colRef = collection(firestore, `users/${uid}/collections`)
  const docRef = data.id ? doc(colRef, data.id) : doc(colRef)

  const existing = data.id ? await getDoc(docRef) : null

  await setDoc(
    docRef,
    {
      name: data.name,
      description: data.description ?? '',
      emoji: data.emoji ?? '🎬',
      isPublic: data.isPublic ?? false,
      items: existing?.exists() ? existing.data()?.['items'] ?? [] : [],
      updatedAt: serverTimestamp(),
      createdAt: existing?.exists() ? existing.data()?.['createdAt'] || serverTimestamp() : serverTimestamp(),
    },
    { merge: true }
  )

  return docRef.id
}

export async function deleteCollection(uid: string, collectionId: string): Promise<void> {
  const docRef = doc(firestore, `users/${uid}/collections`, collectionId)
  await deleteDoc(docRef)
}

export async function addItemToCollection(
  uid: string,
  collectionId: string,
  item: Omit<CollectionItem, 'addedAt'>
): Promise<void> {
  const docRef = doc(firestore, `users/${uid}/collections`, collectionId).withConverter(collectionConverter)
  const snap = await getDoc(docRef)
  if (!snap.exists()) throw new Error('Collection does not exist')

  const current = snap.data()
  if (current.items.length >= 500) {
    throw new Error('Collection has reached the maximum of 500 items')
  }

  // Check if item already exists
  if (current.items.some((i) => i.titleKey === item.titleKey)) {
    return // Already in collection
  }

  const newItem: CollectionItem = {
    ...item,
    addedAt: new Date(),
  }

  await updateDoc(docRef, {
    items: [...current.items, newItem],
    updatedAt: serverTimestamp(),
  })
}

export async function removeItemFromCollection(
  uid: string,
  collectionId: string,
  titleKey: string
): Promise<void> {
  const docRef = doc(firestore, `users/${uid}/collections`, collectionId).withConverter(collectionConverter)
  const snap = await getDoc(docRef)
  if (!snap.exists()) return

  const current = snap.data()
  const nextItems = current.items.filter((i) => i.titleKey !== titleKey)

  await updateDoc(docRef, {
    items: nextItems,
    updatedAt: serverTimestamp(),
  })
}

export async function updateCollectionItems(
  uid: string,
  collectionId: string,
  items: CollectionItem[]
): Promise<void> {
  const docRef = doc(firestore, `users/${uid}/collections`, collectionId)
  await updateDoc(docRef, {
    items,
    updatedAt: serverTimestamp(),
  })
}
