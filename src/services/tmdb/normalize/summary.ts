import { makeTitleKey } from '@/shared/lib/ids'
import type { TitleKey, TitleSummary } from '@/shared/schemas/title'
import {
  parseYear,
  roundVoteAverage,
  emptyToNull,
  isTitleUnreleased,
} from './helpers'

export interface RawMediaSummary {
  id: number
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  media_type?: 'movie' | 'tv'
  release_date?: string | null
  first_air_date?: string | null
  poster_path?: string | null
  backdrop_path?: string | null
  overview?: string | null
  genre_ids?: number[]
  vote_average?: number | null
  vote_count?: number
  popularity?: number
  original_language?: string | null
}

/**
 * Normalises raw search, list, or trending items into TitleSummary.
 */
export function toTitleSummary(
  raw: RawMediaSummary,
  defaultType: 'movie' | 'tv' = 'movie',
  isRecommendation = false
): TitleSummary | null {
  if (!raw || typeof raw.id !== 'number' || raw.id <= 0) {
    return null
  }

  const posterPath = emptyToNull(raw.poster_path)
  const overview = raw.overview?.trim() ?? ''

  // For recommendation / similar rows: drop items with neither a poster nor an overview
  if (isRecommendation && !posterPath && !overview) {
    return null
  }

  const type: 'movie' | 'tv' = raw.media_type || (raw.title ? 'movie' : raw.name ? 'tv' : defaultType)
  const title = (raw.title || raw.name || 'Untitled').trim()
  const originalTitle = emptyToNull(raw.original_title || raw.original_name)
  const rawDate = emptyToNull(raw.release_date || raw.first_air_date)
  const year = parseYear(rawDate)
  const voteCount = raw.vote_count ?? 0
  const voteAverage = roundVoteAverage(raw.vote_average, voteCount)
  const genreIds = Array.isArray(raw.genre_ids) ? raw.genre_ids : []

  return {
    titleKey: makeTitleKey(type, raw.id) as TitleKey,
    tmdbId: raw.id,
    type,
    title,
    originalTitle,
    year,
    releaseDate: rawDate,
    posterPath,
    backdropPath: emptyToNull(raw.backdrop_path),
    overview,
    genreIds,
    voteAverage,
    voteCount,
    popularity: raw.popularity ?? 0,
    originalLanguage: emptyToNull(raw.original_language),
    isUnreleased: isTitleUnreleased(rawDate),
  }
}

/**
 * Normalises a list of items and de-duplicates by titleKey.
 */
export function toTitleSummaryList(
  items: RawMediaSummary[] | undefined | null,
  defaultType: 'movie' | 'tv' = 'movie',
  isRecommendation = false,
  limit?: number
): TitleSummary[] {
  if (!items || !Array.isArray(items)) return []

  const seen = new Set<string>()
  const result: TitleSummary[] = []

  for (const raw of items) {
    const summary = toTitleSummary(raw, defaultType, isRecommendation)
    if (summary && !seen.has(summary.titleKey)) {
      seen.add(summary.titleKey)
      result.push(summary)
      if (limit && result.length >= limit) break
    }
  }

  return result
}
