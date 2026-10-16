import { useQuery, useQueryClient } from '@tanstack/react-query'
import { parseTitleKey } from '@/shared/lib/ids'
import type { TitleDetails } from '@/shared/schemas/title'
import { getMovieDetails, getTvDetails } from '../endpoints'
import { tmdbKeys } from '../keys'
import { toTitleDetails } from '../normalize/titleDetails'
import { TMDB_CACHE_RULES } from './cacheRules'

export function useTitleDetails(titleKey: string | null | undefined) {
  const parsed = titleKey ? parseTitleKey(titleKey) : null

  return useQuery<TitleDetails>({
    queryKey: tmdbKeys.details(titleKey ?? ''),
    queryFn: async ({ signal }) => {
      if (!parsed) {
        throw new Error('Invalid titleKey provided')
      }

      if (parsed.type === 'movie') {
        const raw = await getMovieDetails(parsed.tmdbId, signal)
        return toTitleDetails(raw as never, 'movie')
      }

      const raw = await getTvDetails(parsed.tmdbId, signal)
      return toTitleDetails(raw as never, 'tv')
    },
    enabled: Boolean(parsed),
    ...TMDB_CACHE_RULES.titleDetails,
  })
}

// Module-level guard: at most one prefetch at a time
let isCurrentlyPrefetching = false

/**
 * Hook to prefetch title details on card hover, focus, or touch pointerdown.
 * Concurrency limited: at most one prefetch executes at any given time.
 */
export function usePrefetchTitle() {
  const queryClient = useQueryClient()

  const prefetchTitle = async (titleKey: string | null | undefined) => {
    if (!titleKey || isCurrentlyPrefetching) {
      return
    }

    const parsed = parseTitleKey(titleKey)
    if (!parsed) return

    // Check if already in cache and fresh
    const queryKey = tmdbKeys.details(titleKey)
    const existing = queryClient.getQueryData(queryKey)
    if (existing) {
      return
    }

    try {
      isCurrentlyPrefetching = true
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          if (parsed.type === 'movie') {
            const raw = await getMovieDetails(parsed.tmdbId)
            return toTitleDetails(raw as never, 'movie')
          }
          const raw = await getTvDetails(parsed.tmdbId)
          return toTitleDetails(raw as never, 'tv')
        },
        staleTime: TMDB_CACHE_RULES.titleDetails.staleTime,
      })
    } catch {
      // Ignore prefetch failures silently
    } finally {
      isCurrentlyPrefetching = false
    }
  }

  return { prefetchTitle }
}
