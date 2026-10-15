import {
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type WithFieldValue,
  type DocumentData,
} from 'firebase/firestore'
import { type z } from 'zod'

/**
 * Creates a type-safe FirestoreDataConverter backed by a Zod schema.
 * Protects the UI from crashing if unexpected or malformed data is read from Firestore.
 */
export function createZodConverter<T extends DocumentData>(
  schema: z.ZodType<T>,
  collectionName: string
): FirestoreDataConverter<T> {
  return {
    toFirestore(modelObject: WithFieldValue<T>): DocumentData {
      return modelObject as DocumentData
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): T {
      const data = snapshot.data(options)
      const result = schema.safeParse(data)

      if (!result.success) {
        console.warn(
          `[Firestore Schema Validation Error] in collection "${collectionName}" doc "${snapshot.id}":`,
          result.error.format()
        )
        // Return raw data typed as T with fallback to prevent UI crash
        return {
          id: snapshot.id,
          ...data,
        } as unknown as T
      }

      return result.data
    },
  }
}
