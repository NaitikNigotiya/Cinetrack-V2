import { request } from './client'
import { TmdbGenreListResponseSchema } from './schemas'

/**
 * Standard TMDB movie genres (canonical TMDB taxonomy).
 */
export const MOVIE_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
}

/**
 * Standard TMDB TV genres.
 */
export const TV_GENRES: Record<number, string> = {
  10759: 'Action & Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  10762: 'Kids',
  9648: 'Mystery',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  37: 'Western',
}

/**
 * Merged movie and TV genre dictionary by ID.
 */
export const MERGED_GENRE_MAP: Record<number, string> = {
  ...MOVIE_GENRES,
  ...TV_GENRES,
}

/**
 * Reverse lookup: Genre name to ID.
 */
export const GENRE_NAME_TO_ID: Record<string, number> = Object.entries(
  MERGED_GENRE_MAP
).reduce<Record<string, number>>((acc, [idStr, name]) => {
  acc[name.toLowerCase()] = Number(idStr)
  return acc
}, {})

/**
 * Retrieves the genre name for a given TMDB genre ID.
 */
export function getGenreName(id: number): string | undefined {
  return MERGED_GENRE_MAP[id]
}

/**
 * Retrieves the TMDB genre ID for a given genre name (case-insensitive).
 */
export function getGenreId(name: string): number | undefined {
  return GENRE_NAME_TO_ID[name.toLowerCase().trim()]
}

/**
 * Resolves a list of genre IDs into genre names, filtering out unknown IDs.
 */
export function getGenreNames(ids: number[]): string[] {
  return ids.map((id) => MERGED_GENRE_MAP[id]).filter((name): name is string => Boolean(name))
}

/**
 * Formats genre IDs into a display string (e.g. "Action, Drama").
 */
export function formatGenreNames(ids: number[], delimiter = ', '): string {
  return getGenreNames(ids).join(delimiter)
}

/**
 * Fetches dynamic genre catalogue from upstream proxy for movie or tv.
 */
export async function fetchGenreList(
  mediaType: 'movie' | 'tv',
  signal?: AbortSignal
): Promise<{ id: number; name: string }[]> {
  const data = await request<unknown>(`genre/${mediaType}/list`, { signal })
  const parsed = TmdbGenreListResponseSchema.parse(data)
  return parsed.genres
}

/**
 * Fetches both movie and TV genre catalogues and merges them into a dynamic map.
 */
export async function fetchMergedGenreMap(
  signal?: AbortSignal
): Promise<Record<number, string>> {
  const [movieRes, tvRes] = await Promise.all([
    fetchGenreList('movie', signal).catch(() => []),
    fetchGenreList('tv', signal).catch(() => []),
  ])

  const map: Record<number, string> = { ...MERGED_GENRE_MAP }
  for (const g of movieRes) {
    map[g.id] = g.name
  }
  for (const g of tvRes) {
    map[g.id] = g.name
  }
  return map
}
