const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original'
export type ProfileSize = 'w45' | 'w185' | 'h632' | 'original'
export type StillSize = 'w92' | 'w185' | 'w300' | 'original'

function cleanImagePath(path: string | null | undefined): string | null {
  if (!path) return null
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * Builds full TMDB poster URL.
 */
export function getPosterUrl(
  path: string | null | undefined,
  size: PosterSize = 'w342'
): string | null {
  const clean = cleanImagePath(path)
  return clean ? `${TMDB_IMAGE_BASE}/${size}${clean}` : null
}

/**
 * Builds responsive srcset for TMDB posters (w185, w342, w500, w780).
 */
export function getPosterSrcSet(path: string | null | undefined): string | undefined {
  const clean = cleanImagePath(path)
  if (!clean) return undefined
  return [
    `${TMDB_IMAGE_BASE}/w185${clean} 185w`,
    `${TMDB_IMAGE_BASE}/w342${clean} 342w`,
    `${TMDB_IMAGE_BASE}/w500${clean} 500w`,
    `${TMDB_IMAGE_BASE}/w780${clean} 780w`,
  ].join(', ')
}

/**
 * Builds full TMDB backdrop URL.
 */
export function getBackdropUrl(
  path: string | null | undefined,
  size: BackdropSize = 'w1280'
): string | null {
  const clean = cleanImagePath(path)
  return clean ? `${TMDB_IMAGE_BASE}/${size}${clean}` : null
}

/**
 * Builds responsive srcset for TMDB backdrops (w780, w1280).
 */
export function getBackdropSrcSet(path: string | null | undefined): string | undefined {
  const clean = cleanImagePath(path)
  if (!clean) return undefined
  return [
    `${TMDB_IMAGE_BASE}/w780${clean} 780w`,
    `${TMDB_IMAGE_BASE}/w1280${clean} 1280w`,
  ].join(', ')
}

/**
 * Builds full TMDB cast/crew profile image URL.
 */
export function getProfileUrl(
  path: string | null | undefined,
  size: ProfileSize = 'w185'
): string | null {
  const clean = cleanImagePath(path)
  return clean ? `${TMDB_IMAGE_BASE}/${size}${clean}` : null
}

/**
 * Builds full TMDB TV episode still image URL.
 */
export function getStillUrl(
  path: string | null | undefined,
  size: StillSize = 'w300'
): string | null {
  const clean = cleanImagePath(path)
  return clean ? `${TMDB_IMAGE_BASE}/${size}${clean}` : null
}

/**
 * Generic image URL builder with custom size string.
 */
export function getImageUrl(
  path: string | null | undefined,
  size = 'w342'
): string | null {
  const clean = cleanImagePath(path)
  return clean ? `${TMDB_IMAGE_BASE}/${size}${clean}` : null
}
