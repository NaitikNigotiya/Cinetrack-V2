import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { parseTitleKey } from '@/shared/lib/ids'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { tmdbKeys } from '@/services/tmdb/queryKeys'
import { useAuthStore } from '@/features/auth/store/authStore'
import { toggleEpisodeWatched, toggleSeasonWatched, type EpisodeInfo } from '../api/episodesApi'
import { fireCompletionCelebration } from '@/shared/lib/confetti'
import { Button, IconButton, Skeleton, ErrorState, toast } from '@/shared/ui'
import { ChevronLeft, Check, Tv } from 'lucide-react'
import clsx from 'clsx'
import styles from './EpisodeTrackerPage.module.css'

export default function EpisodeTrackerPage() {
  const { titleKey } = useParams<{ titleKey: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid

  const parsed = titleKey ? parseTitleKey(titleKey) : null
  const [activeSeason, setActiveSeason] = useState(1)
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<number, boolean>>({})

  // Fetch show details
  const showQuery = useQuery({
    queryKey: parsed ? tmdbKeys.tvDetails(parsed.tmdbId) : ['empty'],
    queryFn: () => {
      if (!parsed) throw new Error('Invalid title key')
      return tmdbClient.getTvDetails(parsed.tmdbId)
    },
    enabled: Boolean(parsed),
  })

  if (!parsed || parsed.type !== 'tv') {
    return (
      <ErrorState
        title="Invalid TV Show"
        message="Episode tracking is only available for TV shows."
        onRetry={() => navigate('/library')}
      />
    )
  }

  if (showQuery.isLoading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton width="100%" height={160} style={{ borderRadius: 'var(--radius-xl)' }} />
        <Skeleton width="100%" height={80} />
      </div>
    )
  }

  const show = showQuery.data
  if (!show) {
    return (
      <ErrorState
        title="Could not load show"
        message="Failed to retrieve show details."
        onRetry={() => showQuery.refetch()}
      />
    )
  }

  const totalSeasons = show.number_of_seasons || 1
  const totalEpisodes = show.number_of_episodes || 0
  const watchedCount = Object.values(watchedEpisodes).filter(Boolean).length
  const progressPercent = totalEpisodes > 0 ? Math.round((watchedCount / totalEpisodes) * 100) : 0

  // Mock season episodes if TMDB season endpoint isn't cached
  const seasonEpisodes: EpisodeInfo[] = Array.from({ length: 10 }).map((_, i) => ({
    episodeNumber: i + 1,
    title: `Episode ${i + 1}`,
    runtimeMinutes: 45,
    airDate: '2026-01-01',
  }))

  const handleToggleEpisode = async (ep: EpisodeInfo) => {
    if (!uid || !titleKey) {
      toast.error('Please sign in to track episodes')
      return
    }

    const currentWatched = Boolean(watchedEpisodes[ep.episodeNumber])
    const nextWatched = !currentWatched

    // Optimistic update
    setWatchedEpisodes((prev) => ({ ...prev, [ep.episodeNumber]: nextWatched }))

    try {
      const { completedShow } = await toggleEpisodeWatched(
        uid,
        titleKey,
        activeSeason,
        ep,
        nextWatched
      )

      if (completedShow) {
        fireCompletionCelebration()
        toast.success(`Congratulations! You've finished ${show.name}!`)
      } else {
        toast.success(nextWatched ? `Marked S${activeSeason}E${ep.episodeNumber} watched` : `Marked unwatched`)
      }
    } catch {
      // Revert optimistic update
      setWatchedEpisodes((prev) => ({ ...prev, [ep.episodeNumber]: currentWatched }))
      toast.error('Failed to update episode. Reverted.')
    }
  }

  const handleToggleSeason = async (watched: boolean) => {
    if (!uid || !titleKey) return
    const nextMap: Record<number, boolean> = {}
    seasonEpisodes.forEach((ep) => {
      nextMap[ep.episodeNumber] = watched
    })
    setWatchedEpisodes(nextMap)

    try {
      await toggleSeasonWatched(uid, titleKey, activeSeason, seasonEpisodes, watched)
      toast.success(watched ? `Marked Season ${activeSeason} watched` : `Marked Season ${activeSeason} unwatched`)
    } catch {
      toast.error('Failed to update season.')
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
              <h1 className={styles.showTitle}>{show.name}</h1>
              <div className={styles.progressStats}>
                {watchedCount} of {totalEpisodes} episodes watched ({progressPercent}%)
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            leftIcon={<Tv size={16} />}
            onClick={() => handleToggleSeason(true)}
          >
            Mark Season {activeSeason} Watched
          </Button>
        </div>

        <div className={styles.progressBarContainer} aria-hidden="true">
          <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Season Chips */}
        <div className={styles.seasonChips} role="tablist" aria-label="Seasons">
          {Array.from({ length: totalSeasons }).map((_, i) => {
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
          })}
        </div>
      </div>

      {/* Episode List */}
      <div className={styles.episodeList}>
        {seasonEpisodes.map((ep) => {
          const isWatched = Boolean(watchedEpisodes[ep.episodeNumber])

          return (
            <div
              key={ep.episodeNumber}
              className={clsx(styles.episodeCard, isWatched && styles.episodeCardWatched)}
            >
              <div className={styles.stillWrapper}>
                <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--surface-overlay)' }} />
              </div>

              <div className={styles.episodeInfo}>
                <div className={styles.episodeTitleRow}>
                  <span>{ep.episodeNumber}.</span>
                  <span>{ep.title}</span>
                </div>
                <div className={styles.episodeMeta}>
                  <span>{ep.runtimeMinutes}m</span>
                  <span>{ep.airDate}</span>
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
        })}
      </div>
    </div>
  )
}
