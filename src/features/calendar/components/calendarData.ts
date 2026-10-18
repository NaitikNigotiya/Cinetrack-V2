import type { PlannedWatch, LibraryEntry } from '@/shared/schemas'
import type { UpcomingReleaseItem } from './CalendarSidebar'

export function formatDateString(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function computePlannedByDate(plannedWatches: PlannedWatch[]): Map<string, PlannedWatch[]> {
  const map = new Map<string, PlannedWatch[]>()
  plannedWatches.forEach((pw) => {
    const dateKey = pw.plannedFor
    let list = map.get(dateKey)
    if (!list) {
      list = []
      map.set(dateKey, list)
    }
    list.push(pw)
  })
  return map
}

export function computeWatchedByDate(libraryEntries: LibraryEntry[]): Map<string, LibraryEntry[]> {
  const map = new Map<string, LibraryEntry[]>()
  libraryEntries.forEach((entry) => {
    if (entry.status === 'completed' && entry.completedAt) {
      const d = entry.completedAt.toDate
        ? entry.completedAt.toDate()
        : new Date(entry.completedAt)
      const dateKey = formatDateString(d)
      let list = map.get(dateKey)
      if (!list) {
        list = []
        map.set(dateKey, list)
      }
      list.push(entry)
    }
  })
  return map
}

export function computeUpcomingReleases(libraryEntries: LibraryEntry[]): UpcomingReleaseItem[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const list: UpcomingReleaseItem[] = []
  const ptw = libraryEntries.filter((e) => e.status === 'plan_to_watch')

  ptw.forEach((item) => {
    if (item.year && item.year >= today.getFullYear()) {
      const releaseStr = `${item.year}-12-31`
      const releaseDate = new Date(releaseStr)
      const diffTime = releaseDate.getTime() - today.getTime()
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      list.push({
        titleKey: item.titleKey,
        title: item.title,
        type: item.type,
        posterPath: item.posterPath,
        releaseDate: String(item.year),
        daysUntil,
      })
    }
  })
  return list.slice(0, 10)
}

export function computeMonthDays(currentDate: Date) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const days: Array<{ date: Date; isCurrentMonth: boolean; dateKey: string }> = []
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({ date: d, isCurrentMonth: false, dateKey: formatDateString(d) })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    days.push({ date: d, isCurrentMonth: true, dateKey: formatDateString(d) })
  }
  const remaining = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({ date: d, isCurrentMonth: false, dateKey: formatDateString(d) })
  }
  return days
}

export function computeWeekDays(currentDate: Date) {
  const days: Array<{ date: Date; isCurrentMonth: boolean; dateKey: string }> = []
  const current = new Date(currentDate)
  const dayOfWeek = current.getDay()
  const sunday = new Date(current)
  sunday.setDate(current.getDate() - dayOfWeek)

  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    days.push({
      date: d,
      isCurrentMonth: d.getMonth() === currentDate.getMonth(),
      dateKey: formatDateString(d),
    })
  }
  return days
}
