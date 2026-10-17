import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Film,
} from 'lucide-react'

import { useLibrary } from '../hooks/useLibrary'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { PosterCard } from '@/shared/ui/PosterCard/PosterCard'
import type { LibraryEntry } from '@/shared/schemas'
import './CompletedPage.css'

type ViewTab = 'timeline' | 'calendar' | 'list'
type SortColumn = 'date' | 'title' | 'rating' | 'runtime'

function getCompletionDate(e: LibraryEntry): Date {
  const raw = e.completedAt || e.lastWatchedAt || e.updatedAt
  if (!raw) return new Date()
  if (typeof raw.toDate === 'function') return raw.toDate()
  if (raw.seconds) return new Date(raw.seconds * 1000)
  return new Date(raw)
}

function getMonthDaysCount(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getMonthStartDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export default function CompletedPage() {
  const navigate = useNavigate()
  const { entries } = useLibrary('completed')

  // Tab State
  const [activeTab, setActiveTab] = useState<ViewTab>('timeline')

  // Calendar View State
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null)

  // List View Sort State
  const [sortCol, setSortCol] = useState<SortColumn>('date')
  const [sortAsc, setSortAsc] = useState(false)

  // 1. Completed entries with completion date
  const completedEntries = useMemo(() => {
    return entries.map((entry) => ({
      ...entry,
      completionDate: getCompletionDate(entry),
    }))
  }, [entries])

  // 2. Stats
  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const thisMonthList = completedEntries.filter(
      (e) =>
        e.completionDate.getMonth() === currentMonth &&
        e.completionDate.getFullYear() === currentYear
    )

    const totalRuntimeMinutes = completedEntries.reduce(
      (acc, e) => acc + (e.runtimeMinutes || 100),
      0
    )
    const ratedTitles = completedEntries.filter((e) => e.rating !== null && e.rating !== undefined)
    const avgRating =
      ratedTitles.length > 0
        ? (
            ratedTitles.reduce((acc, e) => acc + (e.rating ?? 0), 0) / ratedTitles.length
          ).toFixed(1)
        : 'N/A'

    const allTimeHours = Math.round(totalRuntimeMinutes / 60)

    return {
      totalCompleted: completedEntries.length,
      thisMonthCount: thisMonthList.length,
      allTimeHours,
      avgRating,
    }
  }, [completedEntries])

  // 3. Timeline group by Year & Month
  const timelineGroups = useMemo(() => {
    const groups: { [key: string]: typeof completedEntries } = {}

    const sorted = [...completedEntries].sort(
      (a, b) => b.completionDate.getTime() - a.completionDate.getTime()
    )

    sorted.forEach((e) => {
      const key = e.completionDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
      if (!groups[key]) groups[key] = []
      groups[key].push(e)
    })

    return Object.entries(groups).map(([label, items]) => ({ label, items }))
  }, [completedEntries])

  // Calendar calculations
  const calYear = calendarDate.getFullYear()
  const calMonth = calendarDate.getMonth()
  const calMonthName = calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const daysInMonth = getMonthDaysCount(calYear, calMonth)
  const startDay = getMonthStartDayOfWeek(calYear, calMonth)

  const dayActivities = useMemo(() => {
    const map: { [day: number]: typeof completedEntries } = {}
    completedEntries.forEach((e) => {
      if (
        e.completionDate.getFullYear() === calYear &&
        e.completionDate.getMonth() === calMonth
      ) {
        const d = e.completionDate.getDate()
        if (!map[d]) map[d] = []
        map[d].push(e)
      }
    })
    return map
  }, [completedEntries, calYear, calMonth])

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calYear, calMonth - 1, 1))
    setSelectedCalendarDay(null)
  }

  const handleNextMonth = () => {
    setCalendarDate(new Date(calYear, calMonth + 1, 1))
    setSelectedCalendarDay(null)
  }

  // Sorted list for table view
  const sortedList = useMemo(() => {
    return [...completedEntries].sort((a, b) => {
      let res = 0
      if (sortCol === 'title') res = a.title.localeCompare(b.title)
      else if (sortCol === 'rating') res = (b.rating ?? 0) - (a.rating ?? 0)
      else if (sortCol === 'runtime') res = (b.runtimeMinutes ?? 0) - (a.runtimeMinutes ?? 0)
      else res = b.completionDate.getTime() - a.completionDate.getTime()
      return sortAsc ? -res : res
    })
  }, [completedEntries, sortCol, sortAsc])

  return (
    <div className="completed-page">
      {/* Header */}
      <header className="cp-header">
        <div className="cp-header-left">
          <h1 className="cp-title">Completed</h1>
          {/* View Tab Bar */}
          <div className="cp-tab-bar" role="tablist">
            <button
              className={`cp-tab-btn ${activeTab === 'timeline' ? 'cp-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('timeline')}
              type="button"
            >
              <Film size={14} style={{ marginRight: 6 }} />
              Timeline
            </button>
            <button
              className={`cp-tab-btn ${activeTab === 'calendar' ? 'cp-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('calendar')}
              type="button"
            >
              <CalendarIcon size={14} style={{ marginRight: 6 }} />
              Calendar
            </button>
            <button
              className={`cp-tab-btn ${activeTab === 'list' ? 'cp-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('list')}
              type="button"
            >
              <ListIcon size={14} style={{ marginRight: 6 }} />
              List
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="cp-header-stats-strip">
          <div className="cp-strip-item">
            <span className="cp-strip-lbl">Total Finished</span>
            <span className="cp-strip-val">{stats.totalCompleted} titles</span>
          </div>
          <div className="cp-strip-item">
            <span className="cp-strip-lbl">Watch Time</span>
            <span className="cp-strip-val">{stats.allTimeHours} hrs</span>
          </div>
          <div className="cp-strip-item">
            <span className="cp-strip-lbl">Avg Rating</span>
            <span className="cp-strip-val">⭐ {stats.avgRating}</span>
          </div>
          <div className="cp-strip-item">
            <span className="cp-strip-lbl">This Month</span>
            <span className="cp-strip-val">{stats.thisMonthCount}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {completedEntries.length === 0 ? (
        <div className="cp-empty-state">
          <div className="cp-empty-emoji">🏆</div>
          <h2 className="cp-empty-title">No completed titles yet</h2>
          <p className="cp-empty-desc">
            Titles you mark as completed will automatically organize here by date, calendar, and runtime.
          </p>
          <button className="cp-empty-cta" onClick={() => navigate('/search')} type="button">
            Browse Titles
          </button>
        </div>
      ) : (
        <div className="cp-layout-columns">
          <div className="cp-main-content">
            {/* 1. TIMELINE VIEW */}
            {activeTab === 'timeline' && (
              <div className="timeline-pane">
                {timelineGroups.map(({ label, items }) => (
                  <section key={label} className="timeline-group">
                    <div className="timeline-group-header">
                      <h3 className="timeline-group-title">{label}</h3>
                      <span className="timeline-group-stats">{items.length} titles</span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      {items.map((entry) => (
                        <PosterCard
                          key={entry.titleKey}
                          title={entry.title}
                          year={entry.year}
                          posterPath={entry.posterPath}
                          rating={entry.rating}
                          type={entry.type}
                          status="completed"
                          isFavorite={entry.isFavorite}
                          onClick={() => navigate(`/title/${entry.titleKey}`)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* 2. CALENDAR VIEW */}
            {activeTab === 'calendar' && (
              <div className="calendar-pane">
                <div className="full-cal-header">
                  <button className="full-cal-nav-btn" onClick={handlePrevMonth} type="button">
                    <ChevronLeft size={16} />
                  </button>
                  <h3 className="full-cal-title">{calMonthName}</h3>
                  <button className="full-cal-nav-btn" onClick={handleNextMonth} type="button">
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="full-cal-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="full-cal-day-header">
                      {d}
                    </div>
                  ))}

                  {/* Empty offsets */}
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="full-cal-cell" style={{ opacity: 0.2 }} />
                  ))}

                  {/* Month days */}
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
                        onClick={() => setSelectedCalendarDay(isSelected ? null : dayNum)}
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

                {/* Day Details */}
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
                                <div className="selected-day-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            )}

            {/* 3. LIST TABLE VIEW */}
            {activeTab === 'list' && (
              <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)' }}>
                <table className="list-view-table">
                  <thead>
                    <tr>
                      <th
                        className="sortable-th"
                        onClick={() => {
                          if (sortCol === 'title') setSortAsc(!sortAsc)
                          else { setSortCol('title'); setSortAsc(false) }
                        }}
                      >
                        Title
                      </th>
                      <th
                        className="sortable-th"
                        onClick={() => {
                          if (sortCol === 'date') setSortAsc(!sortAsc)
                          else { setSortCol('date'); setSortAsc(false) }
                        }}
                      >
                        Date Finished
                      </th>
                      <th
                        className="sortable-th"
                        onClick={() => {
                          if (sortCol === 'rating') setSortAsc(!sortAsc)
                          else { setSortCol('rating'); setSortAsc(false) }
                        }}
                      >
                        Rating
                      </th>
                      <th
                        className="sortable-th"
                        onClick={() => {
                          if (sortCol === 'runtime') setSortAsc(!sortAsc)
                          else { setSortCol('runtime'); setSortAsc(false) }
                        }}
                      >
                        Runtime
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedList.map((entry) => {
                      const poster = getPosterUrl(entry.posterPath, 'w92')
                      return (
                        <tr
                          key={entry.titleKey}
                          className="list-view-row"
                          onClick={() => navigate(`/title/${entry.titleKey}`)}
                        >
                          <td>
                            <div className="list-title-cell">
                              {poster ? (
                                <img src={poster} alt={entry.title} className="list-row-thumb" />
                              ) : (
                                <div className="list-row-thumb-ph">
                                  <Film size={12} />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 600 }}>{entry.title}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  {entry.year || '—'} · {entry.type === 'tv' ? 'TV' : 'Movie'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {entry.completionDate.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td>
                            {entry.rating ? (
                              <span style={{ color: 'var(--star-filled, #f5c518)', fontWeight: 600 }}>
                                ⭐ {entry.rating.toFixed(1)}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>{entry.runtimeMinutes ? `${entry.runtimeMinutes} min` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
