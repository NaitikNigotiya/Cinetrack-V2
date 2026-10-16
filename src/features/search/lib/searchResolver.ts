import { makeTitleKey } from '@/shared/lib/ids'
import { findByExternalId } from '@/services/tmdb/endpoints'
import type { TitleKey } from '@/shared/schemas/title'

export type ResolvedQuery =
  | { kind: 'titleKey'; titleKey: TitleKey; mediaType: 'movie' | 'tv'; id: number }
  | { kind: 'imdb'; imdbId: string }
  | null

/**
 * Checks if a search input is a direct TMDB URL, IMDb URL, or IMDb ID.
 */
export function parseSpecialSearchInput(input: string): ResolvedQuery {
  const trimmed = input.trim()

  // Match TMDB URL, e.g. https://www.themoviedb.org/movie/550-fight-club or https://www.themoviedb.org/tv/1396
  const tmdbMatch = /^https?:\/\/(?:www\.)?themoviedb\.org\/(movie|tv)\/(\d+)/i.exec(trimmed)
  if (tmdbMatch && tmdbMatch[1] && tmdbMatch[2]) {
    const mediaType = tmdbMatch[1].toLowerCase() as 'movie' | 'tv'
    const id = parseInt(tmdbMatch[2], 10)
    if (!Number.isNaN(id) && id > 0) {
      return {
        kind: 'titleKey',
        titleKey: makeTitleKey(mediaType, id) as TitleKey,
        mediaType,
        id,
      }
    }
  }

  // Match IMDb URL, e.g. https://www.imdb.com/title/tt0137523/
  const imdbUrlMatch = /^https?:\/\/(?:www\.)?imdb\.com\/title\/(tt\d{7,9})/i.exec(trimmed)
  if (imdbUrlMatch && imdbUrlMatch[1]) {
    return { kind: 'imdb', imdbId: imdbUrlMatch[1].toLowerCase() }
  }

  // Match raw IMDb ID, e.g. tt0137523 or tt1234567
  if (/^tt\d{7,9}$/i.test(trimmed)) {
    return { kind: 'imdb', imdbId: trimmed.toLowerCase() }
  }

  return null
}

/**
 * Resolves an IMDb ID via TMDB find endpoint to a canonical TitleKey.
 */
export async function resolveImdbId(imdbId: string, signal?: AbortSignal): Promise<TitleKey | null> {
  try {
    const data = await findByExternalId(imdbId, 'imdb_id', signal)
    const movie = data.movie_results?.[0]
    if (movie && movie.id) {
      return makeTitleKey('movie', movie.id) as TitleKey
    }
    const tv = data.tv_results?.[0]
    if (tv && tv.id) {
      return makeTitleKey('tv', tv.id) as TitleKey
    }
    return null
  } catch (err) {
    console.warn(`Failed to resolve IMDb ID "${imdbId}":`, err)
    return null
  }
}
