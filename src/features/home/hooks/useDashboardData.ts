import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import { statsSummaryConverter } from '@/services/firebase/collections'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { getPosterUrl, getBackdropUrl } from '@/shared/lib/tmdbImage'
import type { HistoryEvent, LibraryEntry, StatsSummary } from '@/shared/schemas'

export const MOVIE_QUOTES = [
  { quote: 'Get busy living, or get busy dying.', film: 'The Shawshank Redemption' },
  { quote: "I'm going to make him an offer he can't refuse.", film: 'The Godfather' },
  { quote: 'Why so serious?', film: 'The Dark Knight' },
  { quote: "You can't handle the truth!", film: 'A Few Good Men' },
  { quote: 'I see dead people.', film: 'The Sixth Sense' },
  { quote: 'To infinity and beyond!', film: 'Toy Story' },
  { quote: 'My precious.', film: 'The Lord of the Rings' },
  { quote: 'Just keep swimming.', film: 'Finding Nemo' },
  { quote: 'Life is like a box of chocolates.', film: 'Forrest Gump' },
  { quote: "Here's looking at you, kid.", film: 'Casablanca' },
  { quote: 'May the Force be with you.', film: 'Star Wars' },
  { quote: "I'll be back.", film: 'The Terminator' },
  { quote: "You're a wizard, Harry.", film: 'Harry Potter' },
  { quote: 'Do not go gentle into that good night.', film: 'Interstellar' },
]

export const MOOD_GENRES: Record<string, number[]> = {
  Happy: [35, 16],
  Dark: [53, 80, 27],
  'Mind Bend': [878, 9648],
  Chill: [18, 10749],
  Excited: [28, 12],
}

