import { useMemo } from 'react'
import { useAppStore } from '@/domain/store'
import type { LibraryEntry } from '@/shared/schemas'

/**
 * Reads a single library entry from useAppStore for the given titleKey.
 * Completely real-time reactive without separate network queries.
 */
export function useLibraryEntry(_uid: string | undefined, titleKey: string | undefined) {
  const library = useAppStore((state) => state.library)
  const isReady = useAppStore((state) => state.isReady)

  const entry = useMemo<LibraryEntry | null>(() => {
    if (!titleKey) return null
    return library.find((e) => e.titleKey === titleKey) ?? null
  }, [library, titleKey])

  return {
    entry,
    isLoading: !isReady,
    refetch: () => Promise.resolve(),
  }
}
