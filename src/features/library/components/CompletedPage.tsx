import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  Film,
  Clock,
  Star,
} from 'lucide-react'

import { useAppStore } from '@/domain/store'
import { selectCompletedList, selectDashboardStats } from '@/domain/selectors'
import { PosterCard } from '@/shared/ui/PosterCard/PosterCard'
import {
  PageShell,
  PageHeader,
  StatRow,
  StatTile,
  FilterBar,
  EmptyStateCard,
  Button,
} from '@/shared/ui'
import type { LibraryEntry } from '@/shared/schemas'
import { CompletedCalendarView } from './CompletedCalendarView'
import { CompletedTableView, type SortColumn } from './CompletedTableView'
import './CompletedPage.css'

type ViewTab = 'timeline' | 'calendar' | 'list'

function getCompletionDate(e: LibraryEntry): Date {
  const raw = e.completedAt || e.lastWatchedAt || e.updatedAt
  if (!raw) return new Date()
  if (typeof raw.toDate === 'function') return raw.toDate()
  if (raw.seconds) return new Date(raw.seconds * 1000)
  return new Date(raw)
}

export default function CompletedPage() {
  const navigate = useNavigate()
  const library = useAppStore((state) => state.library)
  const history = useAppStore((state) => state.history)

  const [activeTab, setActiveTab] = useState<ViewTab>('timeline')
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null)
  const [sortCol, setSortCol] = useState<SortColumn>('date')
  const [sortAsc, setSortAsc] = useState<boolean>(false)

  const completedEntries = useMemo(() => {
    return selectCompletedList(library)
  }, [library])

  const domainStats = useMemo(() => {
    return selectDashboardStats(library, history)
  }, [library, history])

  const stats = useMemo(() => {
    return {
      totalCount: completedEntries.length,
      hours: domainStats.hoursWatched,
      avgRating: domainStats.avgRating,
      thisMonthCount: domainStats.completedThisMonth,
    }
  }, [completedEntries.length, domainStats])

  const timelineGroups = useMemo(() => {
    const groups: Record<string, LibraryEntry[]> = {}
    const sorted = [...completedEntries].sort(
      (a, b) => getCompletionDate(b).getTime() - getCompletionDate(a).getTime()
    )

    sorted.forEach((e) => {
      const d = getCompletionDate(e)
      const key = d.toLocaleString('default', { month: 'long', year: 'numeric' })
      if (!groups[key]) groups[key] = []
      groups[key].push(e)
    })

    return Object.entries(groups).map(([label, items]) => ({ label, items }))
  }, [completedEntries])

  const dayActivities = useMemo(() => {
    const map: Record<number, LibraryEntry[]> = {}
    const curMonth = calendarDate.getMonth()
    const curYear = calendarDate.getFullYear()

    completedEntries.forEach((e) => {
      const d = getCompletionDate(e)
      if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(e)
      }
    })

    return map
  }, [completedEntries, calendarDate])

  const sortedList = useMemo(() => {
    return [...completedEntries]
      .map((e) => ({ ...e, completionDate: getCompletionDate(e) }))
      .sort((a, b) => {
        let diff = 0
        if (sortCol === 'date') diff = a.completionDate.getTime() - b.completionDate.getTime()
        else if (sortCol === 'title') diff = a.title.localeCompare(b.title)
        else if (sortCol === 'rating') diff = (a.rating ?? 0) - (b.rating ?? 0)
        else if (sortCol === 'runtime') diff = (a.runtimeMinutes ?? 0) - (b.runtimeMinutes ?? 0)
        return sortAsc ? diff : -diff
      })
  }, [completedEntries, sortCol, sortAsc])

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
    setSelectedCalendarDay(null)
  }

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
    setSelectedCalendarDay(null)
  }

  const handleSortChange = (col: SortColumn) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc)
    } else {
      setSortCol(col)
      setSortAsc(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="FINISHED"
        title="Completed"
        subtitle="Every completed movie and season you've conquered, logged with runtimes and personal ratings."
        meta={<span>{completedEntries.length} {completedEntries.length === 1 ? 'title' : 'titles'} in total</span>}
      />

      <StatRow>
        <StatTile
          icon={<Film size={22} />}
          value={stats.totalCount}
          label="Total Finished"
          sublabel="Movies & series"
        />
        <StatTile
          icon={<Clock size={22} />}
          value={`${stats.hours}h`}
          label="Time Watched"
          sublabel="Total hours streamed"
        />
        <StatTile
          icon={<Star size={22} />}
          value={stats.avgRating ? `⭐ ${stats.avgRating}` : '—'}
          label="Average Rating"
          sublabel="For rated completed titles"
        />
        <StatTile
          icon={<CalendarIcon size={22} />}
          value={stats.thisMonthCount}
          label="Completed This Month"
          sublabel="Recent activity"
        />
      </StatRow>

      <FilterBar
        tabs={[
          { id: 'timeline', label: 'Timeline', icon: <Film size={14} /> },
          { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={14} /> },
          { id: 'list', label: 'List', icon: <ListIcon size={14} /> },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

      {completedEntries.length === 0 ? (
        <EmptyStateCard
          title="No completed titles yet"
          description="Titles you mark as completed will automatically organize here by date, calendar, and runtime."
          action={
            <Button variant="primary" onClick={() => navigate('/search')}>
              Browse Titles
            </Button>
          }
        />
      ) : (
        <div className="cp-layout-columns">
          <div className="cp-main-content">
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

            {activeTab === 'calendar' && (
              <CompletedCalendarView
                calendarDate={calendarDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                selectedCalendarDay={selectedCalendarDay}
                onSelectDay={setSelectedCalendarDay}
                dayActivities={dayActivities}
              />
            )}

            {activeTab === 'list' && (
              <CompletedTableView
                sortedList={sortedList}
                sortCol={sortCol}
                sortAsc={sortAsc}
                onSortChange={handleSortChange}
              />
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}
