import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import { createZodConverter } from '@/services/firebase/converters'
import { ReviewSchema, type Review } from '@/shared/schemas'

const reviewConverter = createZodConverter(ReviewSchema, 'reviews')

export async function fetchReviews(uid: string): Promise<Review[]> {
  const reviewsRef = collection(firestore, `users/${uid}/reviews`).withConverter(reviewConverter)
  const q = query(reviewsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => docSnap.data())
}

export async function getReviewForTitle(uid: string, titleKey: string): Promise<Review | null> {
  const reviewRef = doc(firestore, `users/${uid}/reviews`, titleKey).withConverter(reviewConverter)
  const snapshot = await getDoc(reviewRef)
  return snapshot.exists() ? snapshot.data() : null
}

export async function saveReview(
  uid: string,
  review: {
    titleKey: string
    title: string
    posterPath: string | null
    rating: number | null
    body: string
    containsSpoilers: boolean
  }
): Promise<void> {
  const reviewRef = doc(firestore, `users/${uid}/reviews`, review.titleKey)
  const existing = await getDoc(reviewRef)

  await setDoc(
    reviewRef,
    {
      ...review,
      updatedAt: serverTimestamp(),
      createdAt: existing.exists() ? existing.data()?.['createdAt'] || serverTimestamp() : serverTimestamp(),
    },
    { merge: true }
  )
}

export async function deleteReview(uid: string, titleKey: string): Promise<void> {
  const reviewRef = doc(firestore, `users/${uid}/reviews`, titleKey)
  await deleteDoc(reviewRef)
}
