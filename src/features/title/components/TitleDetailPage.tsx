import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Film } from 'lucide-react'
import { parseTitleKey } from '@/shared/lib/ids'
import { useTitleDetails } from '@/services/tmdb/hooks'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibraryEntry } from '../hooks/useLibraryEntry'
import { TitleHero } from './TitleHero'
import { TitleActionBar } from './TitleActionBar'
import { TitleWatchProviders } from './TitleWatchProviders'
import { TitleTrailerModal } from './TitleTrailerModal'
import { TvSeasonsAccordion } from './TvSeasonsAccordion'
import { CastSection } from './CastSection'
import { PosterCard, Skeleton, EmptyState, Button } from '@/shared/ui'
import styles from './TitleDetailPage.module.css'

type Tab = 'overview' | 'episodes' | 'cast' | 'similar'

function formatTimestamp(val: unknown): string {
  if (!val) return ''
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toLocaleDateString()
  }
  if (typeof val === 'string' || typeof val === 'number') {
    return new Date(val).toLocaleDateString()
  }
  return ''
}

export default function TitleDetailPage() {
  const { titleKey } = useParams<{ titleKey: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)

  const parsed = titleKey ? parseTitleKey(titleKey) : null

  const { data: details, isLoading, isError, refetch } = useTitleDetails(titleKey)
  const { entry } = useLibraryEntry(user?.uid, titleKey)

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'episodes', label: 'Episodes', show: parsed?.type === 'tv' },
    { id: 'cast', label: 'Cast', show: (details?.cast?.length ?? 0) > 0 },
    { id: 'similar', label: 'Similar', show: (details?.recommendations?.length ?? 0) > 0 },
  ]

  if (!parsed) {
    return (
      <EmptyState
        icon={<Film size={40} />}
        title="Invalid Title"
        description="The title identifier in this URL is invalid."
        action={<Button onClick={() => navigate('/search')}>Go to Search</Button>}
      />
    )
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Skeleton width="100%" height={380} style={{ borderRadius: 'var(--radius-2xl)' }} />
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Skeleton width={120} height={180} style={{ borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Skeleton width="70%" height={36} />
            <Skeleton width="40%" height={16} />
            <Skeleton width="50%" height={14} />
          </div>
        </div>
        <Skeleton width="100%" height={60} style={{ borderRadius: 'var(--radius-xl)', marginTop: '1rem' }} />
      </div>
    )
  }

  if (isError || !details) {
    return (
      <EmptyState
        icon={<Film size={40} />}
        title="Could not load title"
        description="Failed to retrieve details from TMDB. Check your connection and try again."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    )
  }

  const runtimeString = (() => {
    if (details.type === 'movie' && details.runtimeMinutes) {
      const h = Math.floor(details.runtimeMinutes / 60)
      const m = details.runtimeMinutes % 60
      return h > 0 ? `${h}h ${m}m` : `${m}m`
    }
    if (details.type === 'tv' && details.tv) {
      const s = details.tv.totalSeasons ?? 0
      return `${s} Season${s !== 1 ? 's' : ''}`
    }
    return undefined
  })()

  const directors = details.crew?.filter((c) => c.job === 'Director') ?? []
  const creators = details.crew?.filter((c) => c.job === 'Creator') ?? []

  return (
    <div className={styles.page}>
      {/* Back Button */}
      <button type="button" className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
        <ArrowLeft size={20} />
      </button>

      {/* Hero Backdrop + Poster + Title */}
      <TitleHero
        title={details.title}
        tagline={details.tagline ?? undefined}
        posterPath={details.posterPath}
        backdropPath={details.backdropPath}
        year={details.year}
        runtimeString={runtimeString}
        genres={details.genres}
        voteAverage={details.voteAverage ?? undefined}
        certification={details.certification ?? undefined}
        type={details.type}
        status={details.status ?? undefined}
        nextAirDate={details.tv?.nextEpisodeToAir?.airDate ?? undefined}
      />

      {/* Action Bar — status, favorite, rating, trailer, etc. */}
      <TitleActionBar details={details} onOpenTrailer={() => setIsTrailerOpen(true)} />

      {/* Tab Bar */}
      <nav className={styles.tabBar} aria-label="Detail sections">
        {tabs.filter((t) => t.show).map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className={styles.tabContent}>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className={styles.tabPane}>
            {/* Overview text */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Storyline</h2>
              <p className={styles.overview}>{details.overview || 'No overview available.'}</p>
            </section>

            {/* Watch Providers */}
            <TitleWatchProviders providers={details.providers} />

            {/* Details grid */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Details</h2>
              <dl className={styles.detailsGrid}>
                {details.status && (
                  <>
                    <dt>Status</dt>
                    <dd>{details.status}</dd>
                  </>
                )}
                {details.originalTitle && details.originalTitle !== details.title && (
                  <>
                    <dt>Original Title</dt>
                    <dd>{details.originalTitle}</dd>
                  </>
                )}
                {details.originalLanguage && (
                  <>
                    <dt>Language</dt>
                    <dd>{details.originalLanguage.toUpperCase()}</dd>
                  </>
                )}
                {details.imdbId && (
                  <>
                    <dt>IMDb</dt>
                    <dd>
                      <a
                        href={`https://www.imdb.com/title/${details.imdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent)' }}
                      >
                        {details.imdbId}
                      </a>
                    </dd>
                  </>
                )}
                {details.type === 'tv' && details.tv && (
                  <>
                    <dt>Network</dt>
                    <dd>{details.tv.networks && details.tv.networks.length > 0 ? details.tv.networks.map((n) => n.name).join(', ') : '—'}</dd>
                    {details.tv.nextEpisodeToAir && (
                      <>
                        <dt>Next Episode</dt>
                        <dd>
                          S{String(details.tv.nextEpisodeToAir.seasonNumber).padStart(2, '0')}
                          E{String(details.tv.nextEpisodeToAir.episodeNumber).padStart(2, '0')}
                          {details.tv.nextEpisodeToAir.airDate ? ` · ${new Date(details.tv.nextEpisodeToAir.airDate).toLocaleDateString()}` : ''}
                        </dd>
                      </>
                    )}
                  </>
                )}
                {directors.length > 0 && (
                  <>
                    <dt>Director</dt>
                    <dd>{directors.map((c) => c.name).join(', ')}</dd>
                  </>
                )}
                {creators.length > 0 && (
                  <>
                    <dt>Created by</dt>
                    <dd>{creators.map((c) => c.name).join(', ')}</dd>
                  </>
                )}
              </dl>
            </section>

            {/* Library entry info */}
            {entry && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Your Library Info</h2>
                <div className={styles.libraryMeta}>
                  {entry.addedAt && <span>Added: {formatTimestamp(entry.addedAt)}</span>}
                  {entry.completedAt && <span>Completed: {formatTimestamp(entry.completedAt)}</span>}
                  {entry.totalMinutesWatched ? <span>Time watched: {Math.round(entry.totalMinutesWatched / 60)}h {entry.totalMinutesWatched % 60}m</span> : null}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Episodes Tab (TV only) */}
        {activeTab === 'episodes' && details.type === 'tv' && details.tv && (
          <div className={styles.tabPane}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4) var(--space-5)',
                marginBottom: 'var(--space-4)',
                backgroundColor: 'var(--surface-raised)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--text-1)' }}>
                  {details.tv.totalSeasons} Season{details.tv.totalSeasons !== 1 ? 's' : ''}
                  {details.tv.totalEpisodes ? ` · ${details.tv.totalEpisodes} Episodes` : ''}
                </div>
                {entry && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-3)', marginTop: '2px' }}>
                    {entry.tv?.episodesWatched ?? 0} of {details.tv.totalEpisodes ?? '?'} episodes watched
                  </div>
                )}
              </div>
              <Button
                variant="primary"
                onClick={() => navigate(`/title/${details.titleKey}/episodes`)}
              >
                Track Episodes
              </Button>
            </div>

            <TvSeasonsAccordion
              tvId={details.tmdbId}
              seasons={details.tv.seasons ?? []}
              totalEpisodes={details.tv.totalEpisodes}
              episodesWatched={entry?.tv?.episodesWatched}
            />
          </div>
        )}

        {/* Cast Tab */}
        {activeTab === 'cast' && (
          <div className={styles.tabPane}>
            <CastSection cast={details.cast} crew={details.crew} />
          </div>
        )}

        {/* Similar Tab */}
        {activeTab === 'similar' && (
          <div className={styles.tabPane}>
            <div className={styles.recGrid}>
              {details.recommendations.map((rec) => (
                <PosterCard
                  key={rec.titleKey}
                  title={rec.title}
                  posterPath={rec.posterPath}
                  year={rec.year}
                  type={rec.type}
                  rating={rec.voteAverage ?? undefined}
                  onClick={() => navigate(`/title/${rec.titleKey}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {details.trailerKey && (
        <TitleTrailerModal
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
          videoKey={details.trailerKey}
          title={details.title}
        />
      )}
    </div>
  )
}
