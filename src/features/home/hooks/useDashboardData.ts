import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { getPosterUrl, getBackdropUrl } from '@/shared/lib/tmdbImage'
import {
  selectDashboardStats,
  selectRecentlyAdded,
  selectContinueWatching,
  formatRelativeTime,
  toDomainDate,
} from '@/domain'
import type { DomainLibraryEntry, DomainHistoryEvent } from '@/domain'

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

export function useDashboardData(
  _uid: string | undefined,
  entries: DomainLibraryEntry[],
  historyList: DomainHistoryEvent[]
) {
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

  // Pure derived stats per ADR-007
  const stats = useMemo(
    () => selectDashboardStats(entries, historyList, watchGoal),
    [entries, historyList, watchGoal]
  )

  const [seedIndex, setSeedIndex] = useState<number>(0)

  const seeds = useMemo(() => {
    return [...entries].sort((a, b) => {
      const scoreA = (a.status === 'completed' ? 100 : 0) + (a.rating ? a.rating * 10 : 0)
      const scoreB = (b.status === 'completed' ? 100 : 0) + (b.rating ? b.rating * 10 : 0)
      if (scoreA !== scoreB) return scoreB - scoreA
      const timeA = toDomainDate(a.updatedAt)?.getTime() || 0
      const timeB = toDomainDate(b.updatedAt)?.getTime() || 0
      return timeB - timeA
    })
  }, [entries])

  useEffect(() => {
    if (seeds.length > 0 && seedIndex >= seeds.length) {
      setSeedIndex(0)
    }
  }, [seeds.length, seedIndex])

  const activeSeed = seeds[seedIndex]

  const recommendationsQuery = useQuery({
    queryKey: ['tmdb', 'recommendations', activeSeed?.type, activeSeed?.tmdbId],
    queryFn: () => {
      if (!activeSeed) return Promise.resolve({ page: 1, total_pages: 1, total_results: 0, results: [] })
      return tmdbClient.getRecommendations(activeSeed.type, activeSeed.tmdbId)
    },
    enabled: Boolean(activeSeed),
    staleTime: 10 * 60 * 1000,
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

  // Continue watching from domain selector
  const continueWatchingList = useMemo(() => selectContinueWatching(entries), [entries])
  const activeWatching = continueWatchingList[0] || null

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
    const rating = details?.vote_average
      ? details.vote_average.toFixed(1)
      : activeWatching.rating
        ? activeWatching.rating.toFixed(1)
        : null
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
      const total =
        activeWatching.tv?.totalEpisodes ||
        (details as { number_of_episodes?: number })?.number_of_episodes ||
        10
      progressPercent = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0
      runtimeString = `${total} Episodes`
      progressText = `${watched} of ${total} episodes · ${progressPercent}%`
    }

    return {
      titleKey: activeWatching.titleKey,
      type: activeWatching.type,
      title: activeWatching.title,
      year: activeWatching.year ?? null,
      rating,
      backdrop,
      poster,
      progressPercent,
      progressText,
      runtimeString,
    }
  }, [activeWatching, heroDetailsQuery.data])

  // Recently added from domain selector (shows all statuses with status badge)
  const recentlyAdded = useMemo(() => selectRecentlyAdded(entries, 10), [entries])

  // Recent activity stream
  const recentActivities = useMemo(() => {
    const list: { id: string; type: string; title: string; rating?: number; date: Date; timeAgo: string }[] = []

    historyList.forEach((h) => {
      const d = toDomainDate(h.watchedAt) || new Date()
      list.push({
        id: `history-${h.eventId}`,
        type: 'watched',
        title: h.title + (h.episode ? ` (S${h.season ?? 1}E${h.episode})` : ''),
        date: d,
        timeAgo: formatRelativeTime(d),
      })
    })

    entries.forEach((e) => {
      if (typeof e.rating === 'number' && e.updatedAt) {
        const d = toDomainDate(e.updatedAt) || new Date()
        list.push({
          id: `rating-${e.titleKey}`,
          type: 'rating',
          title: e.title,
          rating: e.rating,
          date: d,
          timeAgo: formatRelativeTime(d),
        })
      }
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
    completedMoviesCount: stats.moviesWatched,
    completedTVCount: stats.tvShows,
    hoursWatched: stats.hoursWatched,
    streak: stats.currentStreak,
    avgRating: stats.avgRating,
    recentActivities,
    dailyQuote,
  }
}
