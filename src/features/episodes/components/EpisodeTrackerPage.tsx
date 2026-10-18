import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { onSnapshot } from 'firebase/firestore'
import { Tv, CheckCheck, ChevronLeft } from 'lucide-react'
import { parseTitleKey } from '@/shared/lib/ids'
import { useTitleDetails, useSeason } from '@/services/tmdb/hooks'
import { getSeasonDocRef } from '@/services/firebase/collections'
import { useAuthStore } from '@/features/auth/store/authStore'
import { toggleEpisodeWatched, toggleSeasonWatched, type EpisodeInfo } from '../api/episodesApi'
import { fireCompletionCelebration } from '@/shared/lib/confetti'
import { Button } from '@/shared/ui/Button/Button'
import { Skeleton, ErrorState, toast } from '@/shared/ui'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Section } from '@/shared/ui/layout/Section'
import { Pill } from '@/shared/ui/layout/Pill'
import { EpisodeItemCard } from './EpisodeItemCard'
import type { SeasonDoc } from '@/shared/schemas'

export default function EpisodeTrackerPage() {
  const { titleKey } = useParams<{ titleKey: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid

  const parsed = titleKey ? parseTitleKey(titleKey) : null
  const [activeSeason, setActiveSeason] = useState(1)
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<string, unknown>>({})

  const { data: show, isLoading: showLoading, isError: showError, refetch: refetchShow } = useTitleDetails(titleKey)
  const { data: seasonData, isLoading: seasonLoading } = useSeason(parsed?.tmdbId, activeSeason)

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
      <PageShell>
        <ErrorState
          title="Invalid TV Show"
          message="Episode tracking is only available for TV shows."
          onRetry={() => navigate('/library')}
        />
      </PageShell>
    )
  }

  if (showLoading) {
    return (
      <PageShell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
          <Skeleton width="100%" height={160} style={{ borderRadius: 'var(--radius-card)' }} />
          <Skeleton width="100%" height={80} style={{ borderRadius: 'var(--radius-tile)' }} />
          <Skeleton width="100%" height={400} style={{ borderRadius: 'var(--radius-tile)' }} />
        </div>
      </PageShell>
    )
  }

  if (showError || !show) {
    return (
      <PageShell>
        <ErrorState
          title="Could not load show"
          message="Failed to retrieve show details from TMDB."
          onRetry={() => refetchShow()}
        />
      </PageShell>
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
    if (!uid || !titleKey) return
    const epKey = ep.episodeNumber.toString()
    const currentlyWatched = Boolean(watchedEpisodes[epKey])
    const nextWatched = !currentlyWatched

    setWatchedEpisodes((prev) => {
      const next = { ...prev }
      if (nextWatched) next[epKey] = true
      else delete next[epKey]
      return next
    })

    try {
      await toggleEpisodeWatched(
        uid,
        titleKey,
        activeSeason,
        {
          episodeNumber: ep.episodeNumber,
          title: ep.name || `Episode ${ep.episodeNumber}`,
          runtimeMinutes: ep.runtimeMinutes || show.runtimeMinutes || 45,
          airDate: ep.airDate,
        },
        nextWatched
      )

      if (nextWatched && seasonWatchedCount + 1 === episodes.length) {
        fireCompletionCelebration()
        toast.success(`🎉 Completed Season ${activeSeason}!`)
      }
    } catch {
      setWatchedEpisodes((prev) => {
        const next = { ...prev }
        if (currentlyWatched) next[epKey] = true
        else delete next[epKey]
        return next
      })
      toast.error('Failed to update episode. Reverted.')
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
    } catch {
      toast.error('Failed to update season.')
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="EPISODES"
        title={show.title}
        subtitle={`Season ${activeSeason}: ${seasonWatchedCount} of ${episodes.length} episodes watched (${seasonProgressPercent}%)${totalEpisodes > 0 ? ` · Total show: ${totalEpisodes} episodes` : ''}`}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/title/${titleKey}`)}
            >
              <ChevronLeft size={16} style={{ marginRight: '4px' }} /> Title Details
            </Button>
            {isSeasonFullyWatched ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleToggleSeason(false)}
              >
                <Tv size={15} style={{ marginRight: '6px' }} /> Mark Unwatched
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleToggleSeason(true)}
              >
                <CheckCheck size={15} style={{ marginRight: '6px' }} /> Mark Season Watched
              </Button>
            )}
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--border-subtle)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--brand-primary)',
                width: `${seasonProgressPercent}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }} role="tablist">
            {seasonsList.length > 0 ? (
              seasonsList.map((s) => {
                const isActive = s.seasonNumber === activeSeason
                return (
                  <Pill
                    key={s.seasonNumber}
                    active={isActive}
                    interactive
                    onClick={() => setActiveSeason(s.seasonNumber)}
                  >
                    {s.name || `Season ${s.seasonNumber}`} ({s.episodeCount})
                  </Pill>
                )
              })
            ) : (
              Array.from({ length: totalSeasons }).map((_, i) => {
                const sNum = i + 1
                const isActive = sNum === activeSeason
                return (
                  <Pill
                    key={sNum}
                    active={isActive}
                    interactive
                    onClick={() => setActiveSeason(sNum)}
                  >
                    Season {sNum}
                  </Pill>
                )
              })
            )}
          </div>
        </div>
      </PageHeader>

      <Section title={`Season ${activeSeason} Episodes`}>
        {seasonLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={80} style={{ borderRadius: 'var(--radius-tile)' }} />
            ))}
          </div>
        ) : episodes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap)' }}>
            {episodes.map((ep) => (
              <EpisodeItemCard
                key={ep.episodeNumber}
                episode={ep}
                isWatched={Boolean(watchedEpisodes[ep.episodeNumber.toString()])}
                onToggle={() => handleToggleEpisode(ep)}
              />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>
            No episodes found for this season.
          </p>
        )}
      </Section>
    </PageShell>
  )
}
