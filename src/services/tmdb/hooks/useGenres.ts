import { useQuery } from '@tanstack/react-query'
import { fetchGenreList, fetchMergedGenreMap } from '../genres'
import { tmdbKeys } from '../keys'
import { TMDB_CACHE_RULES } from './cacheRules'

export function useGenres(mediaType?: 'movie' | 'tv') {
  return useQuery({
    queryKey: tmdbKeys.genres(mediaType),
    queryFn: async ({ signal }) => {
      if (mediaType) {
        return fetchGenreList(mediaType, signal)
      }
      return fetchMergedGenreMap(signal)
    },
    ...TMDB_CACHE_RULES.genres,
  })
}
