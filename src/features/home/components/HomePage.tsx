import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore'
import {
  Film,
  Plus,
  Check,
  Play,
  MoreVertical,
  Clock,
  Star,
  Flame,
  Tv,
  Clapperboard,
  PenLine,
  Shuffle,
  Search,
  Sparkles,
} from 'lucide-react'

import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { addToLibrary } from '@/features/library/api/libraryApi'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { getPosterUrl, getBackdropUrl } from '@/shared/lib/tmdbImage'
import { firestore } from '@/services/firebase/db'
import { statsSummaryConverter } from '@/services/firebase/collections'
import { toast } from '@/shared/ui'
import type { HistoryEvent, StatsSummary } from '@/shared/schemas'

import './HomePage.css'

// ─── Daily Quotes ─────────────────────────────────────────────────────────────
const MOVIE_QUOTES = [
  { quote: 'Get busy living, or get busy dying.', film: 'The Shawshank Redemption' },
  { quote: "I'm going to make him an offer he can't refuse.", film: 'The Godfather' },
  { quote: 'Why so serious?', film: 'The Dark Knight' },
  { quote: "You can't handle the truth!", film: 'A Few Good Men' },
  { quote: 'I see dead people.', film: 'The Sixth Sense' },
  { quote: 'To infinity and beyond!', film: 'Toy Story' },
  { quote: 'My precious.', film: 'The Lord of the Rings' },
  { quote: 'Just keep swimming.', film: 'Finding Nemo' },
  { quote: 'You is kind, you is smart, you is important.', film: 'The Help' },
  { quote: 'Life is like a box of chocolates.', film: 'Forrest Gump' },
  { quote: "Here's looking at you, kid.", film: 'Casablanca' },
  { quote: 'May the Force be with you.', film: 'Star Wars' },
  { quote: "I'll be back.", film: 'The Terminator' },
  { quote: "You're a wizard, Harry.", film: 'Harry Potter' },
  { quote: 'We accept the love we think we deserve.', film: 'The Perks of Being a Wallflower' },
  { quote: 'Do not go gentle into that good night.', film: 'Interstellar' },
  { quote: 'Every passing minute is another chance to turn it all around.', film: 'Vanilla Sky' },
  { quote: 'Pain is temporary. Film is forever.', film: 'Unknown' },
  { quote: 'All those moments will be lost in time, like tears in rain.', film: 'Blade Runner' },
  { quote: 'The stuff that dreams are made of.', film: 'The Maltese Falcon' },
]

// ─── Mood Map ─────────────────────────────────────────────────────────────────
const MOODS = [
  { name: 'Happy', emoji: '😊' },
  { name: 'Dark', emoji: '🌑' },
  { name: 'Mind Bend', emoji: '🌀' },
  { name: 'Chill', emoji: '☕' },
  { name: 'Excited', emoji: '🚀' },
]

const MOOD_GENRES: Record<string, number[]> = {
  Happy: [35, 16],
  Dark: [53, 80, 27],
  'Mind Bend': [878, 9648],
  Chill: [18, 10749],
  Excited: [28, 12],
}

function getRelativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime()
  if (diffMs < 0) return 'just now'
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}



