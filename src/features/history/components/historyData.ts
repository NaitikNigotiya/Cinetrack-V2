import type { HistoryEvent } from '@/shared/schemas'
import type { TimelineGroup } from './HistoryTimelineView'

export type TimeFilter = 'all' | '7d' | '30d' | 'this_month' | 'this_year'
export type SortOption = 'newest' | 'oldest' | 'runtime_desc' | 'rating_desc'

export function formatWatchDate(dateObj: Date | null) {
  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    return { dayKey: 'unknown', fullDate: 'Unknown Date', timeStr: '', isToday: false, isYesterday: false }
  }
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)
  const dayKey = dateObj.toISOString().slice(0, 10)

  return {
    dayKey,
    fullDate: dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
    timeStr: dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    isToday: dayKey === todayKey,
    isYesterday: dayKey === yesterdayKey,
  }
}

export function formatMinutes(totalMins: number): string {
  if (totalMins <= 0) return '0m'
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function calculateGlobalStats(rawEvents: HistoryEvent[]) {
  let movieCount = 0
  let tvCount = 0
  let totalMinutes = 0
  let ratedCount = 0
  let ratingSum = 0
  let thisMonthCount = 0
  let thisMonthMins = 0

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  rawEvents.forEach((e) => {
    if (e.type === 'movie') movieCount += 1
    else if (e.type === 'tv_episode') tvCount += 1

    if (e.runtimeMinutes) totalMinutes += e.runtimeMinutes
    if (typeof e.rating === 'number' && e.rating > 0) {
      ratedCount += 1
      ratingSum += e.rating
    }

    const d = e.watchedAt && typeof e.watchedAt.toDate === 'function' ? e.watchedAt.toDate() : null
    if (d && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      thisMonthCount += 1
      if (e.runtimeMinutes) thisMonthMins += e.runtimeMinutes
    }
  })

  const totalCount = rawEvents.length
  const totalHours = Math.round(totalMinutes / 60)
  const thisMonthHours = Math.round(thisMonthMins / 60)
  const avgRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : null
  const avgMins = totalCount > 0 ? Math.round(totalMinutes / totalCount) : 0

  return { totalCount, movieCount, tvCount, totalHours, thisMonthCount, thisMonthHours, avgRating, ratedCount, avgMins }
}

export function processHistoryEvents(
  rawEvents: HistoryEvent[],
  typeFilter: 'all' | 'movie' | 'tv_episode',
  timeFilter: TimeFilter,
  searchQuery: string,
  sortOption: SortOption
): HistoryEvent[] {
  let list = [...rawEvents]

  if (typeFilter !== 'all') {
    list = list.filter((e) => e.type === typeFilter)
  }

  if (timeFilter !== 'all') {
    const now = new Date()
    const cutoff = new Date()
    if (timeFilter === '7d') cutoff.setDate(now.getDate() - 7)
    else if (timeFilter === '30d') cutoff.setDate(now.getDate() - 30)
    else if (timeFilter === 'this_month') cutoff.setDate(1)
    else if (timeFilter === 'this_year') {
      cutoff.setMonth(0)
      cutoff.setDate(1)
    }

    list = list.filter((e) => {
      const d = e.watchedAt && typeof e.watchedAt.toDate === 'function' ? e.watchedAt.toDate() : null
      return d ? d >= cutoff : true
    })
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim()
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.episodeLabel && e.episodeLabel.toLowerCase().includes(q))
    )
  }

  list.sort((a, b) => {
    const getTimestamp = (ev: HistoryEvent) =>
      ev.watchedAt && typeof ev.watchedAt.toMillis === 'function'
        ? ev.watchedAt.toMillis()
        : 0

    if (sortOption === 'newest') return getTimestamp(b) - getTimestamp(a)
    if (sortOption === 'oldest') return getTimestamp(a) - getTimestamp(b)
    if (sortOption === 'runtime_desc') return (b.runtimeMinutes || 0) - (a.runtimeMinutes || 0)
    if (sortOption === 'rating_desc') return (b.rating || 0) - (a.rating || 0)
    return 0
  })

  return list
}

export function groupEventsByDay(processedEvents: HistoryEvent[]): TimelineGroup[] {
  const map = new Map<string, TimelineGroup>()
  processedEvents.forEach((ev) => {
    const dateObj = ev.watchedAt && typeof ev.watchedAt.toDate === 'function' ? ev.watchedAt.toDate() : null
    const { dayKey, fullDate, isToday, isYesterday } = formatWatchDate(dateObj)

    if (!map.has(dayKey)) {
      map.set(dayKey, { dayKey, fullDate, isToday, isYesterday, totalMinutes: 0, events: [] })
    }
    const g = map.get(dayKey)!
    g.events.push(ev)
    g.totalMinutes += ev.runtimeMinutes || 0
  })
  return Array.from(map.values())
}
