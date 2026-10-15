import { TmdbError } from '../errors'

export const TMDB_CACHE_RULES = {
  configuration: {
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days
    retry: 2,
  },
  genres: {
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days
    retry: 2,
  },
  titleDetails: {
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    retry: (failureCount: number, error: unknown) => {
      if (error instanceof TmdbError && error.status === 404) {
        return false
      }
      return failureCount < 2
    },
  },
  seasons: {
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    retry: (failureCount: number, error: unknown) => {
      if (error instanceof TmdbError && error.status === 404) {
        return false
      }
      return failureCount < 2
    },
  },
  lists: {
    // Trending, popular, top rated, now playing, upcoming, on the air
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  },
  search: {
    // Search, discover
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  },
  recommendations: {
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    retry: 1,
  },
} as const
