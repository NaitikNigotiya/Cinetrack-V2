import { useQuery } from '@tanstack/react-query'
import { getDoc } from 'firebase/firestore'
import { getLibraryDocRef } from '@/services/firebase/collections'
import type { LibraryEntry } from '@/shared/schemas'

/**
 * Fetches a single library entry for the given titleKey.
 * Used by TitleDetailPage to show current library status without
 * pulling the entire library list.
 */
export function useLibraryEntry(uid: string | undefined, titleKey: string | undefined) {
  const query = useQuery<LibraryEntry | null>({
    queryKey: ['library', 'entry', uid, titleKey],
    queryFn: async () => {
      if (!uid || !titleKey) return null
      const snap = await getDoc(getLibraryDocRef(uid, titleKey))
      return snap.exists() ? snap.data() : null
    },
    enabled: Boolean(uid) && Boolean(titleKey),
  })

  return {
    entry: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
