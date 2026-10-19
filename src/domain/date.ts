/**
 * Pure date and timezone helpers with NO Firebase or React dependencies.
 * Default timezone: Asia/Kolkata (per Section 4.3).
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata'

/**
 * Safely parses any date-like value (Date, ISO string, epoch ms/seconds, or Firestore Timestamp) into a JS Date.
 */
export function toDomainDate(val: unknown): Date | null {
  if (!val) return null
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val
  }
  // Firestore Timestamp with toDate() method
  if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
    try {
      const d = (val as { toDate: () => Date }).toDate()
      return isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }
  // Firestore Timestamp serialized object { _seconds, _nanoseconds } or { seconds, nanoseconds }
  if (typeof val === 'object') {
    const s = (val as { _seconds?: number; seconds?: number })._seconds ?? (val as { seconds?: number }).seconds
    if (typeof s === 'number') {
      const d = new Date(s * 1000)
      return isNaN(d.getTime()) ? null : d
    }
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

/**
 * Returns YYYY-MM-DD formatted date in the given timezone.
 */
export function getDayKey(dateInput: unknown, timeZone = DEFAULT_TIMEZONE): string {
  const d = toDomainDate(dateInput) || new Date()
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * Returns YYYY-MM formatted string in the given timezone.
 */
export function getMonthKey(dateInput: unknown, timeZone = DEFAULT_TIMEZONE): string {
  const dayKey = getDayKey(dateInput, timeZone)
  return dayKey.slice(0, 7)
}

/**
 * Returns the current calendar year in the given timezone.
 */
export function getCurrentYear(timeZone = DEFAULT_TIMEZONE): number {
  const dayKey = getDayKey(new Date(), timeZone)
  return parseInt(dayKey.slice(0, 4), 10)
}

/**
 * Returns true if the date is in the current month in the given timezone.
 */
export function isThisMonth(dateInput: unknown, timeZone = DEFAULT_TIMEZONE): boolean {
  const targetMonth = getMonthKey(dateInput, timeZone)
  const currentMonth = getMonthKey(new Date(), timeZone)
  return targetMonth === currentMonth
}

/**
 * Returns true if the date is in the current calendar year in the given timezone.
 */
export function isThisYear(dateInput: unknown, timeZone = DEFAULT_TIMEZONE): boolean {
  const d = toDomainDate(dateInput)
  if (!d) return false
  const dayKey = getDayKey(d, timeZone)
  return dayKey.slice(0, 4) === String(getCurrentYear(timeZone))
}

/**
 * Computes the consecutive day streak ending today or yesterday in the given timezone.
 */
export function computeStreak(
  activeDayKeys: string[],
  timeZone = DEFAULT_TIMEZONE
): { currentStreak: number; longestStreak: number } {
  if (!activeDayKeys.length) return { currentStreak: 0, longestStreak: 0 }

  const uniqueSortedDays = Array.from(new Set(activeDayKeys)).sort()
  if (!uniqueSortedDays.length) return { currentStreak: 0, longestStreak: 0 }

  // Calculate longest streak across all recorded days
  let longestStreak = 0
  let currentRun = 0
  let prevDateMs: number | null = null

  const dayToEpoch = (dayKey: string) => {
    const [y, m, d] = dayKey.split('-').map(Number)
    return Date.UTC(y || 1970, (m || 1) - 1, d || 1)
  }

  for (const day of uniqueSortedDays) {
    const epoch = dayToEpoch(day)
    if (prevDateMs === null) {
      currentRun = 1
    } else {
      const diffDays = Math.round((epoch - prevDateMs) / (24 * 60 * 60 * 1000))
      if (diffDays === 1) {
        currentRun += 1
      } else if (diffDays > 1) {
        currentRun = 1
      }
    }
    prevDateMs = epoch
    if (currentRun > longestStreak) {
      longestStreak = currentRun
    }
  }

  // Calculate current streak: consecutive active days ending on today or yesterday
  const todayKey = getDayKey(new Date(), timeZone)
  const todayEpoch = dayToEpoch(todayKey)
  const yesterdayEpoch = todayEpoch - 24 * 60 * 60 * 1000

  const lastActiveDay = uniqueSortedDays[uniqueSortedDays.length - 1]!
  const lastActiveEpoch = dayToEpoch(lastActiveDay)

  let currentStreak = 0
  if (lastActiveEpoch === todayEpoch || lastActiveEpoch === yesterdayEpoch) {
    currentStreak = 1
    let checkEpoch = lastActiveEpoch
    for (let i = uniqueSortedDays.length - 2; i >= 0; i--) {
      const day = uniqueSortedDays[i]!
      const epoch = dayToEpoch(day)
      const diff = Math.round((checkEpoch - epoch) / (24 * 60 * 60 * 1000))
      if (diff === 1) {
        currentStreak += 1
        checkEpoch = epoch
      } else {
        break
      }
    }
  }

  return { currentStreak, longestStreak }
}

/**
 * Returns human-readable relative time (e.g. '5m ago', '2h ago', 'yesterday').
 */
export function formatRelativeTime(dateInput: unknown): string {
  const d = toDomainDate(dateInput)
  if (!d) return 'just now'
  const diffMs = Date.now() - d.getTime()
  if (diffMs < 0) return 'just now'
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
