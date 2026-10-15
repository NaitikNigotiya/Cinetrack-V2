import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 15, // 15 minutes default
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('404')) {
          return false
        }
        return failureCount < 2
      },
      networkMode: 'offlineFirst',
    },
  },
})

// Persist Query cache to localStorage for fast offline reads
if (typeof window !== 'undefined') {
  try {
    const localStoragePersister = createSyncStoragePersister({
      storage: window.localStorage,
      key: 'CINETRACK_QUERY_CACHE_V2',
    })

    persistQueryClient({
      queryClient,
      persister: localStoragePersister,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      buster: 'v2.0.0',
    })
  } catch (err) {
    console.warn('Failed to initialize query persister:', err)
  }
}
