import type { DomainLibraryEntry, SmartCollection, WatchlistSmartGroups } from './types'
import { toDomainDate } from './date'

/**
 * Computes built-in Smart Collections per Section 5.2.
 * The 8 standard built-in collections are always returned (even if 0 titles),
 * and the top-3 genres of the library generate dynamic auto-lists.
 */
export function computeSmartCollections(library: DomainLibraryEntry[]): SmartCollection[] {
  const nowMs = Date.now()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  // 1. Favorites
  const favorites = library.filter((e) => Boolean(e.isFavorite))

  // 2. Highly Rated (rating >= 8)
  const highlyRated = library.filter((e) => typeof e.rating === 'number' && e.rating >= 8)

  // 3. Masterpieces (rating >= 9)
  const masterpieces = library.filter((e) => typeof e.rating === 'number' && e.rating >= 9)

  // 4. Recently Completed (last 30 days)
  const recentlyCompleted = library.filter((e) => {
    if (e.status !== 'completed') return false
    const d = toDomainDate(e.completedAt || e.lastWatchedAt || e.updatedAt)
    if (!d) return false
    return nowMs - d.getTime() <= thirtyDaysMs
  })

  // 5. Currently Watching
  const currentlyWatching = library.filter((e) => e.status === 'watching')

  // 6. Unrated Completed (completed but rating is null or 0)
  const unratedCompleted = library.filter(
    (e) => e.status === 'completed' && (e.rating === null || e.rating === undefined || e.rating === 0)
  )

  // 7. Short Watches (plan to watch with runtime <= 100 min)
  const shortWatches = library.filter(
    (e) =>
      e.status === 'plan_to_watch' &&
      typeof e.runtimeMinutes === 'number' &&
      e.runtimeMinutes > 0 &&
      e.runtimeMinutes <= 100
  )

  // 8. Binge-worthy Shows (TV shows with >= 3 seasons)
  const bingeworthy = library.filter(
    (e) => e.type === 'tv' && (e.tv?.totalSeasons ?? 0) >= 3
  )

  const builtInCollections: SmartCollection[] = [
    {
      id: 'smart:favorites',
      name: 'Favorites',
      description: 'Your favorite movies and TV shows',
      list: favorites,
      isBuiltIn: true,
    },
    {
      id: 'smart:masterpieces',
      name: 'Masterpieces',
      description: 'Exceptional titles you rated 9 or higher',
      list: masterpieces,
      isBuiltIn: true,
    },
    {
      id: 'smart:highly-rated',
      name: 'Highly Rated',
      description: 'Titles you rated 8 or higher',
      list: highlyRated,
      isBuiltIn: true,
    },
    {
      id: 'smart:watching',
      name: 'Currently Watching',
      description: 'Movies and TV series currently in progress',
      list: currentlyWatching,
      isBuiltIn: true,
    },
    {
      id: 'smart:recently-completed',
      name: 'Recently Completed',
      description: 'Titles completed in the last 30 days',
      list: recentlyCompleted,
      isBuiltIn: true,
    },
    {
      id: 'smart:unrated-completed',
      name: 'Unrated Completed',
      description: 'Finished titles waiting for your rating',
      list: unratedCompleted,
      isBuiltIn: true,
    },
    {
      id: 'smart:short-watches',
      name: 'Short Watches',
      description: 'Quick planned watches under 100 minutes',
      list: shortWatches,
      isBuiltIn: true,
    },
    {
      id: 'smart:bingeworthy',
      name: 'Binge-worthy Shows',
      description: 'Epic TV shows with 3 or more seasons',
      list: bingeworthy,
      isBuiltIn: true,
    },
  ]

  // Dynamic: Top 3 genres of the library
  const genreCountMap: Record<number, { name: string; count: number }> = {}
  library.forEach((e) => {
    e.genres?.forEach((g) => {
      if (!genreCountMap[g.id]) genreCountMap[g.id] = { name: g.name, count: 0 }
      genreCountMap[g.id]!.count += 1
    })
  })

  const topGenres = Object.entries(genreCountMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3)

  const genreCollections: SmartCollection[] = topGenres.map(([idStr, info]) => {
    const genreId = Number(idStr)
    const genreList = library.filter((e) => e.genres?.some((g) => g.id === genreId))
    return {
      id: `smart:genre-${genreId}`,
      name: `Top Genre: ${info.name}`,
      description: `All ${info.name} titles in your personal collection`,
      list: genreList,
      isBuiltIn: false,
    }
  })

  return [...builtInCollections, ...genreCollections]
}


/**
 * Computes Watchlist Smart View groups per Section 5.1.
 * Only titles with status === 'plan_to_watch' are included.
 * Evaluated strictly in order:
 * 1. Waiting For Release
 * 2. Watch Soon
 * 3. This Weekend
 * 4. Maybe Later
 */
export function computeWatchlistSmartGroups(
  planToWatchTitles: DomainLibraryEntry[]
): WatchlistSmartGroups {
  const nowMs = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000

  const waitingForRelease: DomainLibraryEntry[] = []
  const watchSoon: DomainLibraryEntry[] = []
  const thisWeekend: DomainLibraryEntry[] = []
  const maybeLater: DomainLibraryEntry[] = []

  const unassigned: DomainLibraryEntry[] = []

  for (const entry of planToWatchTitles) {
    if (entry.status !== 'plan_to_watch') continue

    const releaseDate = entry.releaseDate ? new Date(entry.releaseDate) : null
    const isFutureRelease = Boolean(
      releaseDate && !isNaN(releaseDate.getTime()) && releaseDate.getTime() > nowMs
    )
    const addedAtDate = toDomainDate(entry.addedAt)
    const addedTime = addedAtDate ? addedAtDate.getTime() : nowMs
    const isRecentAdd = nowMs - addedTime <= sevenDaysMs
    const isOldAdd = nowMs - addedTime > sixtyDaysMs

    // 1. Waiting For Release
    if (isFutureRelease) {
      waitingForRelease.push(entry)
      continue
    }

    // 2. Watch Soon
    if (entry.priority === 'high' || (isRecentAdd && !isFutureRelease)) {
      watchSoon.push(entry)
      continue
    }

    // 3. This Weekend (released movie <= 120m, or TV show <= 6 episodes)
    const isShortMovie =
      entry.type === 'movie' &&
      typeof entry.runtimeMinutes === 'number' &&
      entry.runtimeMinutes > 0 &&
      entry.runtimeMinutes <= 120
    const isShortShow =
      entry.type === 'tv' &&
      typeof entry.tv?.totalEpisodes === 'number' &&
      entry.tv.totalEpisodes > 0 &&
      entry.tv.totalEpisodes <= 6

    if (isShortMovie || isShortShow) {
      thisWeekend.push(entry)
      continue
    }

    // 4. Maybe Later
    if (entry.priority === 'low' || isOldAdd) {
      maybeLater.push(entry)
      continue
    }

    // Unassigned
    unassigned.push(entry)
  }

  // Fallback for unassigned: if any group is empty, fill Watch Soon, else Maybe Later
  for (const entry of unassigned) {
    if (watchSoon.length === 0) {
      watchSoon.push(entry)
    } else {
      maybeLater.push(entry)
    }
  }

  return {
    waitingForRelease,
    watchSoon,
    thisWeekend,
    maybeLater,
  }
}
