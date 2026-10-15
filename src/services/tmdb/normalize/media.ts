import { makeTitleKey } from '@/shared/lib/ids'
import {
  getPosterUrl,
  getPosterSrcSet,
  getBackdropUrl,
  getBackdropSrcSet,
} from '../images'
import type { TmdbMediaItem, TmdbSearchResponse } from '../schemas'
import type { NormalisedMediaItem, NormalisedSearchResponse } from './types'

export function parseYear(dateStr: string | null | undefined): number | null {
  if (!dateStr || dateStr.length < 4) return null
  const year = parseInt(dateStr.slice(0, 4), 10)
  return isNaN(year) ? null : year
}

/**
 * Normalises a raw TMDB media item (search/list item).
 */
export function normaliseMediaItem(
  raw: TmdbMediaItem,
  fallbackType: 'movie' | 'tv' = 'movie'
): NormalisedMediaItem {
  const type: 'movie' | 'tv' = raw.media_type || (raw.title ? 'movie' : raw.name ? 'tv' : fallbackType)
  const title = raw.title || raw.name || 'Untitled'
  const releaseDate = raw.release_date || raw.first_air_date || null
  const posterPath = raw.poster_path || null
  const backdropPath = raw.backdrop_path || null

  const item: NormalisedMediaItem = {
    id: raw.id,
    titleKey: makeTitleKey(type, raw.id),
    type,
    title,
    overview: raw.overview || '',
    posterPath,
    backdropPath,
    posterUrl: getPosterUrl(posterPath),
    backdropUrl: getBackdropUrl(backdropPath),
    releaseDate,
    year: parseYear(releaseDate),
    voteAverage: raw.vote_average || 0,
    voteCount: raw.vote_count || 0,
    genreIds: raw.genre_ids || [],
  }

  const posterSrcSet = getPosterSrcSet(posterPath)
  if (posterSrcSet) item.posterSrcSet = posterSrcSet

  const backdropSrcSet = getBackdropSrcSet(backdropPath)
  if (backdropSrcSet) item.backdropSrcSet = backdropSrcSet

  // Compatibility properties
  item.media_type = type
  item.poster_path = posterPath
  item.backdrop_path = backdropPath
  item.release_date = raw.release_date || null
  item.first_air_date = raw.first_air_date || null
  if (raw.name) item.name = raw.name
  item.vote_average = raw.vote_average || 0
  item.vote_count = raw.vote_count || 0

  return item
}

/**
 * Normalises a list of raw TMDB items and dedupes by titleKey.
 */
export function normaliseMediaList(
  items: TmdbMediaItem[],
  fallbackType: 'movie' | 'tv' = 'movie'
): NormalisedMediaItem[] {
  const seen = new Set<string>()
  const result: NormalisedMediaItem[] = []

  for (const raw of items) {
    const normalised = normaliseMediaItem(raw, fallbackType)
    if (!seen.has(normalised.titleKey)) {
      seen.add(normalised.titleKey)
      result.push(normalised)
    }
  }

  return result
}

/**
 * Normalises a raw TMDB search/discover response.
 */
export function normaliseSearchResponse(
  raw: TmdbSearchResponse,
  fallbackType: 'movie' | 'tv' = 'movie'
): NormalisedSearchResponse {
  return {
    page: raw.page,
    totalPages: raw.total_pages,
    totalResults: raw.total_results,
    results: normaliseMediaList(raw.results, fallbackType),
  }
}
