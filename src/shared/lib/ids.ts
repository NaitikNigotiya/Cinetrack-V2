export type MediaType = 'movie' | 'tv'

export interface ParsedTitleKey {
  type: MediaType
  tmdbId: number
}

/**
 * Creates canonical title key, e.g. "movie:550" or "tv:1396".
 */
export function makeTitleKey(type: MediaType, tmdbId: number | string): string {
  const idNum = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId
  if (Number.isNaN(idNum) || idNum <= 0) {
    throw new Error(`Invalid TMDB id: ${tmdbId}`)
  }
  return `${type}:${idNum}`
}

/**
 * Parses canonical title key into media type and numerical TMDB id.
 * Returns null if the format is invalid.
 */
export function parseTitleKey(key: string): ParsedTitleKey | null {
  const match = /^(movie|tv):(\d+)$/.exec(key)
  if (!match) return null

  const type = match[1] as MediaType
  const tmdbId = parseInt(match[2] ?? '0', 10)
  if (Number.isNaN(tmdbId) || tmdbId <= 0) return null

  return { type, tmdbId }
}

/**
 * Generates zero-padded season & episode string, e.g. "s01e03".
 */
export function makeEpisodeKey(season: number, episode: number): string {
  const s = season.toString().padStart(2, '0')
  const e = episode.toString().padStart(2, '0')
  return `s${s}e${e}`
}

/**
 * Generates human readable episode label, e.g. "S01E03".
 */
export function makeEpisodeLabel(season: number, episode: number): string {
  const s = season.toString().padStart(2, '0')
  const e = episode.toString().padStart(2, '0')
  return `S${s}E${e}`
}

/**
 * Generates deterministic episode watch history ID: `${titleKey}_s01e03`
 */
export function makeEpisodeEventId(titleKey: string, season: number, episode: number): string {
  return `${titleKey}_${makeEpisodeKey(season, episode)}`
}
