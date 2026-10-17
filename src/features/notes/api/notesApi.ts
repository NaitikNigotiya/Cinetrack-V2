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
import { NoteSchema, type Note } from '@/shared/schemas'

const noteConverter = createZodConverter(NoteSchema, 'notes')

export async function fetchNotes(uid: string): Promise<Note[]> {
  const notesRef = collection(firestore, `users/${uid}/notes`).withConverter(noteConverter)
  const q = query(notesRef, orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    id: docSnap.id,
  }))
}

export async function saveNote(
  uid: string,
  note: {
    id?: string | undefined
    titleKey?: string | null | undefined
    title?: string | null | undefined
    body: string
    pinned?: boolean | undefined
  }
): Promise<string> {
  const notesCol = collection(firestore, `users/${uid}/notes`)
  const noteDoc = note.id ? doc(notesCol, note.id) : doc(notesCol)

  await setDoc(
    noteDoc,
    {
      titleKey: note.titleKey ?? null,
      title: note.title ?? null,
      body: note.body,
      pinned: note.pinned ?? false,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )

  return noteDoc.id
}

export async function togglePinNote(uid: string, noteId: string, pinned: boolean): Promise<void> {
  const noteDoc = doc(firestore, `users/${uid}/notes`, noteId)
  await updateDoc(noteDoc, {
    pinned,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteNote(uid: string, noteId: string): Promise<void> {
  const noteDoc = doc(firestore, `users/${uid}/notes`, noteId)
  await deleteDoc(noteDoc)
}
