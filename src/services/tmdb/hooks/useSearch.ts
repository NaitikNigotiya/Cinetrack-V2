import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { searchMulti, searchMovie, searchTv } from '../endpoints'
import { tmdbKeys } from '../keys'
import { normaliseSearchResponse, type NormalisedSearchResponse } from '../normalize'
import { TMDB_CACHE_RULES } from './cacheRules'

export interface UseSearchOptions {
  type?: 'multi' | 'movie' | 'tv' | undefined
  year?: string | undefined
  page?: number | undefined
  enabled?: boolean | undefined
}

export function useSearch(query: string, options: UseSearchOptions = {}) {
  const trimmed = query.trim()
  const page = options.page ?? 1
  const type = options.type ?? 'multi'
  const isQueryValid = trimmed.length >= 2
  const isEnabled = (options.enabled ?? true) && isQueryValid

  return useQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.search(trimmed, type, options.year),
    queryFn: async ({ signal }) => {
      if (!isQueryValid) {
        return { page: 1, totalPages: 1, totalResults: 0, results: [] }
      }

      if (type === 'movie') {
        const movieOpts: { year?: string; page?: number } = { page }
        if (options.year) movieOpts.year = options.year
        const raw = await searchMovie(trimmed, movieOpts, signal)
        return normaliseSearchResponse(raw, 'movie')
      }

      if (type === 'tv') {
        const tvOpts: { firstAirDateYear?: string; page?: number } = { page }
        if (options.year) tvOpts.firstAirDateYear = options.year
        const raw = await searchTv(trimmed, tvOpts, signal)
        return normaliseSearchResponse(raw, 'tv')
      }

      const raw = await searchMulti(trimmed, page, signal)
      return normaliseSearchResponse(raw, 'movie')
    },
    enabled: isEnabled,
    placeholderData: keepPreviousData,
    ...TMDB_CACHE_RULES.search,
  })
}

export function useInfiniteSearch(
  query: string,
  options: Omit<UseSearchOptions, 'page'> = {}
) {
  const trimmed = query.trim()
  const type = options.type ?? 'multi'
  const isQueryValid = trimmed.length >= 2
  const isEnabled = (options.enabled ?? true) && isQueryValid

  return useInfiniteQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.searchInfinite(trimmed, type, options.year),
    queryFn: async ({ pageParam = 1, signal }) => {
      const page = Number(pageParam)
      if (!isQueryValid) {
        return { page: 1, totalPages: 1, totalResults: 0, results: [] }
      }

      if (type === 'movie') {
        const movieOpts: { year?: string; page?: number } = { page }
        if (options.year) movieOpts.year = options.year
        const raw = await searchMovie(trimmed, movieOpts, signal)
        return normaliseSearchResponse(raw, 'movie')
      }

      if (type === 'tv') {
        const tvOpts: { firstAirDateYear?: string; page?: number } = { page }
        if (options.year) tvOpts.firstAirDateYear = options.year
        const raw = await searchTv(trimmed, tvOpts, signal)
        return normaliseSearchResponse(raw, 'tv')
      }

      const raw = await searchMulti(trimmed, page, signal)
      return normaliseSearchResponse(raw, 'movie')
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.page >= Math.min(lastPage.totalPages, 500)) {
        return undefined
      }
      return lastPage.page + 1
    },
    enabled: isEnabled,
    ...TMDB_CACHE_RULES.search,
  })
}
