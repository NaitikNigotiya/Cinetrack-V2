import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { Check, Clock, Trash2, Calendar as CalendarIcon, Film } from 'lucide-react'
import { IconButton, Badge, EmptyState } from '@/shared/ui'
import type { PlannedWatch } from '@/shared/schemas'
import styles from './CalendarAgendaView.module.css'

interface CalendarAgendaViewProps {
  plannedWatches: PlannedWatch[]
  onToggleDone: (watch: PlannedWatch) => void
  onDelete: (watch: PlannedWatch) => void
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
}

export function CalendarAgendaView({
  plannedWatches,
  onToggleDone,
  onDelete,
}: CalendarAgendaViewProps) {
  const { dateGroups, sortedDates } = useMemo(() => {
    const groups: Record<string, PlannedWatch[]> = {}
    plannedWatches.forEach((w) => {
      const list = groups[w.plannedFor] ?? []
      list.push(w)
      groups[w.plannedFor] = list
    })
    const dates = Object.keys(groups).sort()
    return { dateGroups: groups, sortedDates: dates }
  }, [plannedWatches])

  if (plannedWatches.length === 0) {
    return (
      <EmptyState
        icon={<CalendarIcon size={48} />}
        title="No planned watches"
        description="Schedule movies and shows to watch on specific days from any title detail page."
      />
    )
  }

  return (
    <div className={styles.agendaContainer}>
      {sortedDates.map((dateStr) => {
        const items = dateGroups[dateStr] ?? []

        return (
          <section key={dateStr} className={styles.dateGroup}>
            <h3 className={styles.dateHeader}>{formatDayLabel(dateStr)}</h3>
            <div className={styles.itemsList}>
              {items.map((watch) => (
                <div
                  key={watch.id || watch.titleKey}
                  className={`${styles.agendaRow} ${watch.done ? styles.rowDone : ''}`}
                >
                  <button
                    type="button"
                    className={`${styles.doneBtn} ${watch.done ? styles.doneBtnActive : ''}`}
                    onClick={() => onToggleDone(watch)}
                    aria-label={watch.done ? 'Mark as undone' : 'Mark as done'}
                  >
                    {watch.done && <Check size={16} />}
                  </button>

                  <div className={styles.poster}>
                    {watch.posterPath ? (
                      <img
                        src={getPosterUrl(watch.posterPath, 'w92') ?? ''}
                        alt={watch.title}
                        className={styles.posterImg}
                      />
                    ) : (
                      <div className={styles.posterEmpty}>
                        <Film size={20} />
                      </div>
                    )}
                  </div>

                  <div className={styles.content}>
                    <Link to={`/title/${watch.titleKey}`} className={styles.title}>
                      {watch.title}
                    </Link>
                    <div className={styles.metaRow}>
                      <Badge variant="neutral">{watch.type.toUpperCase()}</Badge>
                      {watch.plannedTime && (
                        <span className={styles.timeLabel}>
                          <Clock size={12} /> {watch.plannedTime}
                        </span>
                      )}
                      {watch.note && <span className={styles.note}>{watch.note}</span>}
                    </div>
                  </div>

                  <IconButton
                    icon={<Trash2 size={16} />}
                    aria-label={`Remove ${watch.title} from planned watches`}
                    onClick={() => onDelete(watch)}
                  />
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
