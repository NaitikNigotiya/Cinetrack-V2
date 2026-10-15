export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original'

/**
 * Builds full TMDB poster URL.
 */
export function getPosterUrl(path: string | null | undefined, size: PosterSize = 'w342'): string | null {
  if (!path) return null
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`
}

/**
 * Builds responsive srcset for TMDB posters (w185, w342, w500, w780).
 */
export function getPosterSrcSet(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return [
    `${TMDB_IMAGE_BASE}/w185${cleanPath} 185w`,
    `${TMDB_IMAGE_BASE}/w342${cleanPath} 342w`,
    `${TMDB_IMAGE_BASE}/w500${cleanPath} 500w`,
    `${TMDB_IMAGE_BASE}/w780${cleanPath} 780w`,
  ].join(', ')
}

/**
 * Builds full TMDB backdrop URL.
 */
export function getBackdropUrl(path: string | null | undefined, size: BackdropSize = 'w1280'): string | null {
  if (!path) return null
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${TMDB_IMAGE_BASE}/${size}${cleanPath}`
}

/**
 * Builds responsive srcset for TMDB backdrops (w780, w1280).
 */
export function getBackdropSrcSet(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return [
    `${TMDB_IMAGE_BASE}/w780${cleanPath} 780w`,
    `${TMDB_IMAGE_BASE}/w1280${cleanPath} 1280w`,
  ].join(', ')
}
