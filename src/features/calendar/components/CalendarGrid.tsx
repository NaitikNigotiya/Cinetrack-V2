import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'
import type { PlannedWatch, LibraryEntry } from '@/shared/schemas'

interface CalendarGridProps {
  viewMode: 'month' | 'week'
  currentDate: Date
  selectedDayKey: string
  todayStr: string
  onPrevMonth: () => void
  onNextMonth: () => void
  onGoToToday: () => void
  onSelectDay: (d: Date) => void
  monthDays: Array<{ date: Date; isCurrentMonth: boolean; dateKey: string }>
  weekDays: Array<{ date: Date; dateKey: string }>
  watchedByDate: Map<string, LibraryEntry[]>
  plannedByDate: Map<string, PlannedWatch[]>
}

export function CalendarGrid({
  viewMode,
  currentDate,
  selectedDayKey,
  todayStr,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  onSelectDay,
  monthDays,
  weekDays,
  watchedByDate,
  plannedByDate,
  releasesByDate,
}: CalendarGridProps & { releasesByDate?: Map<string, any[]> }) {
  return (
    <Card variant="default">
      {/* Month / Week navigator bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevMonth}
            aria-label="Previous"
            style={{ padding: '6px 8px' }}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextMonth}
            aria-label="Next"
            style={{ padding: '6px 8px' }}
          >
            <ChevronRight size={16} />
          </Button>
          <Button variant="secondary" size="sm" onClick={onGoToToday}>
            Today
          </Button>
        </div>

        <div style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>
          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="calendar-grid-container">
          <div className="calendar-weekdays-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="weekday-lbl">
                {d}
              </div>
            ))}
          </div>

          <div className="calendar-days-grid">
            {monthDays.map(({ date, isCurrentMonth, dateKey }) => {
              const isToday = dateKey === todayStr
              const isSelected = dateKey === selectedDayKey
              const watched = watchedByDate.get(dateKey) ?? []
              const planned = plannedByDate.get(dateKey) ?? []
              const releases = releasesByDate?.get(dateKey) ?? []

              const allDayItems = [
                ...watched.map((item) => ({ key: `w_${item.titleKey}`, type: 'watch' as const, label: `✓ ${item.title}` })),
                ...planned.map((item) => ({ key: `p_${item.id}`, type: 'planned' as const, label: `📅 ${item.title}` })),
                ...releases.map((item) => ({ key: `r_${item.titleKey}`, type: 'release' as const, label: `🎬 ${item.title}` })),
              ]
              const visibleItems = allDayItems.slice(0, 2)
              const overflowCount = allDayItems.length - 2

              return (
                <div
                  key={dateKey}
                  className={`calendar-day-cell ${
                    !isCurrentMonth ? 'calendar-day-cell--other-month' : ''
                  } ${isToday ? 'calendar-day-cell--today' : ''} ${
                    isSelected ? 'calendar-day-cell--selected' : ''
                  }`}
                  onClick={() => onSelectDay(date)}
                >
                  <div className="day-header">
                    <span className="day-number">{date.getDate()}</span>
                  </div>

                  <div className="day-pills-list">
                    {visibleItems.map((item) => (
                      <div
                        key={item.key}
                        className={`day-pill day-pill--${item.type}`}
                        title={item.label}
                      >
                        {item.label}
                      </div>
                    ))}
                    {overflowCount > 0 && (
                      <div className="day-pill-more">+{overflowCount} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="calendar-week-grid">
          {weekDays.map(({ date, dateKey }) => {
            const isToday = dateKey === todayStr
            const isSelected = dateKey === selectedDayKey
            const watched = watchedByDate.get(dateKey) ?? []
            const planned = plannedByDate.get(dateKey) ?? []

            return (
              <div
                key={dateKey}
                className={`week-column ${isToday ? 'week-column--today' : ''}`}
                onClick={() => onSelectDay(date)}
                style={isSelected ? { outline: '2px solid var(--brand-primary)' } : {}}
              >
                <div className="week-column-header">
                  <span className="week-day-name">
                    {date.toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                  <span className="week-date">{date.getDate()}</span>
                </div>

                <div className="week-cards-list">
                  {watched.map((item) => (
                    <div key={item.titleKey} className="week-item-card week-item-card--watch">
                      <span className="week-item-title">✓ {item.title}</span>
                      <span className="week-item-meta">Watched</span>
                    </div>
                  ))}
                  {planned.map((plan) => (
                    <div key={plan.id} className="week-item-card week-item-card--planned">
                      <span className="week-item-title">📅 {plan.title}</span>
                      <span className="week-item-meta">{plan.note || 'Planned'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
