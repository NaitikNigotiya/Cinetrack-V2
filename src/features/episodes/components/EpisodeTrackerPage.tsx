import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { onSnapshot } from 'firebase/firestore'
import { parseTitleKey } from '@/shared/lib/ids'
import { useTitleDetails, useSeason } from '@/services/tmdb/hooks'
import { getStillUrl } from '@/services/tmdb/images'
import { getSeasonDocRef } from '@/services/firebase/collections'
import { useAuthStore } from '@/features/auth/store/authStore'
import { toggleEpisodeWatched, toggleSeasonWatched, type EpisodeInfo } from '../api/episodesApi'
import { fireCompletionCelebration } from '@/shared/lib/confetti'
import { Button, IconButton, Skeleton, ErrorState, toast } from '@/shared/ui'
import { ChevronLeft, Check, Tv, Film, CheckCheck } from 'lucide-react'
import type { SeasonDoc } from '@/shared/schemas'
import clsx from 'clsx'
import styles from './EpisodeTrackerPage.module.css'

export default function EpisodeTrackerPage() {
  const { titleKey } = useParams<{ titleKey: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid

  const parsed = titleKey ? parseTitleKey(titleKey) : null
  const [activeSeason, setActiveSeason] = useState(1)
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<string, unknown>>({})

  // Fetch show details via normalized TMDB hook
  const { data: show, isLoading: showLoading, isError: showError, refetch: refetchShow } = useTitleDetails(titleKey)

  // Fetch real episodes for the active season from TMDB
  const { data: seasonData, isLoading: seasonLoading } = useSeason(
    parsed?.tmdbId,
    activeSeason
  )

  // Listen to Firestore season doc for real-time watched status
  useEffect(() => {
    if (!uid || !titleKey) {
      setWatchedEpisodes({})
      return
    }

    const unsub = onSnapshot(
      getSeasonDocRef(uid, titleKey, activeSeason),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as SeasonDoc
          setWatchedEpisodes(data.watched ?? {})
        } else {
          setWatchedEpisodes({})
        }
      },
      (err) => {
        console.error('Failed to listen to season doc:', err)
      }
    )

    return () => unsub()
  }, [uid, titleKey, activeSeason])

  if (!parsed || parsed.type !== 'tv') {
    return (
      <ErrorState
        title="Invalid TV Show"
        message="Episode tracking is only available for TV shows."
        onRetry={() => navigate('/library')}
      />
    )
  }

  if (showLoading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton width="100%" height={160} style={{ borderRadius: 'var(--radius-xl)' }} />
        <Skeleton width="100%" height={80} />
        <Skeleton width="100%" height={400} />
      </div>
    )
  }

  if (showError || !show) {
    return (
      <ErrorState
        title="Could not load show"
        message="Failed to retrieve show details from TMDB."
        onRetry={() => refetchShow()}
      />
    )
  }

  const seasonsList = show.tv?.seasons?.filter((s) => s.seasonNumber > 0) ?? []
  const totalSeasons = seasonsList.length > 0 ? seasonsList.length : (show.tv?.totalSeasons || 1)
  const totalEpisodes = show.tv?.totalEpisodes || 0

  const episodes = seasonData?.episodes ?? []
  const seasonWatchedCount = episodes.filter((ep) => Boolean(watchedEpisodes[ep.episodeNumber.toString()])).length
  const seasonProgressPercent = episodes.length > 0 ? Math.round((seasonWatchedCount / episodes.length) * 100) : 0
  const isSeasonFullyWatched = episodes.length > 0 && seasonWatchedCount === episodes.length

  const handleToggleEpisode = async (ep: { episodeNumber: number; name: string; runtimeMinutes: number | null; airDate: string | null }) => {
    if (!uid || !titleKey) {
      toast.error('Please sign in to track episodes')
      return
    }

    const epKey = ep.episodeNumber.toString()
    const currentWatched = Boolean(watchedEpisodes[epKey])
    const nextWatched = !currentWatched

    // Optimistic update
    setWatchedEpisodes((prev) => {
      const next = { ...prev }
      if (nextWatched) {
        next[epKey] = true
      } else {
        delete next[epKey]
      }
      return next
    })

    const info: EpisodeInfo = {
      episodeNumber: ep.episodeNumber,
      title: ep.name || `Episode ${ep.episodeNumber}`,
      runtimeMinutes: ep.runtimeMinutes || show.runtimeMinutes || 45,
      airDate: ep.airDate,
    }

    try {
      const { completedShow } = await toggleEpisodeWatched(
        uid,
        titleKey,
        activeSeason,
        info,
        nextWatched
      )

      if (completedShow) {
        fireCompletionCelebration()
        toast.success(`🎉 Congratulations! You've finished ${show.title}!`)
      } else {
        toast.success(nextWatched ? `Marked S${activeSeason}E${ep.episodeNumber} watched` : `Marked unwatched`)
      }
    } catch (err) {
      // Revert optimistic update
      setWatchedEpisodes((prev) => {
        const next = { ...prev }
        if (currentWatched) {
          next[epKey] = true
        } else {
          delete next[epKey]
        }
        return next
      })
      toast.error('Failed to update episode. Reverted.')
      console.error(err)
    }
  }

  const handleToggleSeason = async (watched: boolean) => {
    if (!uid || !titleKey || episodes.length === 0) return

    const mappedEpisodes: EpisodeInfo[] = episodes.map((ep) => ({
      episodeNumber: ep.episodeNumber,
      title: ep.name || `Episode ${ep.episodeNumber}`,
      runtimeMinutes: ep.runtimeMinutes || show.runtimeMinutes || 45,
      airDate: ep.airDate,
    }))

    // Optimistic update
    const nextMap: Record<string, unknown> = {}
    if (watched) {
      episodes.forEach((ep) => {
        nextMap[ep.episodeNumber.toString()] = true
      })
    }
    setWatchedEpisodes(nextMap)

    try {
      await toggleSeasonWatched(uid, titleKey, activeSeason, mappedEpisodes, watched)
      if (watched) {
        toast.success(`Marked Season ${activeSeason} watched (${episodes.length} episodes)`)
      } else {
        toast.success(`Marked Season ${activeSeason} unwatched`)
      }
    } catch (err) {
      toast.error('Failed to update season.')
      console.error(err)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <IconButton
              icon={<ChevronLeft size={20} />}
              aria-label="Back to title details"
              variant="ghost"
              onClick={() => navigate(`/title/${titleKey}`)}
            />
            <div>
              <h1 className={styles.showTitle}>{show.title}</h1>
              <div className={styles.progressStats}>
                Season {activeSeason}: {seasonWatchedCount} of {episodes.length} episodes watched ({seasonProgressPercent}%)
                {totalEpisodes > 0 && ` · Total show: ${totalEpisodes} episodes`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {isSeasonFullyWatched ? (
              <Button
                variant="secondary"
                leftIcon={<Tv size={16} />}
                onClick={() => handleToggleSeason(false)}
              >
                Mark Season Unwatched
              </Button>
            ) : (
              <Button
                variant="primary"
                leftIcon={<CheckCheck size={16} />}
                onClick={() => handleToggleSeason(true)}
              >
                Mark Season {activeSeason} Watched
              </Button>
            )}
          </div>
        </div>

        <div className={styles.progressBarContainer} aria-hidden="true">
          <div className={styles.progressBar} style={{ width: `${seasonProgressPercent}%` }} />
        </div>

        {/* Season Chips */}
        <div className={styles.seasonChips} role="tablist" aria-label="Seasons">
          {seasonsList.length > 0 ? (
            seasonsList.map((s) => {
              const isActive = s.seasonNumber === activeSeason
              return (
                <button
                  key={s.seasonNumber}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={clsx(styles.seasonChip, isActive && styles.seasonChipActive)}
                  onClick={() => setActiveSeason(s.seasonNumber)}
                >
                  {s.name || `Season ${s.seasonNumber}`} ({s.episodeCount})
                </button>
              )
            })
          ) : (
            Array.from({ length: totalSeasons }).map((_, i) => {
              const seasonNum = i + 1
              const isActive = seasonNum === activeSeason
              return (
                <button
                  key={seasonNum}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={clsx(styles.seasonChip, isActive && styles.seasonChipActive)}
                  onClick={() => setActiveSeason(seasonNum)}
                >
                  Season {seasonNum}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Episode List */}
      <div className={styles.episodeList}>
        {seasonLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.episodeCard}>
              <Skeleton width={110} height={62} style={{ borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="20%" height={12} />
              </div>
              <Skeleton width={44} height={44} style={{ borderRadius: '50%', flexShrink: 0 }} />
            </div>
          ))
        ) : episodes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-3)' }}>
            No episode details available for Season {activeSeason}.
          </div>
        ) : (
          episodes.map((ep) => {
            const isWatched = Boolean(watchedEpisodes[ep.episodeNumber.toString()])
            const stillUrl = ep.stillUrl || (ep.stillPath ? getStillUrl(ep.stillPath, 'w300') : null)
            const airDate = ep.airDate
              ? new Date(ep.airDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null

            return (
              <div
                key={ep.episodeNumber}
                className={clsx(styles.episodeCard, isWatched && styles.episodeCardWatched)}
              >
                <div className={styles.stillWrapper}>
                  {stillUrl ? (
                    <img src={stillUrl} alt={ep.name} className={styles.stillImg} loading="lazy" />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--surface-overlay)',
                        color: 'var(--text-3)',
                      }}
                    >
                      <Film size={20} />
                    </div>
                  )}
                </div>

                <div className={styles.episodeInfo}>
                  <div className={styles.episodeTitleRow}>
                    <span style={{ color: 'var(--text-3)', fontWeight: 700 }}>E{String(ep.episodeNumber).padStart(2, '0')}.</span>
                    <span>{ep.name || `Episode ${ep.episodeNumber}`}</span>
                  </div>
                  {ep.overview && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-3)',
                        lineHeight: 1.4,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {ep.overview}
                    </p>
                  )}
                  <div className={styles.episodeMeta}>
                    {ep.runtimeMinutes ? <span>⏱ {ep.runtimeMinutes}m</span> : null}
                    {airDate && <span>📅 {airDate}</span>}
                    {ep.voteAverage && ep.voteAverage > 0 ? (
                      <span style={{ color: 'var(--color-star, #f59e0b)' }}>★ {ep.voteAverage.toFixed(1)}</span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  className={clsx(styles.checkBtn, isWatched && styles.checkBtnWatched)}
                  onClick={() => handleToggleEpisode(ep)}
                  aria-label={`Mark episode ${ep.episodeNumber} as ${isWatched ? 'unwatched' : 'watched'}`}
                >
                  <Check size={20} strokeWidth={3} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
