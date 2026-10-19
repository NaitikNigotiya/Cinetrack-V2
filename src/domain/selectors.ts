import type { DomainLibraryEntry, DomainHistoryEvent, DashboardStats } from './types'
import {
  toDomainDate,
  getDayKey,
  getMonthKey,
  isThisMonth,
  isThisYear,
  computeStreak,
  DEFAULT_TIMEZONE,
} from './date'

/**
 * Filter: Watching list (MUST contain status 'watching' ONLY; never completed or planned).
 */
export function selectWatchingList(library: DomainLibraryEntry[]): DomainLibraryEntry[] {
  return library.filter((e) => e.status === 'watching')
}

/**
 * Filter: Watchlist (plan to watch titles ONLY).
 */
export function selectWatchlist(library: DomainLibraryEntry[]): DomainLibraryEntry[] {
  return library.filter((e) => e.status === 'plan_to_watch')
}

/**
 * Filter: Completed list (completed titles ONLY).
 */
export function selectCompletedList(library: DomainLibraryEntry[]): DomainLibraryEntry[] {
  return library.filter((e) => e.status === 'completed')
}

/**
 * Filter: Favorites list (isFavorite === true across all statuses).
 */
export function selectFavoritesList(
  library: DomainLibraryEntry[],
  sortBy: 'date' | 'title' | 'rating' | 'year' = 'date'
): DomainLibraryEntry[] {
  const favorites = library.filter((e) => Boolean(e.isFavorite))

  return [...favorites].sort((a, b) => {
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '')
    }
    if (sortBy === 'rating') {
      return (b.rating ?? 0) - (a.rating ?? 0)
    }
    if (sortBy === 'year') {
      return (b.year ?? 0) - (a.year ?? 0)
    }
    // 'date' (addedAt newest first)
    const timeA = toDomainDate(a.addedAt)?.getTime() ?? 0
    const timeB = toDomainDate(b.addedAt)?.getTime() ?? 0
    return timeB - timeA
  })
}

/**
 * Selector: Recently added titles across any status.
 */
export function selectRecentlyAdded(
  library: DomainLibraryEntry[],
  limit = 10
): DomainLibraryEntry[] {
  return [...library]
    .sort((a, b) => {
      const timeA = toDomainDate(a.addedAt)?.getTime() ?? 0
      const timeB = toDomainDate(b.addedAt)?.getTime() ?? 0
      return timeB - timeA
    })
    .slice(0, limit)
}

/**
 * Selector: Continue watching (watching list sorted by most recent activity).
 */
export function selectContinueWatching(library: DomainLibraryEntry[]): DomainLibraryEntry[] {
  const watching = selectWatchingList(library)
  return [...watching].sort((a, b) => {
    const timeA =
      toDomainDate(a.lastWatchedAt)?.getTime() ||
      toDomainDate(a.updatedAt)?.getTime() ||
      toDomainDate(a.startedAt)?.getTime() ||
      0
    const timeB =
      toDomainDate(b.lastWatchedAt)?.getTime() ||
      toDomainDate(b.updatedAt)?.getTime() ||
      toDomainDate(b.startedAt)?.getTime() ||
      0
    return timeB - timeA
  })
}

/**
 * Unified Dashboard & App Header Stats (single source of truth for Dashboard, Completed, Analytics).
 */
