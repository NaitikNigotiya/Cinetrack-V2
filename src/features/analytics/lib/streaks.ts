/**
 * Pure function to calculate current and longest streaks given active days (YYYY-MM-DD).
 * A streak is consecutive days with activity.
 * Current streak is active if the last active day was today or yesterday.
 */
export function calculateStreaks(
  activeDays: string[],
  todayKey: string
): { currentStreak: number; longestStreak: number } {
  if (activeDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  // Deduplicate and sort chronologically
  const sorted = Array.from(new Set(activeDays)).sort()

  let maxStreak = 0
  let currentRun = 0
  let prevDateMs: number | null = null

  const ONE_DAY_MS = 86400000

  for (const day of sorted) {
    const d = new Date(`${day}T00:00:00Z`).getTime()
    if (prevDateMs === null) {
      currentRun = 1
    } else {
      const diff = Math.round((d - prevDateMs) / ONE_DAY_MS)
      if (diff === 1) {
        currentRun += 1
      } else if (diff > 1) {
        currentRun = 1
      }
    }

    if (currentRun > maxStreak) {
      maxStreak = currentRun
    }
    prevDateMs = d
  }

  // Determine current streak
  const lastActive = sorted[sorted.length - 1]
  let currentStreak = 0

  if (lastActive) {
    const lastMs = new Date(`${lastActive}T00:00:00Z`).getTime()
    const todayMs = new Date(`${todayKey}T00:00:00Z`).getTime()
    const daysSinceLast = Math.round((todayMs - lastMs) / ONE_DAY_MS)

    if (daysSinceLast <= 1) {
      // Streak is still alive (active today or yesterday)
      let run = 0
      let expectedMs = lastMs
      for (let i = sorted.length - 1; i >= 0; i--) {
        const item = sorted[i]
        if (!item) break
        const dayMs = new Date(`${item}T00:00:00Z`).getTime()
        const diff = Math.round((expectedMs - dayMs) / ONE_DAY_MS)
        if (diff === 0) {
          run += 1
          expectedMs -= ONE_DAY_MS
        } else {
          break
        }
      }
      currentStreak = run
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(maxStreak, currentStreak),
  }
}
