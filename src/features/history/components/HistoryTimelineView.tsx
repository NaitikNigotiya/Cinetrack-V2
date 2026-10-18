import { Tv, Film, Clock, Star, ExternalLink, Trash2 } from 'lucide-react'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { IconButton } from '@/shared/ui'
import type { HistoryEvent } from '@/shared/schemas'
import styles from './HistoryPage.module.css'

export interface TimelineGroup {
  dayKey: string
  fullDate: string
  isToday: boolean
  isYesterday: boolean
  totalMinutes: number
  events: HistoryEvent[]
}

interface HistoryTimelineViewProps {
  timelineGroups: TimelineGroup[]
  onTitleClick: (titleKey: string) => void
  onDelete: (event: HistoryEvent) => void
  onOpenEpisodes: (titleKey: string) => void
  formatWatchDate: (d: Date | null) => { timeStr: string }
  formatMinutes: (mins: number) => string
}

export function HistoryTimelineView({
  timelineGroups,
  onTitleClick,
  onDelete,
  onOpenEpisodes,
  formatWatchDate,
  formatMinutes,
}: HistoryTimelineViewProps) {
  return (
    <div className={styles.timelineWrapper}>
      {timelineGroups.map((group) => (
        <div key={group.dayKey} className={styles.daySection}>
          <div className={styles.dayHeader}>
            <div className={styles.dayHeaderNode} />
            <div className={styles.dayTitleRow}>
              <span className={styles.dayLabel}>{group.fullDate}</span>
              {group.isToday && <span className={styles.dayBadge}>Today</span>}
              {group.isYesterday && <span className={styles.dayBadge}>Yesterday</span>}
            </div>
            <span className={styles.daySummary}>
              {group.events.length} {group.events.length === 1 ? 'item' : 'items'} •{' '}
              {formatMinutes(group.totalMinutes)}
            </span>
          </div>

          <div className={styles.timelineItemsList}>
            {group.events.map((ev) => {
              const poster = getPosterUrl(ev.posterPath, 'w154')
              const isTv = ev.type === 'tv_episode'
              const dateObj =
                ev.watchedAt && typeof ev.watchedAt.toDate === 'function'
                  ? ev.watchedAt.toDate()
                  : null
              const { timeStr } = formatWatchDate(dateObj)

              return (
                <div key={ev.eventId} className={styles.timelineCard}>
                  <div
                    className={styles.cardPoster}
                    onClick={() => onTitleClick(ev.titleKey)}
                    title={`View details for ${ev.title}`}
                  >
                    {poster ? (
                      <img src={poster} alt="" className={styles.posterImage} />
                    ) : (
                      <div className={styles.posterFallback}>
                        {isTv ? <Tv size={20} /> : <Film size={20} />}
                      </div>
                    )}
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.cardHeaderLine}>
                      <span className={isTv ? styles.typeBadgeTv : styles.typeBadgeMovie}>
                        {isTv ? <Tv size={11} /> : <Film size={11} />}
                        {isTv ? 'Episode' : 'Movie'}
                      </span>

                      {ev.episodeLabel && (
                        <span className={styles.episodeBadge}>{ev.episodeLabel}</span>
                      )}

                      {timeStr && (
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', marginLeft: 'auto' }}>
                          {timeStr}
                        </span>
                      )}
                    </div>

                    <div
                      className={styles.cardTitle}
                      onClick={() => onTitleClick(ev.titleKey)}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>

                    <div className={styles.cardMetaRow}>
                      <span className={styles.metaItem}>
                        <Clock size={12} />
                        {ev.runtimeMinutes ? `${ev.runtimeMinutes}m` : '–'}
                      </span>

                      {typeof ev.rating === 'number' && ev.rating > 0 && (
                        <span className={styles.ratingBadge}>
                          <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          {ev.rating.toFixed(1)}
                        </span>
                      )}

                      {ev.source && ev.source !== 'manual' && (
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                          via {ev.source}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    {isTv && (
                      <IconButton
                        icon={<Tv size={15} />}
                        aria-label={`Open episode tracker for ${ev.title}`}
                        variant="ghost"
                        size="sm"
                        title="Episode Tracker"
                        onClick={() => onOpenEpisodes(ev.titleKey)}
                      />
                    )}

                    <IconButton
                      icon={<ExternalLink size={15} />}
                      aria-label={`View title details for ${ev.title}`}
                      variant="ghost"
                      size="sm"
                      title="View Details"
                      onClick={() => onTitleClick(ev.titleKey)}
                    />

                    <IconButton
                      icon={<Trash2 size={15} />}
                      aria-label={`Delete watch record for ${ev.title}`}
                      variant="ghost"
                      size="sm"
                      title="Delete Watch Event"
                      onClick={() => onDelete(ev)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
