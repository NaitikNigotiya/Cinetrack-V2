import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Check, Trash2 } from 'lucide-react'
import type { PlannedWatch } from '@/shared/schemas'
import styles from './CalendarMonthView.module.css'

function getTodayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

interface CalendarMonthViewProps {
  currentDate: Date
  plannedWatches: PlannedWatch[]
  onToggleDone: (watch: PlannedWatch) => void
  onDelete: (watch: PlannedWatch) => void
}

export function CalendarMonthView({
  currentDate,
  plannedWatches,
  onToggleDone,
  onDelete,
}: CalendarMonthViewProps) {
  const [todayKey] = useState(getTodayKey)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const startDayOfWeek = firstDay.getDay() // 0 = Sun
    const totalDaysInMonth = lastDay.getDate()

    // Days array
    const grid: Array<{ dateKey: string; dayNum: number; isCurrentMonth: boolean }> = []

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i
      const prevM = month === 0 ? 12 : month
      const prevY = month === 0 ? year - 1 : year
      grid.push({
        dateKey: `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      grid.push({
        dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: true,
      })
    }

    // Trailing padding to make multiple of 7
    const remaining = 7 - (grid.length % 7)
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextM = month === 11 ? 1 : month + 2
        const nextY = month === 11 ? year + 1 : year
        grid.push({
          dateKey: `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          dayNum: d,
          isCurrentMonth: false,
        })
      }
    }

    return grid
  }, [year, month])

  // Group planned watches by plannedFor
  const watchesByDate = useMemo(() => {
    const map: Record<string, PlannedWatch[]> = {}
    plannedWatches.forEach((w) => {
      const list = map[w.plannedFor] ?? []
      list.push(w)
      map[w.plannedFor] = list
    })
    return map
  }, [plannedWatches])

  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={styles.monthContainer}>
      <div className={styles.weekHeader}>
        {weekDayHeaders.map((day) => (
          <div key={day} className={styles.weekDayName}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map(({ dateKey, dayNum, isCurrentMonth }) => {
          const items = watchesByDate[dateKey] ?? []
          const isToday = dateKey === todayKey

          return (
            <div
              key={dateKey}
              className={`${styles.cell} ${!isCurrentMonth ? styles.otherMonthCell : ''} ${isToday ? styles.todayCell : ''}`}
            >
              <div className={styles.dayHeader}>
                <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>
                  {dayNum}
                </span>
                {items.length > 0 && (
                  <span className={styles.itemCountBadge}>{items.length}</span>
                )}
              </div>

              <div className={styles.itemsList}>
                {items.map((watch) => (
                  <div
                    key={watch.id || watch.titleKey}
                    className={`${styles.watchBadge} ${watch.done ? styles.watchDone : ''}`}
                    title={watch.title}
                  >
                    <button
                      type="button"
                      className={styles.toggleDoneBtn}
                      onClick={() => onToggleDone(watch)}
                      aria-label={watch.done ? 'Mark undone' : 'Mark done'}
                    >
                      {watch.done ? (
                        <Check size={12} className={styles.checkIcon} />
                      ) : (
                        <span className={styles.circleIcon} />
                      )}
                    </button>
                    <Link
                      to={`/title/${watch.titleKey}`}
                      className={styles.watchTitle}
                    >
                      {watch.plannedTime && (
                        <span className={styles.timeTag}>{watch.plannedTime}</span>
                      )}
                      {watch.title}
                    </Link>
                    <button
                      type="button"
                      className={styles.deleteWatchBtn}
                      onClick={() => onDelete(watch)}
                      aria-label="Remove planned watch"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
