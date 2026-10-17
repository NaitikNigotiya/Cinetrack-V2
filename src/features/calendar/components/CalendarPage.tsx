import { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  Film,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Search,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { fetchPlannedWatches, savePlannedWatch, deletePlannedWatch } from '../api/calendarApi'
import { addToLibrary } from '@/features/library/api/libraryApi'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { getImageUrl } from '@/services/tmdb/images'
import { toast } from '@/shared/ui'
import type { PlannedWatch } from '@/shared/schemas'

import './CalendarPage.css'

interface UpcomingReleaseItem {
  titleKey: string
  title: string
  type: 'movie' | 'tv'
  posterPath: string | null
  releaseDate: string | null
  daysUntil: number
}

function formatDateString(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function CalendarPage() {
  const { user } = useAuthStore()
  const uid = user?.uid
  const queryClient = useQueryClient()

  const { entries: libraryEntries, refetch: refetchLibrary } = useLibrary('all')

  // Queries
  const { data: plannedWatches = [] } = useQuery({
    queryKey: ['plannedWatches', uid],
    queryFn: () => (uid ? fetchPlannedWatches(uid) : []),
    enabled: Boolean(uid),
  })

  // Mutations
  const addPlanMutation = useMutation({
    mutationFn: async (planData: {
      titleKey: string
      title: string
      posterPath: string | null
      type: 'movie' | 'tv'
      plannedFor: string
      note?: string | undefined
    }) => {
      if (!uid) throw new Error('Not authenticated')
      return savePlannedWatch(uid, planData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedWatches', uid] })
      toast.success('Planned watch scheduled!')
    },
    onError: () => toast.error('Failed to save planned watch.'),
  })

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!uid) throw new Error('Not authenticated')
      return deletePlannedWatch(uid, planId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedWatches', uid] })
      toast.success('Planned watch removed.')
    },
    onError: () => toast.error('Failed to delete planned watch.'),
  })

  // State
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date())

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addMode, setAddMode] = useState<'watched' | 'planned'>('planned')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<any>(null)
  const [targetDateStr, setTargetDateStr] = useState(() => formatDateString(new Date()))
  const [planNote, setPlanNote] = useState('')

  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['calendar-title-search', searchQuery],
    queryFn: () => (searchQuery.trim().length >= 2 ? tmdbClient.searchMulti(searchQuery) : null),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 30 * 1000,
  })

  const searchResults = (searchData?.results ?? []).filter(
    (r: any) => r.media_type === 'movie' || r.media_type === 'tv'
  )

  // Maps
  const plannedByDate = useMemo(() => {
    const map = new Map<string, PlannedWatch[]>()
    plannedWatches.forEach((pw) => {
      const dateKey = pw.plannedFor
      let list = map.get(dateKey)
      if (!list) {
        list = []
        map.set(dateKey, list)
      }
      list.push(pw)
    })
    return map
  }, [plannedWatches])

  // Completed / watched items mapped to completedAt
  const watchedByDate = useMemo(() => {
    const map = new Map<string, typeof libraryEntries>()
    libraryEntries.forEach((entry) => {
      if (entry.status === 'completed' && entry.completedAt) {
        const d = entry.completedAt.toDate
          ? entry.completedAt.toDate()
          : new Date(entry.completedAt)
        const dateKey = formatDateString(d)
        let list = map.get(dateKey)
        if (!list) {
          list = []
          map.set(dateKey, list)
        }
        list.push(entry)
      }
    })
    return map
  }, [libraryEntries])

  // Upcoming items from plan_to_watch
  const upcomingReleases: UpcomingReleaseItem[] = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const list: UpcomingReleaseItem[] = []
    const ptw = libraryEntries.filter((e) => e.status === 'plan_to_watch')

    ptw.forEach((item) => {
      if (item.year && item.year >= today.getFullYear()) {
        const releaseStr = `${item.year}-12-31`
        const releaseDate = new Date(releaseStr)
        const diffTime = releaseDate.getTime() - today.getTime()
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        list.push({
          titleKey: item.titleKey,
          title: item.title,
          type: item.type,
          posterPath: item.posterPath,
          releaseDate: String(item.year),
          daysUntil,
        })
      }
    })

    return list.slice(0, 10)
  }, [libraryEntries])

  // Navigation handlers
  const prevMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() - 1)
      } else {
        next.setDate(next.getDate() - 7)
      }
      return next
    })
  }

  const nextMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (viewMode === 'month') {
        next.setMonth(next.getMonth() + 1)
      } else {
        next.setDate(next.getDate() + 7)
      }
      return next
    })
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDay(now)
  }

  // Month Grid Days computation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    const startDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate()

    const days: Array<{ date: Date; isCurrentMonth: boolean; dateKey: string }> = []

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({ date: d, isCurrentMonth: false, dateKey: formatDateString(d) })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({ date: d, isCurrentMonth: true, dateKey: formatDateString(d) })
    }

    // Next month padding to fill complete weeks (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: d, isCurrentMonth: false, dateKey: formatDateString(d) })
    }

    return days
  }, [currentDate])

  // Week Grid Days computation
  const weekDays = useMemo(() => {
    const start = new Date(currentDate)
    const day = start.getDay()
    start.setDate(start.getDate() - day)

    const days: Array<{ date: Date; dateKey: string }> = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      days.push({ date: d, dateKey: formatDateString(d) })
    }
    return days
  }, [currentDate])

  // Selected day items
  const selectedDayKey = formatDateString(selectedDay)
  const selectedDayWatched = watchedByDate.get(selectedDayKey) ?? []
  const selectedDayPlanned = plannedByDate.get(selectedDayKey) ?? []

  // Add Watch / Plan Submit
  const handleAddSubmit = async () => {
    if (!selectedMedia) return
    const mediaType = selectedMedia.media_type || 'movie'
    const titleKey = `${mediaType}:${selectedMedia.id}`

    if (addMode === 'planned') {
      await addPlanMutation.mutateAsync({
        titleKey,
        title: selectedMedia.title ?? selectedMedia.name ?? 'Untitled',
        posterPath: selectedMedia.poster_path ?? null,
        type: mediaType,
        plannedFor: targetDateStr,
        note: planNote.trim() || undefined,
      })
    } else {
      if (!uid) {
        toast.error('Sign in to log watch.')
        return
      }
      try {
        await addToLibrary(uid, {
          titleKey,
          tmdbId: selectedMedia.id,
          type: mediaType,
          title: selectedMedia.title ?? selectedMedia.name ?? 'Untitled',
          posterPath: selectedMedia.poster_path ?? null,
          status: 'completed',
          completedAt: new Date(targetDateStr),
        })
        refetchLibrary()
        toast.success(`Logged "${selectedMedia.title ?? selectedMedia.name}" as watched ✓`)
      } catch {
        toast.error('Failed to log watch.')
      }
    }

    setIsAddModalOpen(false)
    setSelectedMedia(null)
    setPlanNote('')
    setSearchQuery('')
  }

  const todayStr = formatDateString(new Date())

  return (
    <div className="unified-page-container calendar-page">
      {/* ── Page Header ── */}
      <header className="unified-page-header calendar-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Track viewing history, upcoming releases & planned watches</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* View mode toggle */}
          <div className="calendar-toggle-group" role="group">
            <button
              className={`calendar-btn-toggle ${viewMode === 'month' ? 'calendar-btn-toggle--active' : ''}`}
              onClick={() => setViewMode('month')}
              type="button"
            >
              Month
            </button>
            <button
              className={`calendar-btn-toggle ${viewMode === 'week' ? 'calendar-btn-toggle--active' : ''}`}
              onClick={() => setViewMode('week')}
              type="button"
            >
              Week
            </button>
          </div>

          <button
            className="page-header-btn"
            onClick={() => {
              setTargetDateStr(selectedDayKey)
              setAddMode('planned')
              setIsAddModalOpen(true)
            }}
            type="button"
          >
            <Plus size={15} /> Plan Watch
          </button>
        </div>
      </header>

      {/* ── Main Layout: Calendar + Sidebar ── */}
      <div className="calendar-layout">
        {/* Main Column */}
        <div className="calendar-main-col">
          {/* Month / Week navigator bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div className="calendar-nav-group">
              <button
                className="calendar-btn-nav"
                onClick={prevMonth}
                aria-label="Previous"
                type="button"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="calendar-btn-nav"
                onClick={nextMonth}
                aria-label="Next"
                type="button"
              >
                <ChevronRight size={16} />
              </button>
              <button className="calendar-btn-today" onClick={goToToday} type="button">
                Today
              </button>
            </div>

            <div className="calendar-month-title">
              {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'month' ? (
            <div className="calendar-grid-container">
              {/* Weekday headers */}
              <div className="calendar-weekdays-header">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="weekday-lbl">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="calendar-days-grid">
                {monthDays.map(({ date, isCurrentMonth, dateKey }) => {
                  const isToday = dateKey === todayStr
                  const isSelected = dateKey === selectedDayKey
                  const watched = watchedByDate.get(dateKey) ?? []
                  const planned = plannedByDate.get(dateKey) ?? []

                  return (
                    <div
                      key={dateKey}
                      className={`calendar-day-cell ${
                        !isCurrentMonth ? 'calendar-day-cell--other-month' : ''
                      } ${isToday ? 'calendar-day-cell--today' : ''} ${
                        isSelected ? 'calendar-day-cell--selected' : ''
                      }`}
                      onClick={() => setSelectedDay(date)}
                    >
                      <div className="day-header">
                        <span className="day-number">{date.getDate()}</span>
                      </div>

                      <div className="day-pills-list">
                        {watched.map((item) => (
                          <div
                            key={item.titleKey}
                            className="day-pill day-pill--watch"
                            title={`Watched: ${item.title}`}
                          >
                            ✓ {item.title}
                          </div>
                        ))}
                        {planned.map((plan) => (
                          <div
                            key={plan.id}
                            className="day-pill day-pill--planned"
                            title={`Planned: ${plan.title}`}
                          >
                            📅 {plan.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Week View */
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
                    onClick={() => setSelectedDay(date)}
                    style={isSelected ? { outline: '2px solid var(--color-brand)' } : {}}
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
        </div>

        {/* Sidebar Column: Day Inspector & Upcoming Releases */}
        <div className="calendar-sidebar-col">
          {/* Day Inspector Section */}
          <div className="sidebar-section">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                {selectedDay.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </h3>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {selectedDayKey === todayStr ? 'Today' : ''}
              </span>
            </div>

            {/* Actions for Selected Day */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                className="page-header-btn"
                style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}
                onClick={() => {
                  setTargetDateStr(selectedDayKey)
                  setAddMode('watched')
                  setIsAddModalOpen(true)
                }}
                type="button"
              >
                + Log Watch
              </button>
              <button
                className="sort-btn"
                style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}
                onClick={() => {
                  setTargetDateStr(selectedDayKey)
                  setAddMode('planned')
                  setIsAddModalOpen(true)
                }}
                type="button"
              >
                + Plan Watch
              </button>
            </div>

            {/* List of Day Items */}
            {selectedDayWatched.length > 0 || selectedDayPlanned.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedDayWatched.map((w) => {
                  const poster = getImageUrl(w.posterPath, 'w200')
                  return (
                    <div
                      key={w.titleKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        background: 'var(--bg-elevated, #1a1c28)',
                        borderRadius: 6,
                        borderLeft: '3px solid var(--color-brand, #e50914)',
                      }}
                    >
                      {poster ? (
                        <img
                          src={poster}
                          alt={w.title}
                          style={{ width: 28, height: 42, objectFit: 'cover', borderRadius: 2 }}
                        />
                      ) : (
                        <Film size={14} color="var(--text-muted)" />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {w.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>✓ Watched</div>
                      </div>
                    </div>
                  )
                })}

                {selectedDayPlanned.map((p) => {
                  const poster = getImageUrl(p.posterPath, 'w200')
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        background: 'var(--bg-elevated, #1a1c28)',
                        borderRadius: 6,
                        borderLeft: '3px solid #00B4D8',
                      }}
                    >
                      {poster ? (
                        <img
                          src={poster}
                          alt={p.title}
                          style={{ width: 28, height: 42, objectFit: 'cover', borderRadius: 2 }}
                        />
                      ) : (
                        <Film size={14} color="var(--text-muted)" />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {p.title}
                        </div>
                        <div style={{ fontSize: 11, color: '#00B4D8' }}>
                          📅 {p.note || 'Planned'}
                        </div>
                      </div>
                      <button
                        onClick={() => p.id && deletePlanMutation.mutate(p.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 4,
                        }}
                        type="button"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '16px 0',
                  margin: 0,
                }}
              >
                No watches or plans for this day.
              </p>
            )}
          </div>

          {/* Upcoming Releases Section */}
          <div className="sidebar-section">
            <h2 className="sidebar-section-title">
              <CalendarIcon size={18} color="var(--text-muted)" />
              Upcoming Releases
            </h2>

            {upcomingReleases.length > 0 ? (
              <div className="upcoming-list">
                {upcomingReleases.map((item) => {
                  const poster = getImageUrl(item.posterPath, 'w200')
                  return (
                    <article key={item.titleKey} className="upcoming-item">
                      {poster ? (
                        <img
                          src={poster}
                          alt={item.title}
                          className="upcoming-poster"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="upcoming-poster"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Film size={14} color="var(--text-muted)" />
                        </div>
                      )}
                      <div className="upcoming-details">
                        <span className="upcoming-item-title">{item.title}</span>
                        <span className="upcoming-item-release">Releases {item.releaseDate}</span>
                      </div>
                      <span
                        className={`urgency-badge ${
                          item.daysUntil <= 30
                            ? 'urgency-badge--this-month'
                            : 'urgency-badge--later'
                        }`}
                      >
                        {item.daysUntil <= 30 ? 'Soon' : 'Later'}
                      </span>
                    </article>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                No future releases in your Plan to Watch list.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Log Watch / Plan Watch Modal ── */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <header className="review-modal-header">
              <h2 className="review-modal-title">
                {addMode === 'watched' ? 'Log Watch' : 'Plan Watch'}
              </h2>
              <button
                className="btn-close-modal"
                onClick={() => setIsAddModalOpen(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </header>

            <div className="review-modal-body">
              {/* Target Date */}
              <div>
                <label className="sort-label">Date</label>
                <input
                  type="date"
                  value={targetDateStr}
                  onChange={(e) => setTargetDateStr(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'var(--bg-elevated, #1a1c28)',
                    border: '1px solid var(--border-default, #2a2c3d)',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: 14,
                    marginTop: 4,
                  }}
                />
              </div>

              {/* Search or Selected */}
              {!selectedMedia ? (
                <div className="modal-search-wrapper">
                  <label className="sort-label">Search Title</label>
                  <div className="modal-search-input-box">
                    <Search
                      size={16}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: 12,
                        color: 'var(--text-muted)',
                      }}
                    />
                    <input
                      type="text"
                      className="modal-search-input"
                      placeholder="Search movie or TV show..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {searchQuery.length >= 2 && (
                    <div className="search-results-dropdown">
                      {isSearchLoading ? (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((res: any) => {
                          const name = res.title ?? res.name ?? 'Untitled'
                          const poster = getImageUrl(res.poster_path, 'w200')
                          return (
                            <div
                              key={`${res.media_type}:${res.id}`}
                              className="search-dropdown-item"
                              onClick={() => setSelectedMedia(res)}
                            >
                              {poster ? (
                                <img src={poster} alt={name} className="search-dropdown-poster" />
                              ) : (
                                <Film size={14} />
                              )}
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  {res.media_type === 'movie' ? 'Movie' : 'TV Show'}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
                          No matches found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="selected-title-badge">
                  {selectedMedia.poster_path ? (
                    <img
                      src={getImageUrl(selectedMedia.poster_path, 'w200')!}
                      alt="Poster"
                      className="selected-title-poster"
                    />
                  ) : (
                    <Film size={20} />
                  )}
                  <div className="selected-title-info">
                    <div className="selected-title-name">
                      {selectedMedia.title ?? selectedMedia.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-brand)' }}>Selected ✓</div>
                  </div>
                  <button
                    className="btn-review-action"
                    onClick={() => setSelectedMedia(null)}
                    type="button"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Note (optional) */}
              {selectedMedia && (
                <div>
                  <label className="sort-label">Note (optional)</label>
                  <input
                    type="text"
                    placeholder={
                      addMode === 'watched' ? 'e.g. Watched with friends' : 'e.g. Movie night plan'
                    }
                    value={planNote}
                    onChange={(e) => setPlanNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'var(--bg-elevated, #1a1c28)',
                      border: '1px solid var(--border-default, #2a2c3d)',
                      color: 'var(--text-primary, #ffffff)',
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  />
                </div>
              )}
            </div>

            <footer className="review-modal-footer">
              <button
                className="btn-publish-review"
                onClick={handleAddSubmit}
                disabled={!selectedMedia}
                type="button"
              >
                {addMode === 'watched' ? 'Log Watch' : 'Add to Plan'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
