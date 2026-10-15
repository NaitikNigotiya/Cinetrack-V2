import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import {
  getPopular,
  getTopRated,
  getNowPlaying,
  getUpcoming,
  getOnTheAir,
  getRecommendations,
  getSimilar,
} from '../endpoints'
import { tmdbKeys } from '../keys'
import { normaliseSearchResponse, type NormalisedSearchResponse } from '../normalize'
import { TMDB_CACHE_RULES } from './cacheRules'

export function usePopular(mediaType: 'movie' | 'tv' = 'movie', page = 1) {
  return useQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.popular(mediaType, page),
    queryFn: async ({ signal }) => {
      const raw = await getPopular(mediaType, page, signal)
      return normaliseSearchResponse(raw, mediaType)
    },
    placeholderData: keepPreviousData,
    ...TMDB_CACHE_RULES.lists,
  })
}

export function useInfinitePopular(mediaType: 'movie' | 'tv' = 'movie') {
  return useInfiniteQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.popularInfinite(mediaType),
    queryFn: async ({ pageParam = 1, signal }) => {
      const page = Number(pageParam)
      const raw = await getPopular(mediaType, page, signal)
      return normaliseSearchResponse(raw, mediaType)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.page >= Math.min(lastPage.totalPages, 500)) return undefined
      return lastPage.page + 1
    },
    ...TMDB_CACHE_RULES.lists,
  })
}

export function useTopRated(mediaType: 'movie' | 'tv' = 'movie', page = 1) {
  return useQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.topRated(mediaType, page),
    queryFn: async ({ signal }) => {
      const raw = await getTopRated(mediaType, page, signal)
      return normaliseSearchResponse(raw, mediaType)
    },
    placeholderData: keepPreviousData,
    ...TMDB_CACHE_RULES.lists,
  })
}

export function useNowPlaying(page = 1, region?: string) {
  return useQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.nowPlaying(page),
    queryFn: async ({ signal }) => {
      const raw = await getNowPlaying(page, region, signal)
      return normaliseSearchResponse(raw, 'movie')
    },
    placeholderData: keepPreviousData,
    ...TMDB_CACHE_RULES.lists,
  })
}

export function useUpcoming(page = 1, region?: string) {
  return useQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.upcoming(page),
    queryFn: async ({ signal }) => {
      const raw = await getUpcoming(page, region, signal)
      return normaliseSearchResponse(raw, 'movie')
    },
    placeholderData: keepPreviousData,
    ...TMDB_CACHE_RULES.lists,
  })
}

export function useOnTheAir(page = 1, timezone?: string) {
  return useQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.onTheAir(page),
    queryFn: async ({ signal }) => {
      const raw = await getOnTheAir(page, timezone, signal)
      return normaliseSearchResponse(raw, 'tv')
    },
    placeholderData: keepPreviousData,
    ...TMDB_CACHE_RULES.lists,
  })
}

export function useRecommendations(mediaType: 'movie' | 'tv', id: number, page = 1) {
  return useQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.recommendations(`${mediaType}:${id}`),
    queryFn: async ({ signal }) => {
      const raw = await getRecommendations(mediaType, id, page, signal)
      return normaliseSearchResponse(raw, mediaType)
    },
    placeholderData: keepPreviousData,
    ...TMDB_CACHE_RULES.recommendations,
  })
}

export function useSimilar(mediaType: 'movie' | 'tv', id: number, page = 1) {
  return useQuery<NormalisedSearchResponse>({
    queryKey: tmdbKeys.similar(`${mediaType}:${id}`),
    queryFn: async ({ signal }) => {
      const raw = await getSimilar(mediaType, id, page, signal)
      return normaliseSearchResponse(raw, mediaType)
    },
    placeholderData: keepPreviousData,
    ...TMDB_CACHE_RULES.recommendations,
  })
}
