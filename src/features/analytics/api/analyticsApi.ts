import {
  collection,
  doc,
  getDocs,
  getDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import { createZodConverter } from '@/services/firebase/converters'
import {
  StatsSummarySchema,
  MonthlyStatsSchema,
  HistoryEventSchema,
  LibraryEntrySchema,
  type StatsSummary,
  type MonthlyStats,
} from '@/shared/schemas'
import { calculateStreaks } from '../lib/streaks'

const statsConverter = createZodConverter(StatsSummarySchema, 'stats')
const monthlyConverter = createZodConverter(MonthlyStatsSchema, 'monthlyStats')
const historyConverter = createZodConverter(HistoryEventSchema, 'history')
const libraryConverter = createZodConverter(LibraryEntrySchema, 'library')

export async function fetchStatsSummary(uid: string): Promise<StatsSummary | null> {
  const ref = doc(firestore, `users/${uid}/stats/summary`).withConverter(statsConverter)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

export async function fetchMonthlyStats(uid: string): Promise<MonthlyStats[]> {
  const colRef = collection(firestore, `users/${uid}/stats`).withConverter(monthlyConverter)
  const snapshot = await getDocs(colRef)
  return snapshot.docs
    .filter((d) => d.id.startsWith('monthly_'))
    .map((d) => d.data())
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

/**
 * Recomputes all summary and monthly statistics from source-of-truth
 * library and history documents. Fixes D4 counter drift.
 */
export async function recomputeStats(uid: string): Promise<StatsSummary> {
  // 1. Fetch all history events
  const histCol = collection(firestore, `users/${uid}/history`).withConverter(historyConverter)
  const histSnap = await getDocs(histCol)
  const historyEvents = histSnap.docs.map((d) => d.data())

  // 2. Fetch all library entries
  const libCol = collection(firestore, `users/${uid}/library`).withConverter(libraryConverter)
  const libSnap = await getDocs(libCol)
  const libraryEntries = libSnap.docs.map((d) => d.data())

  // 3. Aggregate metrics
  let moviesWatched = 0
  let episodesWatched = 0
  let minutesWatched = 0
  const genreCounts: Record<string, number> = {}
  const activeDays: string[] = []
  const monthlyMap: Record<string, MonthlyStats> = {}

  historyEvents.forEach((ev) => {
    if (ev.type === 'movie') moviesWatched += 1
    if (ev.type === 'tv_episode') episodesWatched += 1
    const runtime = ev.runtimeMinutes || 0
    minutesWatched += runtime

    // Genre frequency
    ev.genreIds?.forEach((gid) => {
      const gKey = String(gid)
      genreCounts[gKey] = (genreCounts[gKey] ?? 0) + 1
    })

    // Active day
    const dateObj = ev.watchedAt && typeof ev.watchedAt.toDate === 'function' ? ev.watchedAt.toDate() : null
    if (dateObj) {
      const dayKey = dateObj.toISOString().slice(0, 10)
      activeDays.push(dayKey)

      const monthKey = dayKey.slice(0, 7) // YYYY-MM
      const currentMonth = monthlyMap[monthKey] ?? {
        monthKey,
        movies: 0,
        episodes: 0,
        movieMinutes: 0,
        tvMinutes: 0,
        genreCounts: {},
      }

      if (ev.type === 'movie') {
        currentMonth.movies += 1
        currentMonth.movieMinutes += runtime
      } else {
        currentMonth.episodes += 1
        currentMonth.tvMinutes += runtime
      }

      monthlyMap[monthKey] = currentMonth
    }
  })

  // Library status counts and ratings
  const statusCounts: Record<string, number> = {}
  let ratingSum = 0
  let ratingCount = 0
  let titlesCompleted = 0

  libraryEntries.forEach((entry) => {
    statusCounts[entry.status] = (statusCounts[entry.status] ?? 0) + 1
    if (entry.status === 'completed') titlesCompleted += 1
    if (entry.rating !== null && entry.rating !== undefined) {
      ratingSum += entry.rating
      ratingCount += 1
    }
  })

  // Streaks
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const { currentStreak, longestStreak } = calculateStreaks(activeDays, todayKey)
  const lastActiveDay = activeDays.sort().pop() ?? null

  const summaryData: StatsSummary = {
    moviesWatched,
    episodesWatched,
    minutesWatched,
    titlesCompleted,
    ratingSum,
    ratingCount,
    genreCounts,
    statusCounts,
    currentStreak,
    longestStreak,
    lastActiveDay,
    updatedAt: serverTimestamp(),
  }

  // 4. Write back to Firestore atomically via writeBatch
  const batch = writeBatch(firestore)
  const summaryRef = doc(firestore, `users/${uid}/stats/summary`)
  batch.set(summaryRef, summaryData)

  Object.values(monthlyMap).forEach((monthData) => {
    const monthDoc = doc(firestore, `users/${uid}/stats/monthly_${monthData.monthKey}`)
    batch.set(monthDoc, monthData)
  })

  await batch.commit()
  return summaryData
}

export interface LibraryInsights {
  ratingDistribution: { bucket: string; count: number }[]
  decadeDistribution: { decade: string; count: number }[]
  topRatedTitles: {
    titleKey: string
    title: string
    year: number | null
    rating: number
    posterPath: string | null
    type: 'movie' | 'tv'
  }[]
}

export interface ActivityMap {
  dayCounts: Record<string, number>
  availableYears: string[]
}

export async function fetchLibraryInsights(uid: string): Promise<LibraryInsights> {
  const libCol = collection(firestore, `users/${uid}/library`).withConverter(libraryConverter)
  const libSnap = await getDocs(libCol)
  const entries = libSnap.docs.map((d) => d.data())

  const buckets: Record<string, number> = {
    '1–2': 0,
    '3–4': 0,
    '5–6': 0,
    '7–8': 0,
    '9–10': 0,
  }

  const decades: Record<string, number> = {}
  const ratedEntries: LibraryInsights['topRatedTitles'] = []

  entries.forEach((e) => {
    if (e.rating !== null && e.rating !== undefined) {
      const r = Math.round(e.rating)
      if (r <= 2) buckets['1–2'] = (buckets['1–2'] ?? 0) + 1
      else if (r <= 4) buckets['3–4'] = (buckets['3–4'] ?? 0) + 1
      else if (r <= 6) buckets['5–6'] = (buckets['5–6'] ?? 0) + 1
      else if (r <= 8) buckets['7–8'] = (buckets['7–8'] ?? 0) + 1
      else buckets['9–10'] = (buckets['9–10'] ?? 0) + 1

      ratedEntries.push({
        titleKey: e.titleKey,
        title: e.title,
        year: e.year ?? null,
        rating: e.rating,
        posterPath: e.posterPath ?? null,
        type: e.type,
      })
    }

    if (e.year && e.year > 1900) {
      const dec = `${Math.floor(e.year / 10) * 10}s`
      decades[dec] = (decades[dec] ?? 0) + 1
    }
  })

  ratedEntries.sort((a, b) => b.rating - a.rating)

  const ratingDistribution = Object.entries(buckets).map(([bucket, count]) => ({
    bucket,
    count,
  }))

  const decadeDistribution = Object.entries(decades)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([decade, count]) => ({ decade, count }))

  return {
    ratingDistribution,
    decadeDistribution,
    topRatedTitles: ratedEntries.slice(0, 5),
  }
}

export async function fetchActivityMap(uid: string): Promise<ActivityMap> {
  const histCol = collection(firestore, `users/${uid}/history`).withConverter(historyConverter)
  const histSnap = await getDocs(histCol)
  const dayCounts: Record<string, number> = {}
  const yearsSet = new Set<string>()

  histSnap.docs.forEach((d) => {
    const ev = d.data()
    const dateObj = ev.watchedAt && typeof ev.watchedAt.toDate === 'function' ? ev.watchedAt.toDate() : null
    if (dateObj) {
      const dayKey = dateObj.toISOString().slice(0, 10)
      dayCounts[dayKey] = (dayCounts[dayKey] ?? 0) + 1
      yearsSet.add(dayKey.slice(0, 4))
    }
  })

  const currentYear = new Date().getFullYear().toString()
  yearsSet.add(currentYear)

  return {
    dayCounts,
    availableYears: Array.from(yearsSet).sort().reverse(),
  }
}

