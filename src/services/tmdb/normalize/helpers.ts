import type { ImageRef } from '@/shared/schemas/title'

/**
 * Extracts a 4-digit year from a date string (YYYY-MM-DD).
 * Never returns NaN, 0, or 1970 unless the date actually begins with 1970.
 */
export function parseYear(dateStr: string | null | undefined): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  const match = dateStr.trim().match(/^(\d{4})/)
  if (!match || !match[1]) return null
  const year = parseInt(match[1], 10)
  if (isNaN(year) || year === 0) return null
  return year
}

/**
 * Rounds vote average to 1 decimal place.
 * Returns null when voteCount === 0.
 */
export function roundVoteAverage(
  voteAverage: number | null | undefined,
  voteCount: number | null | undefined
): number | null {
  if (!voteCount || voteCount <= 0 || voteAverage === null || voteAverage === undefined) {
    return null
  }
  return Math.round(voteAverage * 10) / 10
}

/**
 * Computes median from an array of numbers.
 * Useful for TV episode runtimes.
 */
export function computeMedian(numbers: number[]): number | null {
  const valid = numbers.filter((n) => typeof n === 'number' && !isNaN(n) && n > 0)
  if (valid.length === 0) return null
  valid.sort((a, b) => a - b)
  const mid = Math.floor(valid.length / 2)
  if (valid.length % 2 !== 0) {
    return valid[mid] ?? null
  }
  const low = valid[mid - 1] ?? 0
  const high = valid[mid] ?? 0
  return Math.round((low + high) / 2)
}

/**
 * Converts empty strings to null.
 */
export function emptyToNull(str: string | null | undefined): string | null {
  if (str === null || str === undefined) return null
  const trimmed = str.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Determines whether a title is unreleased based on release date.
 * Flagged unreleased if releaseDate is in the future or null.
 */
export function isTitleUnreleased(
  releaseDate: string | null | undefined,
  _userTimezone?: string
): boolean {
  if (!releaseDate) return true
  const today = new Date().toISOString().slice(0, 10)
  return releaseDate > today
}

interface RawVideo {
  id?: string
  key: string
  site?: string
  type?: string
  name?: string
  official?: boolean
  iso_639_1?: string
  published_at?: string
}

/**
 * Picks the best YouTube trailer following priority rules:
 * 1. site === 'YouTube'
 * 2. type === 'Trailer' and official === true, language match, newest published_at
 * 3. Any Trailer
 * 4. Teaser
 * 5. null
 */
export function pickBestTrailer(
  videos: RawVideo[] | undefined | null,
  userLanguage = 'en'
): string | null {
  if (!videos || !Array.isArray(videos)) return null

  const ytVideos = videos.filter((v) => v.site === 'YouTube' && v.key)
  if (ytVideos.length === 0) return null

  const targetLang = userLanguage.slice(0, 2).toLowerCase()

  // Score candidate trailers
  const scored = ytVideos.map((v) => {
    let score = 0
    const isTrailer = v.type === 'Trailer'
    const isTeaser = v.type === 'Teaser'
    const isOfficial = Boolean(v.official)
    const isLangMatch = v.iso_639_1?.toLowerCase() === targetLang

    if (isTrailer) score += 100
    if (isOfficial) score += 50
    if (isLangMatch) score += 20
    if (isTeaser && !isTrailer) score += 20

    const dateVal = v.published_at ? new Date(v.published_at).getTime() : 0
    return { video: v, score, dateVal }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.dateVal - a.dateVal
  })

  const top = scored[0]
  if (!top || (top.video.type !== 'Trailer' && top.video.type !== 'Teaser')) {
    return null
  }
  return top.video.key
}

interface RawImage {
  file_path?: string
  width?: number
  height?: number
  iso_639_1?: string | null
  vote_average?: number
}

/**
 * Normalises raw images: sorts by vote_average desc and caps at 12.
 */
export function filterAndCapImages(
  images: RawImage[] | undefined | null,
  limit = 12
): ImageRef[] {
  if (!images || !Array.isArray(images)) return []

  const valid = images
    .filter((img): img is Required<RawImage> => Boolean(img.file_path && img.width && img.height))
    .map((img) => ({
      filePath: img.file_path,
      width: img.width,
      height: img.height,
      iso6391: img.iso_639_1 ?? null,
      voteAverage: img.vote_average ?? 0,
    }))

  valid.sort((a, b) => b.voteAverage - a.voteAverage)
  return valid.slice(0, limit)
}

interface RawReleaseDateItem {
  certification?: string
  type?: number
}

interface RawReleaseDatesBlock {
  results?: Record<string, { release_dates?: RawReleaseDateItem[] }>
}

interface RawContentRatingsBlock {
  results?: Array<{ iso_3166_1?: string; rating?: string }>
}

/**
 * Extracts certification (e.g. 'PG-13', 'TV-MA') with userRegion fallback to 'US'.
 */
export function extractCertification(
  releaseDates: RawReleaseDatesBlock | undefined | null,
  contentRatings: RawContentRatingsBlock | undefined | null,
  type: 'movie' | 'tv',
  userRegion = 'US'
): string | null {
  const regionsToTry = [userRegion.toUpperCase(), 'US']

  if (type === 'movie' && releaseDates?.results) {
    for (const region of regionsToTry) {
      const dates = releaseDates.results[region]?.release_dates
      if (dates && dates.length > 0) {
        // Prefer type 3 (theatrical release certification)
        const theatrical = dates.find((d) => d.type === 3 && d.certification && d.certification.trim() !== '')
        if (theatrical?.certification) {
          return theatrical.certification.trim()
        }
        // Fall back to any non-empty certification
        const anyValid = dates.find((d) => d.certification && d.certification.trim() !== '')
        if (anyValid?.certification) {
          return anyValid.certification.trim()
        }
      }
    }
  }

  if (type === 'tv' && contentRatings?.results) {
    for (const region of regionsToTry) {
      const match = contentRatings.results.find(
        (r) => r.iso_3166_1?.toUpperCase() === region && r.rating && r.rating.trim() !== ''
      )
      if (match?.rating) {
        return match.rating.trim()
      }
    }
  }

  return null
}
