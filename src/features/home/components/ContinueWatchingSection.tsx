import { Link, useNavigate } from 'react-router-dom'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { Button, Skeleton } from '@/shared/ui'
import { Play, Tv } from 'lucide-react'
import type { LibraryEntry } from '@/shared/schemas'
import styles from './ContinueWatchingSection.module.css'

interface ContinueWatchingSectionProps {
  entries: LibraryEntry[]
  isLoading?: boolean
}

export function ContinueWatchingSection({ entries, isLoading }: ContinueWatchingSectionProps) {
  const navigate = useNavigate()

  // Filter shows that are in progress
  const watchingShows = entries.filter(
    (e) => e.type === 'tv' && e.status === 'watching'
  )

  if (isLoading) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Continue Watching</h2>
        <div className={styles.grid}>
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      </section>
    )
  }

  if (watchingShows.length === 0) {
    return null // Omit section if no active shows in progress
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Continue Watching</h2>
        <Link to="/library?status=watching" className={styles.viewAll}>
          View all
        </Link>
      </div>

      <div className={styles.grid}>
        {watchingShows.map((show) => {
          const nextEpObj = show.tv?.nextEpisodeToWatch
          const nextEpLabel = nextEpObj
            ? `S${String(nextEpObj.season).padStart(2, '0')}E${String(nextEpObj.episode).padStart(2, '0')}`
            : 'Next'
          const watched = show.tv?.episodesWatched || 0
          const total = show.tv?.totalEpisodes || 1
          const pct = Math.min(100, Math.round((watched / Math.max(1, total)) * 100))

          return (
            <div key={show.titleKey} className={styles.card}>
              <div className={styles.poster}>
                {show.posterPath ? (
                  <img
                    src={getPosterUrl(show.posterPath, 'w185') ?? ''}
                    alt={show.title}
                    className={styles.posterImg}
                  />
                ) : (
                  <div className={styles.posterEmpty}>
                    <Tv size={24} />
                  </div>
                )}
              </div>

              <div className={styles.info}>
                <div className={styles.titleArea}>
                  <Link to={`/title/${show.titleKey}`} className={styles.titleLink}>
                    <h3 className={styles.title}>{show.title}</h3>
                  </Link>
                  <span className={styles.nextEpTag}>{nextEpLabel}</span>
                </div>

                <div className={styles.progressArea}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.progressText}>
                    {watched} of {total} eps ({pct}%)
                  </span>
                </div>

                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    size="sm"
                    startIcon={<Play size={14} />}
                    onClick={() => navigate(`/title/${show.titleKey}/episodes`)}
                  >
                    Track Episodes
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
