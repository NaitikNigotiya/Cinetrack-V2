import { queryClient } from '@/app/providers/queryClient'

/**
 * Clears TanStack Query cache, local storage persistence, and browser IndexedDB databases.
 * Used when a non-owner attempts to access the application or on full account deletion.
 */
export async function clearAppCaches(): Promise<void> {
  // Clear TanStack Query cache
  try {
    queryClient.clear()
  } catch (err) {
    console.warn('Failed to clear TanStack QueryClient cache:', err)
  }

  // Clear localStorage persistence for query client
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('CINETRACK_QUERY_CACHE_V2')
    } catch {
      // Ignore storage errors
    }

    // Clear IndexedDB caches (Firebase offline cache, browser cache, etc.)
    if ('indexedDB' in window && typeof window.indexedDB.databases === 'function') {
      try {
        const dbs = await window.indexedDB.databases()
        for (const db of dbs) {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name)
          }
        }
      } catch (err) {
        console.warn('Failed to delete IndexedDB databases:', err)
      }
    }
  }
}
