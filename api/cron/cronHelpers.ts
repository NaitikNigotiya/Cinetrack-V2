export interface CandidateTitle {
  titleKey: string
  title: string
  type: 'movie' | 'tv'
  voteAverage: number
  voteCount: number
  popularity: number
  genreIds: number[]
  overview?: string
  airingEpisode?: string
}

export interface RankedTitle extends CandidateTitle {
  score: number
  matchedGenreCount: number
}

/**
 * Checks whether the current time in the user's timezone matches their preferred digest hour.
 */
export function isUserDigestTime(
  userTimezone: string,
  digestHour: number,
  referenceDate: Date = new Date()
): boolean {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: 'numeric',
      hourCycle: 'h23',
    })
    const hourPart = formatter.formatToParts(referenceDate).find((p) => p.type === 'hour')
    const currentHour = hourPart ? parseInt(hourPart.value, 10) : referenceDate.getUTCHours()
    return currentHour === digestHour
  } catch {
    // If timezone is invalid, fallback to UTC
    return referenceDate.getUTCHours() === digestHour
  }
}

/**
 * Checks if the notification was already sent on the current date in the user's timezone.
 */
export function isAlreadySentToday(
  lastSentAt: string | null,
  userTimezone: string,
  referenceDate: Date = new Date()
): boolean {
  if (!lastSentAt) return false

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const todayStr = formatter.format(referenceDate) // YYYY-MM-DD
    return lastSentAt === todayStr
  } catch {
    const todayStr = referenceDate.toISOString().slice(0, 10)
    return lastSentAt === todayStr
  }
}

/**
 * Ranks candidate titles based on genre alignment, ratings, and TV airing priority.
 * Excludes titles the user already has in library or recently received.
 */
export function rankCandidates(
  candidates: CandidateTitle[],
  userGenres: number[],
  excludedKeys: Set<string>,
  maxCount: number = 3
): RankedTitle[] {
  const genreSet = new Set(userGenres)

  const ranked: RankedTitle[] = candidates
    .filter((c) => !excludedKeys.has(c.titleKey))
    .map((c) => {
      const matchedGenreCount = c.genreIds.filter((id) => genreSet.has(id)).length
      // Airing episode for a show the user is watching gets top priority (+500)
      const airingBonus = c.airingEpisode ? 500 : 0
      const genreBonus = matchedGenreCount * 30
      const ratingBonus = c.voteAverage * 10
      const popularityBonus = Math.min(c.popularity, 50)
      const score = airingBonus + genreBonus + ratingBonus + popularityBonus

      return {
        ...c,
        matchedGenreCount,
        score,
      }
    })

  ranked.sort((a, b) => b.score - a.score)
  return ranked.slice(0, maxCount)
}
