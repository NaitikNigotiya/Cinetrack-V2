import { Tv, Film, Star, ChevronRight, Trash2 } from 'lucide-react'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { Button, IconButton } from '@/shared/ui'
import type { HistoryEvent } from '@/shared/schemas'
import styles from './HistoryPage.module.css'

interface HistoryGridViewProps {
  events: HistoryEvent[]
  onTitleClick: (titleKey: string) => void
  onDelete: (event: HistoryEvent) => void
  formatWatchDate: (d: Date | null) => { dayKey: string }
}

export function HistoryGridView({
  events,
  onTitleClick,
  onDelete,
  formatWatchDate,
}: HistoryGridViewProps) {
  return (
    <div className={styles.gridContainer}>
      {events.map((ev) => {
        const poster = getPosterUrl(ev.posterPath, 'w342')
        const isTv = ev.type === 'tv_episode'
        const dateObj =
          ev.watchedAt && typeof ev.watchedAt.toDate === 'function' ? ev.watchedAt.toDate() : null
        const { dayKey } = formatWatchDate(dateObj)

        return (
          <div key={ev.eventId} className={styles.gridCard}>
            <div
              className={styles.gridPosterBox}
              onClick={() => onTitleClick(ev.titleKey)}
              title={`View details for ${ev.title}`}
            >
              {poster ? (
                <img src={poster} alt="" className={styles.gridPosterImg} />
              ) : (
                <div className={styles.posterFallback} style={{ height: '100%' }}>
                  {isTv ? <Tv size={36} /> : <Film size={36} />}
                </div>
              )}

              <div
                className={styles.gridTypeBadge}
                style={{
                  backgroundColor: isTv ? 'rgba(56, 189, 248, 0.9)' : 'rgba(229, 9, 20, 0.9)',
                  color: '#ffffff',
                }}
              >
                {isTv ? 'TV' : 'Movie'}
              </div>

              {typeof ev.rating === 'number' && ev.rating > 0 && (
                <div className={styles.gridRatingOverlay}>
                  <Star size={11} fill="#f59e0b" color="#f59e0b" />
                  {ev.rating.toFixed(1)}
                </div>
              )}
            </div>

            <div className={styles.gridDetails}>
              <div
                className={styles.gridTitle}
                onClick={() => onTitleClick(ev.titleKey)}
                title={ev.title}
              >
                {ev.title}
              </div>

              {ev.episodeLabel && (
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                  {ev.episodeLabel}
                </span>
              )}

              <div className={styles.gridSubtext}>
                <span>{dayKey !== 'unknown' ? dayKey : 'Recent'}</span>
                <span>{ev.runtimeMinutes ? `${ev.runtimeMinutes}m` : ''}</span>
              </div>
            </div>

            <div className={styles.gridCardActions}>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ChevronRight size={14} />}
                onClick={() => onTitleClick(ev.titleKey)}
                style={{ fontSize: '12px', padding: '2px 8px' }}
              >
                Details
              </Button>

              <IconButton
                icon={<Trash2 size={14} />}
                aria-label={`Delete watch record for ${ev.title}`}
                variant="ghost"
                size="sm"
                onClick={() => onDelete(ev)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
