import { useQuery } from '@tanstack/react-query'
import { getTvSeason } from '../endpoints'
import { tmdbKeys } from '../keys'
import { normaliseTvSeason, type NormalisedTvSeason } from '../normalize'
import { TMDB_CACHE_RULES } from './cacheRules'

export function useSeason(tvId: number | null | undefined, seasonNumber: number | null | undefined) {
  const isEnabled = typeof tvId === 'number' && tvId > 0 && typeof seasonNumber === 'number' && seasonNumber >= 0

  return useQuery<NormalisedTvSeason>({
    queryKey: tmdbKeys.season(tvId ?? 0, seasonNumber ?? 0),
    queryFn: async ({ signal }) => {
      if (!tvId || seasonNumber === undefined || seasonNumber === null) {
        throw new Error('tvId and seasonNumber are required')
      }
      const raw = await getTvSeason(tvId, seasonNumber, signal)
      return normaliseTvSeason(raw)
    },
    enabled: isEnabled,
    ...TMDB_CACHE_RULES.seasons,
  })
}