export function getRelativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime()
  if (diffMs < 0) return 'just now'
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function useDashboardData(uid: string | undefined, entries: LibraryEntry[]) {
  const [historyList, setHistoryList] = useState<HistoryEvent[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const currentYear = new Date().getFullYear()

  const [watchGoal, setWatchGoal] = useState<number>(() => {
    const saved = localStorage.getItem(`cinetrack-watch-goal-${currentYear}`)
    return saved ? parseInt(saved, 10) : 100
  })

  const [mood, setMood] = useState<string | null>(() => localStorage.getItem('cinetrack-mood'))

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = useMemo(
    () => currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    [currentTime]
  )

  const formattedTime = useMemo(
    () => currentTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    [currentTime]
  )

  useEffect(() => {
    if (!uid) return
    const q = query(collection(firestore, `users/${uid}/history`), orderBy('watchedAt', 'desc'), limit(20))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setHistoryList(snap.docs.map((d) => d.data() as HistoryEvent))
      },
      (err) => console.warn('[CineTrack] History sync warn:', err)
    )
    return () => unsub()
  }, [uid])

  const statsQuery = useQuery<StatsSummary | null>({
    queryKey: ['stats', 'summary', uid],
    queryFn: async () => {
      if (!uid) return null
      const snap = await getDoc(doc(firestore, `users/${uid}/stats/summary`).withConverter(statsSummaryConverter))
      return snap.exists() ? snap.data() : null
    },
    enabled: Boolean(uid),
    staleTime: 5 * 60 * 1000,
  })

  const [seedIndex, setSeedIndex] = useState<number>(0)

  const seeds = useMemo(() => {
    return [...entries].sort((a, b) => {
      const scoreA = (a.status === 'completed' ? 100 : 0) + (a.rating ? a.rating * 10 : 0)
      const scoreB = (b.status === 'completed' ? 100 : 0) + (b.rating ? b.rating * 10 : 0)
      if (scoreA !== scoreB) return scoreB - scoreA
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return timeB - timeA
    })
  }, [entries])

  useEffect(() => {
    if (seeds.length > 0 && seedIndex >= seeds.length) {
      setSeedIndex(0)
    }
  }, [seeds, seedIndex])

  const activeSeed = seeds[seedIndex]

  const recommendationsQuery = useQuery({
    queryKey: ['tmdb', 'recommendations', activeSeed?.type, activeSeed?.tmdbId],
    queryFn: async () => {
      if (!activeSeed?.type || !activeSeed?.tmdbId) return null
      return tmdbClient.getRecommendations(activeSeed.type, activeSeed.tmdbId)
    },
    enabled: Boolean(activeSeed?.tmdbId),
    staleTime: 15 * 60 * 1000,
  })

  const recommendationItems = useMemo(() => {
    return (recommendationsQuery.data?.results ?? []).slice(0, 15)
  }, [recommendationsQuery.data])

  const trendingQuery = useQuery({
    queryKey: ['tmdb', 'trending', 'week'],
    queryFn: () => tmdbClient.getTrending('all', 'week'),
    staleTime: 30 * 60 * 1000,
  })

  const trendingItems = useMemo(() => (trendingQuery.data?.results ?? []).slice(0, 15), [trendingQuery.data])

  const filteredTrending = useMemo(() => {
    if (!mood || !MOOD_GENRES[mood]) return trendingItems
    const targetIds = MOOD_GENRES[mood]!
    const matches = trendingItems.filter((item) => item.genre_ids?.some((g) => targetIds.includes(g)))
    return matches.length > 0 ? matches : trendingItems
  }, [trendingItems, mood])

  const activeWatching = useMemo(() => {
    const watching = entries.filter((e) => e.status === 'watching')
    if (!watching.length) return null
    return [...watching].sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return timeB - timeA
    })[0]!
  }, [entries])

  const heroDetailsQuery = useQuery({
    queryKey: ['hero-details', activeWatching?.type, activeWatching?.tmdbId],
    queryFn: async () => {
      if (!activeWatching) return null
      return activeWatching.type === 'movie'
        ? tmdbClient.getMovieDetails(activeWatching.tmdbId)
        : tmdbClient.getTvDetails(activeWatching.tmdbId)
    },
    enabled: Boolean(activeWatching),
    staleTime: 10 * 60 * 1000,
  })

  const heroProgress = useMemo(() => {
    if (!activeWatching) return null
    const details = heroDetailsQuery.data
    const rating = details?.vote_average ? details.vote_average.toFixed(1) : (activeWatching.rating ? activeWatching.rating.toFixed(1) : null)
    const backdrop = getBackdropUrl(details?.backdrop_path || activeWatching.backdropPath, 'w1280')
    const poster = getPosterUrl(activeWatching.posterPath, 'w342')

    let progressPercent = 0
    let progressText = ''
    let runtimeString = ''

    if (activeWatching.type === 'movie') {
      const totalMins = (details as { runtime?: number })?.runtime || 120
      const saved = localStorage.getItem(`cinetrack-progress-${activeWatching.titleKey}`)
      progressPercent = saved ? parseInt(saved, 10) : 65
      const watchedMins = Math.round(totalMins * (progressPercent / 100))
      const fmt = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`
      runtimeString = fmt(totalMins)
      progressText = `${fmt(watchedMins)} of ${fmt(totalMins)} · ${progressPercent}%`
    } else {
      const watched = activeWatching.tv?.episodesWatched || 0
      const total = activeWatching.tv?.totalEpisodes || (details as { number_of_episodes?: number })?.number_of_episodes || 10
      progressPercent = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0
      runtimeString = `${total} Episodes`
      progressText = `${watched} of ${total} episodes · ${progressPercent}%`
    }

    return {
      titleKey: activeWatching.titleKey,
      type: activeWatching.type,
      title: activeWatching.title,
      year: activeWatching.year,
      rating,
      backdrop,
      poster,
      progressPercent,
      progressText,
      runtimeString,
    }
  }, [activeWatching, heroDetailsQuery.data])

  const recentlyAdded = useMemo(
    () =>
      [...entries]
        .sort((a, b) => {
          const timeA = a.addedAt ? new Date(a.addedAt).getTime() : 0
          const timeB = b.addedAt ? new Date(b.addedAt).getTime() : 0
          return timeB - timeA
        })
        .slice(0, 10),
    [entries]
  )

  const completedMoviesCount = useMemo(() => entries.filter((e) => e.type === 'movie' && e.status === 'completed').length, [entries])
  const completedTVCount = useMemo(() => entries.filter((e) => e.type === 'tv' && e.status === 'completed').length, [entries])

  const hoursWatched = statsQuery.data ? Math.round((statsQuery.data.minutesWatched ?? 0) / 60) : 0
  const streak = statsQuery.data?.currentStreak ?? 0
  const ratings = entries.filter((e) => typeof e.rating === 'number' && e.rating > 0)
  const avgRating = ratings.length > 0 ? (ratings.reduce((acc, cur) => acc + (cur.rating || 0), 0) / ratings.length).toFixed(1) : '—'

  const recentActivities = useMemo(() => {
    const list: { id: string; type: string; title: string; rating?: number; date: Date; timeAgo: string }[] = []
    entries.forEach((e) => {
      if (typeof e.rating === 'number' && e.updatedAt) {
        const d = e.updatedAt instanceof Date ? e.updatedAt : new Date(e.updatedAt?.seconds ? e.updatedAt.seconds * 1000 : e.updatedAt)
        list.push({ id: `rating-${e.titleKey}`, type: 'rating', title: e.title, rating: e.rating, date: d, timeAgo: getRelativeTime(d) })
      }
      if (e.status === 'completed' && e.updatedAt) {
        const d = e.updatedAt instanceof Date ? e.updatedAt : new Date(e.updatedAt?.seconds ? e.updatedAt.seconds * 1000 : e.updatedAt)
        list.push({ id: `completed-${e.titleKey}`, type: 'completed', title: e.title, date: d, timeAgo: getRelativeTime(d) })
      }
    })
    historyList.forEach((h) => {
      const raw = h.watchedAt
      const d = raw instanceof Date ? raw : new Date(raw?.seconds ? raw.seconds * 1000 : raw)
      list.push({
        id: `history-${h.eventId}`,
        type: 'watched',
        title: h.title + (h.episode ? ` (S${h.season ?? 1}E${h.episode})` : ''),
        date: d,
        timeAgo: getRelativeTime(d),
      })
    })
    const seen = new Set<string>()
    return list
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
      .slice(0, 5)
  }, [entries, historyList])

  const dailyQuote = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
    return MOVIE_QUOTES[dayOfYear % MOVIE_QUOTES.length]!
  }, [])

  return {
    currentYear,
    formattedDate,
    formattedTime,
    watchGoal,
    setWatchGoal,
    mood,
    setMood,
    seedIndex,
    setSeedIndex,
    seeds,
    activeSeed,
    recommendationsQuery,
    recommendationItems,
    filteredTrending,
    heroProgress,
    recentlyAdded,
    completedMoviesCount,
    completedTVCount,
    hoursWatched,
    streak,
    avgRating,
    recentActivities,
    dailyQuote,
  }
}