export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Explorer'

  const currentYear = new Date().getFullYear()

  const { entries, isLoading: isLibraryLoading } = useLibrary('all')

  const [historyList, setHistoryList] = useState<HistoryEvent[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [_isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640)
  const [watchGoal, setWatchGoal] = useState<number>(() => {
    const saved = localStorage.getItem(`cinetrack-watch-goal-${currentYear}`)
    return saved ? parseInt(saved, 10) : 100
  })
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState(String(watchGoal))
  const [mood, setMood] = useState<string | null>(() => localStorage.getItem('cinetrack-mood'))

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Track viewport width for responsive stats grid
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const formattedDate = useMemo(
    () =>
      currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    [currentTime]
  )

  const formattedTime = useMemo(
    () =>
      currentTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
    [currentTime]
  )

  // Real-time History Sync
  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(firestore, `users/${uid}/history`),
      orderBy('watchedAt', 'desc'),
      limit(20)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const events = snap.docs.map((d) => d.data() as HistoryEvent)
        setHistoryList(events)
      },
      (err) => console.warn('[CineTrack] History sync warn:', err)
    )
    return () => unsub()
  }, [uid])

  // Stats Summary
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

  // Magic Recommendations Seeds Logic
  const [seedIndex, setSeedIndex] = useState<number>(0)

  const seeds = useMemo(() => {
    return [...entries].sort((a, b) => {
      // 1. Completed with high ratings
      const scoreA = (a.status === 'completed' ? 100 : 0) + (a.rating ? a.rating * 10 : 0)
      const scoreB = (b.status === 'completed' ? 100 : 0) + (b.rating ? b.rating * 10 : 0)
      if (scoreA !== scoreB) return scoreB - scoreA

      // 2. Active watching
      const statusScore = (status: string) => {
        if (status === 'watching') return 3
        if (status === 'completed') return 2
        if (status === 'plan_to_watch') return 1
        return 0
      }
      const statusDiff = statusScore(b.status) - statusScore(a.status)
      if (statusDiff !== 0) return statusDiff

      // 3. Recently updated
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

  // TMDb Trending
  const trendingQuery = useQuery({
    queryKey: ['tmdb', 'trending', 'week'],
    queryFn: () => tmdbClient.getTrending('all', 'week'),
    staleTime: 30 * 60 * 1000,
  })

  const trendingItems = useMemo(
    () => (trendingQuery.data?.results ?? []).slice(0, 15),
    [trendingQuery.data]
  )

  const filteredTrending = useMemo(() => {
    if (!mood || !MOOD_GENRES[mood]) return trendingItems
    const targetIds = MOOD_GENRES[mood]!
    const matches = trendingItems.filter((item) =>
      item.genre_ids?.some((g) => targetIds.includes(g))
    )
    return matches.length > 0 ? matches : trendingItems
  }, [trendingItems, mood])

  // Active watching hero
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
      const fmt = (m: number) => {
        const h = Math.floor(m / 60)
        const min = m % 60
        return h > 0 ? `${h}h ${min}m` : `${min}m`
      }
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

  const completedMoviesCount = useMemo(
    () => entries.filter((e) => e.type === 'movie' && e.status === 'completed').length,
    [entries]
  )
  const completedTVCount = useMemo(
    () => entries.filter((e) => e.type === 'tv' && e.status === 'completed').length,
    [entries]
  )

  const quickStats = useMemo(() => {
    const s = statsQuery.data
    const hoursWatched = s ? Math.round((s.minutesWatched ?? 0) / 60) : 0
    const streak = s?.currentStreak ?? 0
    const ratings = entries.filter((e) => typeof e.rating === 'number' && e.rating > 0)
    const avgRating = ratings.length > 0
      ? (ratings.reduce((acc, cur) => acc + (cur.rating || 0), 0) / ratings.length).toFixed(1)
      : '—'

    return [
      { id: 'movies', icon: <Clapperboard size={24} />, val: completedMoviesCount, label: 'Movies' },
      { id: 'tv', icon: <Tv size={24} />, val: completedTVCount, label: 'TV Shows' },
      { id: 'hours', icon: <Clock size={24} />, val: hoursWatched, label: 'Hours Watched' },
      { id: 'streak', icon: <Flame size={24} />, val: streak, label: 'Day Streak' },
      { id: 'rating', icon: <Star size={24} />, val: avgRating, label: 'Avg. Rating' },
    ]
  }, [completedMoviesCount, completedTVCount, statsQuery.data, entries])

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
      if (e.addedAt) {
        const d = e.addedAt instanceof Date ? e.addedAt : new Date(e.addedAt?.seconds ? e.addedAt.seconds * 1000 : e.addedAt)
        list.push({ id: `added-${e.titleKey}`, type: 'added', title: e.title, date: d, timeAgo: getRelativeTime(d) })
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

  const goalPercent = watchGoal > 0 ? Math.min(Math.round((completedMoviesCount / watchGoal) * 100), 100) : 0

  const saveGoal = useCallback(() => {
    const val = parseInt(goalInput, 10)
    if (!isNaN(val) && val > 0) {
      setWatchGoal(val)
      localStorage.setItem(`cinetrack-watch-goal-${currentYear}`, String(val))
    }
    setIsEditingGoal(false)
  }, [goalInput, currentYear])

  const handleMoodSelect = (name: string) => {
    const next = mood === name ? null : name
    setMood(next)
    if (next) localStorage.setItem('cinetrack-mood', next)
    else localStorage.removeItem('cinetrack-mood')
  }

  const handleQuickAdd = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    if (!uid) {
      toast.info('Please sign in to add to your library')
      return
    }
    const type = item.media_type === 'tv' ? 'tv' : 'movie'
    const titleKey = `${type}:${item.id}` // Schema format: "movie:123"
    if (entries.some((w) => w.titleKey === titleKey)) return

    const year = parseInt((item.release_date ?? item.first_air_date)?.slice(0, 4) || '0', 10) || undefined
    const title = item.title ?? item.name ?? 'Untitled'

    try {
      await addToLibrary(uid, {
        titleKey,
        tmdbId: item.id,
        type,
        title,
        year,
        posterPath: item.poster_path ?? undefined,
        backdropPath: item.backdrop_path ?? undefined,
        status: 'plan_to_watch',
      })
      toast.success(`Added "${title}" to Plan to Watch`)
    } catch (err) {
      console.error('[CineTrack] Quick add failed:', err)
      toast.error('Failed to add title')
    }
  }

  const handleRandomPick = () => {
    const ptw = entries.filter((e) => e.status === 'plan_to_watch')
    if (!ptw.length) {
      toast.info('No titles in your "Plan to Watch" list yet!')
      return
    }
    const picked = ptw[Math.floor(Math.random() * ptw.length)]!
    navigate(`/title/${picked.titleKey}`)
  }

  const getActivityIcon = (type: string) =>
    ({ rating: '⭐', completed: '✅', added: '🔖', review: '💬' }[type] ?? '🎬')

  const getActivityText = (item: { type: string; title: string; rating?: number }) => {
    if (item.type === 'rating') return `You rated ${item.title} ⭐ ${item.rating?.toFixed(1)}`
    if (item.type === 'completed') return `You completed ${item.title} ✅`
    if (item.type === 'added') return `You added ${item.title} 🔖`
    if (item.type === 'review') return `You reviewed ${item.title} 💬`
    return `You watched ${item.title}`
  }

  return (
    <div className="hp-wrapper animate-fade-in">
      <div className="hp-grid">
        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="hp-main dashboard-left-col">
          {/* 1. PAGE HEADER */}
          <header className="hp-header mobile-header-padding" style={{ marginBottom: '20px', marginTop: 0 }}>
            <div className="hp-header-left">
              <h1 className="hp-greeting page-title">Welcome back, {firstName} 👋</h1>
              <p className="hp-subtitle page-subtitle">What are we watching today?</p>
            </div>
            <div className="hp-header-right">
              <div className="hp-clock dashboard-clock">
                <span className="hp-clock-date">{formattedDate}</span>
                <span className="hp-clock-sep">·</span>
                <span className="hp-clock-time">{formattedTime}</span>
              </div>
              <button className="hp-more-btn" aria-label="More options" onClick={() => navigate('/settings')}>
                <MoreVertical size={18} />
              </button>
            </div>
          </header>

          {/* 2. CONTINUE WATCHING HERO CARD */}
          <div style={{ marginBottom: '24px' }}>
            <section className="hp-hero-section">
              <p className="hp-section-label" style={{ marginTop: 0, marginBottom: '8px' }}>
                Continue Watching
              </p>
              {heroProgress ? (
                <div
                  className="hp-hero-card"
                  style={{
                    ...(heroProgress.backdrop ? { backgroundImage: `url(${heroProgress.backdrop})` } : {}),
                    marginBottom: '20px',
                    marginTop: 0,
                  }}
                >
                  <div className="hp-hero-overlay" />
                  <div className="hp-hero-inner">
                    {heroProgress.poster && (
                      <img src={heroProgress.poster} alt={heroProgress.title} className="hp-hero-poster desktop-only" />
                    )}
                    <div className="hp-hero-info">
                      <h2 className="hp-hero-title">{heroProgress.title}</h2>
                      <div className="hp-hero-meta">
                        {heroProgress.year && <span>{heroProgress.year}</span>}
                        {heroProgress.year && <span>·</span>}
                        <span>{heroProgress.runtimeString}</span>
                        {heroProgress.rating && (
                          <>
                            <span>·</span>
                            <span>⭐ {heroProgress.rating} TMDb</span>
                          </>
                        )}
                      </div>
                      <div className="hp-hero-progress-wrap">
                        <div className="hp-hero-track">
                          <div className="hp-hero-fill" style={{ width: `${heroProgress.progressPercent}%` }} />
                        </div>
                        <p className="hp-hero-progress-text">{heroProgress.progressText}</p>
                      </div>
                      <div className="hp-hero-actions">
                        <button
                          className="hp-btn-resume"
                          onClick={() =>
                            navigate(
                              heroProgress.type === 'tv'
                                ? `/title/${heroProgress.titleKey}/episodes`
                                : `/title/${heroProgress.titleKey}`
                            )
                          }
                        >
                          <Play size={12} fill="currentColor" /> Resume
                        </button>
                        <button className="hp-btn-details" onClick={() => navigate(`/title/${heroProgress.titleKey}`)}>
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hp-hero-empty">
                  <span className="hp-hero-empty-icon">🍿</span>
                  <h3 className="hp-hero-empty-title">Nothing in progress</h3>
                  <p className="hp-hero-empty-desc">Search for something to watch</p>
                  <button className="hp-btn-search" onClick={() => navigate('/search')}>
                    <Search size={13} /> Search
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* 3. QUICK STATS STRIP */}
          <div style={{ marginBottom: '24px' }}>
            <section className="hp-stats-section" style={{ marginTop: 0, marginBottom: '20px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 640 ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
                  gap: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {quickStats.map((s) => (
                  <div
                    key={s.id}
                    className="hp-stat-card"
                    style={{
                      gridColumn: typeof window !== 'undefined' && s.id === 'rating' && window.innerWidth < 640 ? 'span 2' : 'span 1',
                    }}
                  >
                    <div className="hp-stat-icon">{s.icon}</div>
                    <div className="hp-stat-number">{s.val}</div>
                    <div className="hp-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 4. RECENTLY ADDED CAROUSEL */}
          <div style={{ marginBottom: '24px' }}>
            <section className="hp-rail-section">
              <div className="hp-rail-header" style={{ marginTop: 0, marginBottom: '10px' }}>
                <h2 className="hp-rail-title">Recently Added</h2>
                <Link to="/library" className="hp-rail-view-all">
                  View all →
                </Link>
              </div>
              {isLibraryLoading ? (
                <div className="hp-rail-scroll">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="hp-rail-skeleton" />
                  ))}
                </div>
              ) : recentlyAdded.length > 0 ? (
                <div className="hp-rail-scroll">
                  {recentlyAdded.map((item) => {
                    const poster = getPosterUrl(item.posterPath, 'w185')
                    return (
                      <article
                        key={item.titleKey}
                        className="hp-poster-card"
                        onClick={() => navigate(`/title/${item.titleKey}`)}
                      >
                        <div className="hp-poster-wrap">
                          {poster ? (
                            <img src={poster} alt={item.title} className="hp-poster-img" loading="lazy" />
                          ) : (
                            <div className="hp-poster-fallback">
                              <Film size={20} />
                            </div>
                          )}
                          {item.rating !== null && item.rating !== undefined && (
                            <span className="hp-rating-badge">⭐ {item.rating.toFixed(1)}</span>
                          )}
                        </div>
                        <p className="hp-card-title">{item.title}</p>
                        <p className="hp-card-year">{item.year ?? '—'}</p>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="hp-rail-empty">No titles added to your library yet.</div>
              )}
            </section>
          </div>

          {/* 4b. MAGIC RECOMMENDATIONS CAROUSEL */}
          <div style={{ marginBottom: '24px' }}>
            <section className="hp-rail-section">
              <div className="hp-rail-header" style={{ marginTop: 0, marginBottom: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h2 className="hp-rail-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Sparkles size={16} className="hp-sparkles-icon" style={{ color: 'var(--color-brand)' }} />
                    Magic Recommendations
                  </h2>
                  {activeSeed && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      Based on your interest in{' '}
                      <span style={{ color: 'var(--color-brand)', fontWeight: 600 }}>{activeSeed.title}</span>
                    </p>
                  )}
                </div>
                {seeds.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="hp-seed-select-wrap">
                      <select
                        value={seedIndex}
                        onChange={(e) => setSeedIndex(parseInt(e.target.value, 10))}
                        className="hp-seed-select"
                        aria-label="Recommendation seed title"
                      >
                        {seeds.map((s, idx) => (
                          <option key={s.titleKey} value={idx}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      className="hp-seed-shuffle-btn"
                      onClick={() => setSeedIndex((prev) => (prev + 1) % seeds.length)}
                      title="Shuffle recommendation source"
                      aria-label="Shuffle source"
                    >
                      <Shuffle size={12} />
                    </button>
                  </div>
                )}
              </div>

              {seeds.length === 0 ? (
                <div className="hp-magic-empty-banner">
                  <div className="hp-magic-empty-content">
                    <span className="hp-magic-empty-sparkle">✨</span>
                    <h3 className="hp-magic-empty-title">Unlock Magic Recommendations</h3>
                    <p className="hp-magic-empty-desc">
                      Add titles to your library, rate them, or mark them as completed to get personalized recommendations!
                    </p>
                    <button
                      className="hp-btn-search"
                      style={{ margin: '8px auto 0 auto' }}
                      onClick={() => navigate('/search')}
                    >
                      <Search size={13} /> Find movies & shows
                    </button>
                  </div>
                </div>
              ) : recommendationsQuery.isLoading ? (
                <div className="hp-rail-scroll">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="hp-rail-skeleton" />
                  ))}
                </div>
              ) : recommendationItems.length > 0 ? (
                <div className="hp-rail-scroll">
                  {recommendationItems.map((item) => {
                    const poster = getPosterUrl(item.poster_path, 'w185')
                    const title = item.title ?? item.name ?? 'Untitled'
                    const mediaType = item.media_type || (item.release_date ? 'movie' : 'tv')
                    const titleKey = `${mediaType}:${item.id}` // Schema format: "movie:123"
                    const isAdded = entries.some((w) => w.titleKey === titleKey)
                    const year = (item.release_date ?? item.first_air_date)?.slice(0, 4) ?? ''
                    const rating = item.vote_average ? item.vote_average.toFixed(1) : null

                    return (
                      <article
                        key={item.id}
                        className="hp-poster-card"
                        onClick={() => navigate(`/title/${titleKey}`)}
                      >
                        <div className="hp-poster-wrap">
                          {poster ? (
                            <img src={poster} alt={title} className="hp-poster-img" loading="lazy" />
                          ) : (
                            <div className="hp-poster-fallback">
                              <Film size={20} />
                            </div>
                          )}
                          {rating && <span className="hp-rating-badge">⭐ {rating}</span>}
                          <button
                            className={`hp-add-badge ${isAdded ? 'hp-add-badge--added' : ''}`}
                            onClick={(e) => handleQuickAdd(e, item)}
                            disabled={isAdded}
                            aria-label={isAdded ? 'Already in library' : 'Add to watchlist'}
                          >
                            {isAdded ? <Check size={10} /> : <Plus size={10} />}
                          </button>
                        </div>
                        <p className="hp-card-title">{title}</p>
                        <p className="hp-card-year">{year}</p>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="hp-rail-empty">
                  No recommendations found for this title. Try selecting a different title!
                </div>
              )}
            </section>
          </div>

          {/* 5. YOU MIGHT LIKE CAROUSEL */}
          <div style={{ marginBottom: '24px' }}>
            <section className="hp-rail-section">
              <div className="hp-rail-header" style={{ marginTop: 0, marginBottom: '10px' }}>
                <h2 className="hp-rail-title">
                  You Might Like
                  {mood && <span className="hp-mood-pill">· {mood}</span>}
                </h2>
              </div>
              {filteredTrending.length > 0 ? (
                <div className="hp-rail-scroll">
                  {filteredTrending.map((item) => {
                    const poster = getPosterUrl(item.poster_path, 'w185')
                    const title = item.title ?? item.name ?? 'Untitled'
                    const mediaType = item.media_type || (item.release_date ? 'movie' : 'tv')
                    const titleKey = `${mediaType}:${item.id}` // Schema format: "movie:123"
                    const isAdded = entries.some((w) => w.titleKey === titleKey)
                    const year = (item.release_date ?? item.first_air_date)?.slice(0, 4) ?? ''
                    const rating = item.vote_average ? item.vote_average.toFixed(1) : null

                    return (
                      <article
                        key={item.id}
                        className="hp-poster-card"
                        onClick={() => navigate(`/title/${titleKey}`)}
                      >
                        <div className="hp-poster-wrap">
                          {poster ? (
                            <img src={poster} alt={title} className="hp-poster-img" loading="lazy" />
                          ) : (
                            <div className="hp-poster-fallback">
                              <Film size={20} />
                            </div>
                          )}
                          {rating && <span className="hp-rating-badge">⭐ {rating}</span>}
                          <button
                            className={`hp-add-badge ${isAdded ? 'hp-add-badge--added' : ''}`}
                            onClick={(e) => handleQuickAdd(e, item)}
                            disabled={isAdded}
                            aria-label={isAdded ? 'Already in library' : 'Add to watchlist'}
                          >
                            {isAdded ? <Check size={10} /> : <Plus size={10} />}
                          </button>
                        </div>
                        <p className="hp-card-title">{title}</p>
                        <p className="hp-card-year">{year}</p>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="hp-rail-empty">Loading suggestions…</div>
              )}
            </section>
          </div>
        </div>

        {/* ── RIGHT COLUMN (WIDGETS) ─────────────────────────────────────────── */}
        <aside className="dashboard-right">
          {/* WIDGET 1 — WATCH GOAL */}
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Watch Goal {currentYear}
              </span>
              <button
                onClick={() => {
                  setIsEditingGoal(true)
                  setGoalInput(String(watchGoal))
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-brand)',
                }}
              >
                Edit Goal
              </button>
            </div>

            {/* SVG Ring */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                {/* Track */}
                <circle cx="70" cy="70" r="54" fill="none" stroke="var(--border-default)" strokeWidth="10" />
                {/* Progress arc */}
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke="var(--color-brand)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - goalPercent / 100)}`}
                  transform="rotate(-90 70 70)"
                  style={{ transition: 'stroke-dashoffset 800ms ease' }}
                />
                {/* Center text */}
                <text
                  x="70"
                  y="70"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    fill: 'var(--text-primary)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {goalPercent}%
                </text>
              </svg>
            </div>

            {/* Stats */}
            {isEditingGoal ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  autoFocus
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                  min="1"
                  max="999"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-focus)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                  placeholder="Set your goal..."
                />
                <button
                  onClick={saveGoal}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--color-brand)',
                    color: 'var(--text-on-brand)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingGoal(false)}
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {watchGoal} Movies
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Goal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-brand)' }}>
                    {completedMoviesCount} Movies
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Watched</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {watchGoal - completedMoviesCount > 0
                    ? `${watchGoal - completedMoviesCount} to go!`
                    : '🎉 Goal achieved!'}
                </div>

                {/* Progress bar below stats */}
                <div
                  style={{
                    marginTop: '8px',
                    height: '4px',
                    background: 'var(--skeleton-base)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: 'var(--color-brand)',
                      borderRadius: '999px',
                      width: `${goalPercent}%`,
                      transition: 'width 800ms ease',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* WIDGET 2 — MOOD FOR TODAY */}
          <section className="hp-widget" style={{ marginBottom: '16px' }}>
            <div className="hp-widget-header">
              <h3 className="hp-widget-title">Mood for today?</h3>
            </div>
            <div className="hp-mood-row">
              {MOODS.map((m) => (
                <button
                  key={m.name}
                  className={`hp-mood-btn ${mood === m.name ? 'hp-mood-btn--active' : ''}`}
                  onClick={() => handleMoodSelect(m.name)}
                >
                  <span className="hp-mood-emoji">{m.emoji}</span>
                  <span className="hp-mood-label">{m.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* WIDGET 3 — RECENT ACTIVITY */}
          <section className="hp-widget" style={{ marginBottom: '16px' }}>
            <div className="hp-widget-header">
              <h3 className="hp-widget-title">Recent Activity</h3>
            </div>
            {recentActivities.length > 0 ? (
              <ul className="hp-activity-list">
                {recentActivities.map((act, idx) => (
                  <li
                    key={act.id}
                    className={`hp-activity-item ${idx === recentActivities.length - 1 ? 'hp-activity-item--last' : ''}`}
                  >
                    <span className="hp-activity-icon">{getActivityIcon(act.type)}</span>
                    <div className="hp-activity-body">
                      <p className="hp-activity-text">{getActivityText(act)}</p>
                    </div>
                    <span className="hp-activity-time">{act.timeAgo}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hp-activity-empty">No activity yet. Start watching!</p>
            )}
          </section>

          {/* WIDGET 4 — QUICK ACTIONS */}
          <section className="hp-widget" style={{ marginBottom: '16px' }}>
            <div className="hp-widget-header">
              <h3 className="hp-widget-title">Quick Actions</h3>
            </div>
            <div className="hp-actions-grid">
              <button className="hp-action-btn" onClick={() => navigate('/search')}>
                <Film size={14} className="hp-action-icon" />
                + Add Movie
              </button>
              <button className="hp-action-btn" onClick={() => navigate('/search')}>
                <Tv size={14} className="hp-action-icon" />
                Add Show
              </button>
              <button className="hp-action-btn" onClick={() => navigate('/reviews')}>
                <PenLine size={14} className="hp-action-icon" />
                Write Review
              </button>
              <button className="hp-action-btn" onClick={handleRandomPick}>
                <Shuffle size={14} className="hp-action-icon" />
                Random Pick
              </button>
            </div>
          </section>

          {/* WIDGET 5 — DAILY QUOTE */}
          <section className="hp-widget">
            <div className="hp-widget-header">
              <h3 className="hp-widget-title">Daily Quote</h3>
            </div>
            <blockquote className="hp-quote">
              <p className="hp-quote-text">"{dailyQuote.quote}"</p>
              <cite className="hp-quote-film">— {dailyQuote.film}</cite>
            </blockquote>
          </section>
        </aside>
      </div>
    </div>
  )
}
