import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPlannedWatches } from '@/features/calendar/api/calendarApi'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { Calendar, Clock, Film } from 'lucide-react'
import { Skeleton } from '@/shared/ui'
import styles from './ComingUpSection.module.css'

function getNext7DaysRange(): { today: string; endStr: string } {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const sevenDaysLater = new Date(now.getTime() + 7 * 86400000)
  const endStr = `${sevenDaysLater.getFullYear()}-${String(sevenDaysLater.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysLater.getDate()).padStart(2, '0')}`
  return { today, endStr }
}

interface ComingUpSectionProps {
  uid: string
}

export function ComingUpSection({ uid }: ComingUpSectionProps) {
  const [range] = useState(getNext7DaysRange)

  const plannedQuery = useQuery({
    queryKey: ['plannedWatches', uid],
    queryFn: () => fetchPlannedWatches(uid),
    enabled: Boolean(uid),
  })

  const upcoming7Days = useMemo(() => {
    const raw = plannedQuery.data
    if (!raw) return []
    return raw.filter(
      (w) => !w.done && w.plannedFor >= range.today && w.plannedFor <= range.endStr
    )
  }, [plannedQuery.data, range])

  if (plannedQuery.isLoading) {
    return (
      <section className={styles.section}>
        <Skeleton height={100} />
      </section>
    )
  }

  if (upcoming7Days.length === 0) {
    return null
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <Calendar size={18} className={styles.calIcon} />
          <h2 className={styles.title}>Coming Up (Next 7 Days)</h2>
        </div>
        <Link to="/calendar" className={styles.viewCalendar}>
          View calendar
        </Link>
      </div>

      <div className={styles.list}>
        {upcoming7Days.map((watch) => (
          <div key={watch.id || watch.titleKey} className={styles.item}>
            <div className={styles.poster}>
              {watch.posterPath ? (
                <img
                  src={getPosterUrl(watch.posterPath, 'w92') ?? ''}
                  alt={watch.title}
                  className={styles.posterImg}
                />
              ) : (
                <div className={styles.posterEmpty}>
                  <Film size={16} />
                </div>
              )}
            </div>

            <div className={styles.details}>
              <Link to={`/title/${watch.titleKey}`} className={styles.itemTitle}>
                {watch.title}
              </Link>
              <div className={styles.meta}>
                <span className={styles.dateLabel}>{watch.plannedFor}</span>
                {watch.plannedTime && (
                  <span className={styles.timeLabel}>
                    <Clock size={12} /> {watch.plannedTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
