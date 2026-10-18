import type { LibraryEntry } from '@/shared/schemas'

export function getWatchDate(e: LibraryEntry): Date {
  if (e.completedAt) {
    return e.completedAt.toDate ? e.completedAt.toDate() : new Date(e.completedAt)
  }
  if (e.lastWatchedAt) {
    return e.lastWatchedAt.toDate ? e.lastWatchedAt.toDate() : new Date(e.lastWatchedAt)
  }
  if (e.updatedAt) {
    return e.updatedAt.toDate ? e.updatedAt.toDate() : new Date(e.updatedAt)
  }
  return new Date()
}

export function getPlatformName(titleKey: string): string {
  const code = titleKey.charCodeAt(titleKey.length - 1) || 0
  if (code % 5 === 0) return 'Netflix'
  if (code % 5 === 1) return 'Prime Video'
  if (code % 5 === 2) return 'Apple TV+'
  if (code % 5 === 3) return 'Disney+'
  return 'Others'
}

export interface AnalyticsMetrics {
  moviesCount: number
  tvCount: number
  watchTimeHours: number
  streak: number
  avgRating: number
  rewatchedCount: number
}

export function calculateMetrics(filteredCompletions: LibraryEntry[]): AnalyticsMetrics {
  const moviesCount = filteredCompletions.filter((e) => e.type === 'movie').length
  const tvCount = filteredCompletions.filter((e) => e.type === 'tv').length
  const totalRuntimeMins = filteredCompletions.reduce((acc, e) => acc + (e.runtimeMinutes || 110), 0)
  const watchTimeHours = Math.round(totalRuntimeMins / 60)

  const rated = filteredCompletions.filter((e) => e.rating !== null && e.rating !== undefined)
  const avgRating =
    rated.length > 0
      ? Number((rated.reduce((acc, e) => acc + (e.rating ?? 0), 0) / rated.length).toFixed(1))
      : 0

  const sortedDates = filteredCompletions
    .map((e) => getWatchDate(e))
    .sort((a, b) => b.getTime() - a.getTime())

  let streak = 0
  const firstDate = sortedDates[0]
  if (firstDate) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const lastWatch = new Date(
      firstDate.getFullYear(),
      firstDate.getMonth(),
      firstDate.getDate()
    ).getTime()
    const diffDays = Math.round((today - lastWatch) / (1000 * 60 * 60 * 24))

    if (diffDays <= 1) {
      streak = 1
      let prevTime = lastWatch
      for (let i = 1; i < sortedDates.length; i++) {
        const checkDateVal = sortedDates[i]
        if (!checkDateVal) break
        const checkDate = new Date(
          checkDateVal.getFullYear(),
          checkDateVal.getMonth(),
          checkDateVal.getDate()
        ).getTime()
        const checkDiff = Math.round((prevTime - checkDate) / (1000 * 60 * 60 * 24))
        if (checkDiff === 1) {
          streak++
          prevTime = checkDate
        } else if (checkDiff > 1) {
          break
        }
      }
    }
  }

  const rewatchedCount = filteredCompletions.filter((e) => (e.watchCount ?? 1) > 1).length

  return {
    moviesCount,
    tvCount,
    watchTimeHours,
    streak,
    avgRating,
    rewatchedCount,
  }
}

export function calculateGenresData(filteredCompletions: LibraryEntry[]) {
  const counts: Record<string, number> = {}
  filteredCompletions.forEach((e) => {
    e.genres?.forEach((g) => {
      counts[g.name] = (counts[g.name] || 0) + 1
    })
  })

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const total = sorted.reduce((acc, [, c]) => acc + c, 0)
  return sorted.slice(0, 8).map(([name, count]) => ({
    name,
    value: count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }))
}

export function calculateMonthlyData(filteredCompletions: LibraryEntry[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((m, idx) => {
    const monthCompletions = filteredCompletions.filter((e) => {
      const date = getWatchDate(e)
      return date.getMonth() === idx
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
}

export function calculateRatingsDistribution(filteredCompletions: LibraryEntry[]) {
  return Array.from({ length: 10 }).map((_, idx) => {
    const star = idx + 1
    const count = filteredCompletions.filter((e) => Math.round(e.rating ?? 0) === star).length
    return {
      label: `${star}★`,
      count,
      star,
    }
  })
}

export function calculateRuntimeDistribution(filteredCompletions: LibraryEntry[]) {
  const buckets = [
    { label: '<60m', count: 0 },
    { label: '60-90m', count: 0 },
    { label: '90-120m', count: 0 },
    { label: '120-150m', count: 0 },
    { label: '150m+', count: 0 },
  ]

  filteredCompletions.forEach((e) => {
    const mins = e.runtimeMinutes || 110
    if (mins < 60) {
      if (buckets[0]) buckets[0].count++
    } else if (mins <= 90) {
      if (buckets[1]) buckets[1].count++
    } else if (mins <= 120) {
      if (buckets[2]) buckets[2].count++
    } else if (mins <= 150) {
      if (buckets[3]) buckets[3].count++
    } else {
      if (buckets[4]) buckets[4].count++
    }
  })

  return buckets
}

export function calculatePlatformsData(filteredCompletions: LibraryEntry[]) {
  const counts: Record<string, number> = {
    Netflix: 0,
    'Prime Video': 0,
    'Apple TV+': 0,
    'Disney+': 0,
    Others: 0,
  }

  filteredCompletions.forEach((e) => {
    const p = getPlatformName(e.titleKey)
    counts[p] = (counts[p] || 0) + 1
  })

  const total = Object.values(counts).reduce((acc, c) => acc + c, 0)
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      value: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .filter((item) => item.value > 0)
}
