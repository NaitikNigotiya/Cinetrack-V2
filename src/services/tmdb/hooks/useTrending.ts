import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { getTrending } from '../endpoints'
import { tmdbKeys } from '../keys'
import { normaliseSearchResponse, type NormalisedSearchResponse } from '../normalize'
import { TMDB_CACHE_RULES } from './cacheRules'

export function useTrending(
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'week',
  page = 1
) {
  return useQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.trending(mediaType, timeWindow, page),
    queryFn: async ({ signal }) => {
      const raw = await getTrending(mediaType, timeWindow, page, signal)
      return normaliseSearchResponse(raw, mediaType === 'tv' ? 'tv' : 'movie')
    },
    placeholderData: keepPreviousData,
    ...TMDB_CACHE_RULES.lists,
  })
}

export function useInfiniteTrending(
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'week'
) {
  return useInfiniteQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.trendingInfinite(mediaType, timeWindow),
    queryFn: async ({ pageParam = 1, signal }) => {
      const page = Number(pageParam)
      const raw = await getTrending(mediaType, timeWindow, page, signal)
      return normaliseSearchResponse(raw, mediaType === 'tv' ? 'tv' : 'movie')
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.page >= Math.min(lastPage.totalPages, 500)) {
        return undefined
      }
      return lastPage.page + 1
    },
    ...TMDB_CACHE_RULES.lists,
  })
}
