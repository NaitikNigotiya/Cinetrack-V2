import { ExternalLink, Trash2 } from 'lucide-react'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { IconButton } from '@/shared/ui'
import type { HistoryEvent } from '@/shared/schemas'
import styles from './HistoryPage.module.css'

interface HistoryCompactViewProps {
  events: HistoryEvent[]
  onTitleClick: (titleKey: string) => void
  onDelete: (event: HistoryEvent) => void
  formatWatchDate: (d: Date | null) => { dayKey: string; timeStr: string }
}

export function HistoryCompactView({
  events,
  onTitleClick,
  onDelete,
  formatWatchDate,
}: HistoryCompactViewProps) {
  return (
    <div className={styles.compactTable}>
      {events.map((ev) => {
        const poster = getPosterUrl(ev.posterPath, 'w92')
        const isTv = ev.type === 'tv_episode'
        const dateObj =
          ev.watchedAt && typeof ev.watchedAt.toDate === 'function' ? ev.watchedAt.toDate() : null
        const { dayKey, timeStr } = formatWatchDate(dateObj)

        return (
          <div key={ev.eventId} className={styles.compactRow}>
            <img
              src={poster || ''}
              alt=""
              className={styles.compactThumb}
              onClick={() => onTitleClick(ev.titleKey)}
            />

            <div className={styles.compactTitleBox}>
              <span
                className={styles.compactTitle}
                onClick={() => onTitleClick(ev.titleKey)}
                title={ev.title}
              >
                {ev.title}
              </span>

              {ev.episodeLabel && (
                <span className={styles.episodeBadge} style={{ fontSize: '11px', padding: '1px 5px' }}>
                  {ev.episodeLabel}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: isTv ? '#38bdf8' : '#ff4d4d',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: isTv ? 'rgba(56, 189, 248, 0.1)' : 'rgba(229, 9, 20, 0.1)',
              }}
            >
              {isTv ? 'TV' : 'Movie'}
            </span>

            <span style={{ fontSize: '12px', color: 'var(--text-2)', width: '60px', textAlign: 'right' }}>
              {ev.runtimeMinutes ? `${ev.runtimeMinutes}m` : '–'}
            </span>

            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700, width: '48px', textAlign: 'right' }}>
              {typeof ev.rating === 'number' && ev.rating > 0 ? `★ ${ev.rating}` : '–'}
            </span>

            <span style={{ fontSize: '12px', color: 'var(--text-3)', width: '130px', textAlign: 'right' }}>
              {dayKey} {timeStr ? `• ${timeStr}` : ''}
            </span>

            <div style={{ display: 'flex', gap: '4px' }}>
              <IconButton
                icon={<ExternalLink size={14} />}
                aria-label={`View title details for ${ev.title}`}
                variant="ghost"
                size="sm"
                onClick={() => onTitleClick(ev.titleKey)}
              />
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
