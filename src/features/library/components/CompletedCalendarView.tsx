import { ChevronLeft, ChevronRight, Film } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import type { LibraryEntry } from '@/shared/schemas'

interface CompletedCalendarViewProps {
  calendarDate: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  selectedCalendarDay: number | null
  onSelectDay: (day: number | null) => void
  dayActivities: Record<number, LibraryEntry[]>
}

export function CompletedCalendarView({
  calendarDate,
  onPrevMonth,
  onNextMonth,
  selectedCalendarDay,
  onSelectDay,
  dayActivities,
}: CompletedCalendarViewProps) {
  const navigate = useNavigate()

  const calMonthName = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDay = new Date(year, month, 1).getDay()

  return (
    <div className="calendar-pane">
      <div className="full-cal-header">
        <button className="full-cal-nav-btn" onClick={onPrevMonth} type="button">
          <ChevronLeft size={16} />
        </button>
        <h3 className="full-cal-title">{calMonthName}</h3>
        <button className="full-cal-nav-btn" onClick={onNextMonth} type="button">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="full-cal-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="full-cal-day-header">
            {d}
          </div>
        ))}

        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="full-cal-cell" style={{ opacity: 0.2 }} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1
          const acts = dayActivities[dayNum] || []
          const isSelected = selectedCalendarDay === dayNum

          return (
            <div
              key={dayNum}
              className={`full-cal-cell ${acts.length > 0 ? 'full-cal-cell--activity' : ''} ${
                isSelected ? 'full-cal-cell--selected' : ''
              }`}
              onClick={() => onSelectDay(isSelected ? null : dayNum)}
            >
              <span className="full-cal-cell-num">{dayNum}</span>
              {acts.length > 0 && (
                <div className="full-cal-activity-indicator">
                  <span className="full-cal-count-badge">{acts.length}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedCalendarDay !== null && (
        <div className="selected-day-details-panel">
          <h4 className="selected-day-title">
            Finished on {calendarDate.toLocaleString('default', { month: 'short' })} {selectedCalendarDay}
          </h4>
          <div className="selected-day-list">
            {(dayActivities[selectedCalendarDay] || []).length === 0 ? (
              <p className="selected-day-empty">No completions recorded on this day.</p>
            ) : (
              dayActivities[selectedCalendarDay]?.map((e) => {
                const poster = getPosterUrl(e.posterPath, 'w185')
                return (
                  <div
                    key={e.titleKey}
                    className="selected-day-row"
                    onClick={() => navigate(`/title/${e.titleKey}`)}
                  >
                    {poster ? (
                      <img src={poster} alt={e.title} className="selected-day-thumb" />
                    ) : (
                      <div
                        className="selected-day-thumb"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Film size={16} />
                      </div>
                    )}
                    <div className="selected-day-info">
                      <h5 className="selected-day-item-title">{e.title}</h5>
                      <p className="selected-day-item-meta">
                        {e.year || '—'} · {e.type === 'tv' ? 'TV' : 'Movie'}
                      </p>
                    </div>
                    {e.rating && (
                      <span className="selected-day-item-time">⭐ {e.rating}</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
