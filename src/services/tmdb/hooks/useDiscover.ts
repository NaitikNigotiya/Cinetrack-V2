import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { discoverMovies, discoverTv } from '../endpoints'
import { tmdbKeys } from '../keys'
import { normaliseSearchResponse, type NormalisedSearchResponse } from '../normalize'
import { TMDB_CACHE_RULES } from './cacheRules'

export function useDiscover(
  mediaType: 'movie' | 'tv',
  params: Record<string, string> = {},
  page = 1
) {
  return useQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.discover(mediaType, params, page),
    queryFn: async ({ signal }) => {
      const queryParams = { ...params, page: page.toString() }
      const raw =
        mediaType === 'movie'
          ? await discoverMovies(queryParams, signal)
          : await discoverTv(queryParams, signal)
      return normaliseSearchResponse(raw, mediaType)
    },
    placeholderData: keepPreviousData,
    ...TMDB_CACHE_RULES.search,
  })
}

export function useInfiniteDiscover(
  mediaType: 'movie' | 'tv',
  params: Record<string, string> = {}
) {
  return useInfiniteQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.discoverInfinite(mediaType, params),
    queryFn: async ({ pageParam = 1, signal }) => {
      const page = Number(pageParam)
      const queryParams = { ...params, page: page.toString() }
      const raw =
        mediaType === 'movie'
          ? await discoverMovies(queryParams, signal)
          : await discoverTv(queryParams, signal)
      return normaliseSearchResponse(raw, mediaType)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.page >= Math.min(lastPage.totalPages, 500)) {
        return undefined
      }
      return lastPage.page + 1
    },
    ...TMDB_CACHE_RULES.search,
  })
}