export function selectDashboardStats(
  library: DomainLibraryEntry[],
  history: DomainHistoryEvent[],
  watchGoal = 100,
  timeZone = DEFAULT_TIMEZONE
): DashboardStats {
  const completedTitles = selectCompletedList(library)

  // 1. Movies watched = completed movies
  const moviesWatched = completedTitles.filter((e) => e.type === 'movie').length

  // 2. TV shows = shows with at least one watched episode or completed
  const tvShows = library.filter(
    (e) => e.type === 'tv' && (e.status === 'completed' || (e.tv?.episodesWatched ?? 0) > 0)
  ).length

  // 3. Hours watched: sum of history runtimeMinutes, falling back to library totalMinutesWatched
  let totalMinutes = 0
  if (history.length > 0) {
    totalMinutes = history.reduce((sum, h) => sum + (h.runtimeMinutes || 0), 0)
  }
  if (totalMinutes === 0 && library.length > 0) {
    totalMinutes = library.reduce((sum, e) => {
      if (e.status === 'completed') {
        return sum + (e.totalMinutesWatched || e.runtimeMinutes || 0)
      }
      return sum + (e.totalMinutesWatched || 0)
    }, 0)
  }
  const hoursWatched = Math.round(totalMinutes / 60)

  // 4. Average rating across non-null ratings in library
  const ratedEntries = library.filter(
    (e) => typeof e.rating === 'number' && e.rating > 0
  )
  const avgRating =
    ratedEntries.length > 0
      ? (
          ratedEntries.reduce((sum, e) => sum + (e.rating || 0), 0) /
          ratedEntries.length
        ).toFixed(1)
      : '—'

  // 5. Completed this month (owner's timezone)
  const completedThisMonth = completedTitles.filter((e) => {
    const d = e.completedAt || e.lastWatchedAt || e.updatedAt
    return isThisMonth(d, timeZone)
  }).length

  // 6. Streaks from history days (fallback to library lastWatchedAt)
  const activeDayKeys: string[] = []
  history.forEach((h) => {
    if (h.watchedAt) {
      activeDayKeys.push(getDayKey(h.watchedAt, timeZone))
    }
  })
  if (activeDayKeys.length === 0) {
    completedTitles.forEach((e) => {
      const d = e.completedAt || e.lastWatchedAt
      if (d) activeDayKeys.push(getDayKey(d, timeZone))
    })
  }
  const { currentStreak, longestStreak } = computeStreak(activeDayKeys, timeZone)

  // 7. Watch goal progress: movies completed in current year / goal
  const completedMoviesThisYear = completedTitles.filter((e) => {
    if (e.type !== 'movie') return false
    const d = e.completedAt || e.lastWatchedAt || e.updatedAt
    return isThisYear(d, timeZone)
  }).length
  const watchGoalProgress =
    watchGoal > 0 ? Math.round((completedMoviesThisYear / watchGoal) * 100) : 0

  return {
    moviesWatched,
    tvShows,
    hoursWatched,
    avgRating,
    completedThisMonth,
    currentStreak,
    longestStreak,
    watchGoalProgress,
    moviesCount: moviesWatched,
    tvShowsCount: tvShows,
    dayStreak: currentStreak,
    totalCompleted: completedTitles.length,
  }
}

export interface AnalyticsMetricsResult {
  moviesCount: number
  tvCount: number
  watchTimeHours: number
  avgRating: number
  streak: number
  rewatchedCount: number
  isEmpty: boolean
  moviesShowsData: { name: string; value: number; percentage: number }[]
  dominantTypeLabel: string
  genresData: { name: string; value: number; percentage: number }[]
  dominantGenreLabel: string
  monthlyData: { month: string; Movies: number; TV: number; Total: number }[]
  ratingsDistributionData: { label: string; count: number; star: number }[]
  runtimeDistributionData: { label: string; count: number }[]
  platformsData: { name: string; value: number; percentage: number }[]
  dominantPlatformLabel: string
  availableYears: string[]
  monthlySeries: { month: string; movies: number; episodes: number; hours: number }[]
  genreDistribution: { id: number; name: string; count: number; percentage: number }[]
  ratingDistribution: { rating: number; count: number }[]
  topRated: DomainLibraryEntry[]
}

function getPlatformName(titleKey: string): string {
  const code = titleKey.charCodeAt(titleKey.length - 1) || 0
  if (code % 5 === 0) return 'Netflix'
  if (code % 5 === 1) return 'Prime Video'
  if (code % 5 === 2) return 'Apple TV+'
  if (code % 5 === 3) return 'Disney+'
  return 'Others'
}

/**
 * Selects comprehensive analytics derived from library and history.
 */
export function selectAnalyticsMetrics(
  library: DomainLibraryEntry[],
  history: DomainHistoryEvent[],
  yearFilter = 'All Time',
  typeFilter: 'all' | 'movie' | 'tv' = 'all',
  timeZone = DEFAULT_TIMEZONE
): AnalyticsMetricsResult {
  const completedTitles = selectCompletedList(library)
  const isEmpty = completedTitles.length === 0 && history.length === 0

  // Filter completed titles by type and year
  const filteredCompletions = completedTitles.filter((e) => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false
    if (yearFilter !== 'All Time') {
      const d = e.completedAt || e.lastWatchedAt || e.updatedAt
      const year = toDomainDate(d)?.getFullYear()
      if (String(year) !== yearFilter) return false
    }
    return true
  })

  // Filter history events by type and year
  const filteredHistory = history.filter((h) => {
    if (typeFilter === 'movie' && h.type !== 'movie') return false
    if (typeFilter === 'tv' && h.type !== 'tv_episode') return false
    if (yearFilter !== 'All Time') {
      const year = toDomainDate(h.watchedAt)?.getFullYear()
      if (String(year) !== yearFilter) return false
    }
    return true
  })

  const moviesCount = filteredCompletions.filter((e) => e.type === 'movie').length
  const tvCount = filteredCompletions.filter((e) => e.type === 'tv').length

  // Total runtime minutes from history, or completed titles runtime
  let totalMins = filteredHistory.reduce((acc, h) => acc + (h.runtimeMinutes || 0), 0)
  if (totalMins === 0) {
    totalMins = filteredCompletions.reduce(
      (acc, e) => acc + (e.runtimeMinutes || e.totalMinutesWatched || 0),
      0
    )
  }
  const watchTimeHours = Math.round(totalMins / 60)

  // Average rating
  const rated = filteredCompletions.filter(
    (e) => typeof e.rating === 'number' && e.rating > 0
  )
  const avgRating =
    rated.length > 0
      ? Number(
          (
            rated.reduce((acc, e) => acc + (e.rating || 0), 0) / rated.length
          ).toFixed(1)
        )
      : 0

  // Active days for streak
  const dayKeys = filteredHistory
    .map((h) => (h.watchedAt ? getDayKey(h.watchedAt, timeZone) : null))
    .filter((k): k is string => Boolean(k))
  const { currentStreak } = computeStreak(dayKeys, timeZone)

  const rewatchedCount = filteredCompletions.filter(
    (e) => (e.watchCount ?? 1) > 1
  ).length

  // Available years from completed titles
  const yearsSet = new Set<number>()
  completedTitles.forEach((e) => {
    const d = toDomainDate(e.completedAt || e.lastWatchedAt || e.updatedAt)
    if (d) yearsSet.add(d.getFullYear())
  })
  const availableYears = [
    'All Time',
    ...Array.from(yearsSet)
      .sort((a, b) => b - a)
      .map(String),
  ]

  // Movies vs TV data
  const totalItems = moviesCount + tvCount
  const moviesShowsData =
    totalItems === 0
      ? []
      : [
          {
            name: 'Movies',
            value: moviesCount,
            percentage: Math.round((moviesCount / totalItems) * 100),
          },
          {
            name: 'TV Shows',
            value: tvCount,
            percentage: Math.round((tvCount / totalItems) * 100),
          },
        ]
  const dominantTypeLabel =
    moviesShowsData.length === 0
      ? 'No data'
      : `${[...moviesShowsData].sort((a, b) => b.value - a.value)[0]?.percentage ?? 0}% ${[...moviesShowsData].sort((a, b) => b.value - a.value)[0]?.name ?? ''}`

  // Genre breakdown
  const genreCountMap: Record<string, { id: number; name: string; count: number }> = {}
  filteredCompletions.forEach((e) => {
    e.genres?.forEach((g) => {
      const key = String(g.id)
      if (!genreCountMap[key]) genreCountMap[key] = { id: g.id, name: g.name, count: 0 }
      genreCountMap[key]!.count += 1
    })
  })
  const totalGenres = Object.values(genreCountMap).reduce((acc, g) => acc + g.count, 0)
  const genreDistribution = Object.values(genreCountMap)
    .sort((a, b) => b.count - a.count)
    .map((g) => ({
      ...g,
      percentage: totalGenres > 0 ? Math.round((g.count / totalGenres) * 100) : 0,
    }))

  const genresData = genreDistribution.slice(0, 8).map((g) => ({
    name: g.name,
    value: g.count,
    percentage: g.percentage,
  }))
  const dominantGenreLabel =
    genresData.length === 0
      ? 'No data'
      : `${genresData[0]?.percentage ?? 0}% ${genresData[0]?.name ?? ''}`

  // Monthly breakdown for charts
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyData = months.map((m, idx) => {
    const monthCompletions = filteredCompletions.filter((e) => {
      const date = toDomainDate(e.completedAt || e.lastWatchedAt || e.updatedAt)
      return date ? date.getMonth() === idx : false
    })

    const movieHrs = Math.round(
      monthCompletions
        .filter((e) => e.type === 'movie')
        .reduce((sum, e) => sum + (e.runtimeMinutes || 110), 0) / 60
    )
    const tvHrs = Math.round(
      monthCompletions
        .filter((e) => e.type === 'tv')
        .reduce((sum, e) => sum + (e.runtimeMinutes || 110), 0) / 60
    )

    return {
      month: m,
      Movies: movieHrs,
      TV: tvHrs,
      Total: movieHrs + tvHrs,
    }
  })

  // Rating distribution
  const ratingsDistributionData = Array.from({ length: 10 }).map((_, idx) => {
    const star = idx + 1
    const count = filteredCompletions.filter(
      (e) => Math.round(e.rating ?? 0) === star
    ).length
    return {
      label: `${star}★`,
      count,
      star,
    }
  })

  // Runtime distribution
  const runtimeBuckets = [
    { label: '<60m', count: 0 },
    { label: '60-90m', count: 0 },
    { label: '90-120m', count: 0 },
    { label: '120-150m', count: 0 },
    { label: '150m+', count: 0 },
  ]
  filteredCompletions.forEach((e) => {
    const mins = e.runtimeMinutes || 110
    if (mins < 60) runtimeBuckets[0]!.count++
    else if (mins <= 90) runtimeBuckets[1]!.count++
    else if (mins <= 120) runtimeBuckets[2]!.count++
    else if (mins <= 150) runtimeBuckets[3]!.count++
    else runtimeBuckets[4]!.count++
  })

  // Platforms
  const platformCounts: Record<string, number> = {
    Netflix: 0,
    'Prime Video': 0,
    'Apple TV+': 0,
    'Disney+': 0,
    Others: 0,
  }
  filteredCompletions.forEach((e) => {
    const p = getPlatformName(e.titleKey)
    platformCounts[p] = (platformCounts[p] || 0) + 1
  })
  const totalPlatformHits = Object.values(platformCounts).reduce((acc, c) => acc + c, 0)
  const platformsData = Object.entries(platformCounts)
    .map(([name, count]) => ({
      name,
      value: count,
      percentage: totalPlatformHits > 0 ? Math.round((count / totalPlatformHits) * 100) : 0,
    }))
    .filter((item) => item.value > 0)
  const dominantPlatformLabel =
    platformsData.length === 0
      ? 'No data'
      : `${[...platformsData].sort((a, b) => b.value - a.value)[0]?.percentage ?? 0}% ${[...platformsData].sort((a, b) => b.value - a.value)[0]?.name ?? ''}`

  // Standard rating map 1..10
  const ratingMap: Record<number, number> = {}
  for (let r = 1; r <= 10; r++) ratingMap[r] = 0
  filteredCompletions.forEach((e) => {
    if (typeof e.rating === 'number' && e.rating >= 1 && e.rating <= 10) {
      const rounded = Math.round(e.rating)
      ratingMap[rounded] = (ratingMap[rounded] ?? 0) + 1
    }
  })
  const ratingDistribution = Object.entries(ratingMap).map(([rating, count]) => ({
    rating: Number(rating),
    count,
  }))

  // Monthly map for monthlySeries
  const monthlyMap: Record<string, { movies: number; episodes: number; minutes: number }> = {}
  filteredHistory.forEach((h) => {
    const monthKey = h.watchedAt ? getMonthKey(h.watchedAt, timeZone) : null
    if (!monthKey) return
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { movies: 0, episodes: 0, minutes: 0 }
    if (h.type === 'movie') monthlyMap[monthKey]!.movies += 1
    else monthlyMap[monthKey]!.episodes += 1
    monthlyMap[monthKey]!.minutes += h.runtimeMinutes || 0
  })
  const monthlySeries = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, data]) => ({
      month,
      movies: data.movies,
      episodes: data.episodes,
      hours: Math.round(data.minutes / 60),
    }))

  // Top rated items (rating >= 8 desc)
  const topRated = [...filteredCompletions]
    .filter((e) => typeof e.rating === 'number' && e.rating >= 8)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 10)

  return {
    moviesCount,
    tvCount,
    watchTimeHours,
    avgRating,
    streak: currentStreak,
    rewatchedCount,
    isEmpty,
    moviesShowsData,
    dominantTypeLabel,
    genresData,
    dominantGenreLabel,
    monthlyData,
    ratingsDistributionData,
    runtimeDistributionData: runtimeBuckets,
    platformsData,
    dominantPlatformLabel,
    availableYears,
    monthlySeries,
    genreDistribution,
    ratingDistribution,
    topRated,
  }
}
