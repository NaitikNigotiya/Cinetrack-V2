import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fetchHistory, deleteHistoryEventWithUndo } from '../api/historyApi'
import { LogPastWatchDialog } from './LogPastWatchDialog'
import { HistoryTimelineView } from './HistoryTimelineView'
import { HistoryGridView } from './HistoryGridView'
import { HistoryCompactView } from './HistoryCompactView'
import {
  Button,
  Skeleton,
  PageShell,
  PageHeader,
  StatRow,
  StatTile,
  FilterBar,
  SearchField,
  EmptyStateCard,
} from '@/shared/ui'
import {
  Plus,
  History as HistoryIcon,
  Calendar,
  Clock,
  Star,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from 'lucide-react'
import type { HistoryEvent } from '@/shared/schemas'
import {
  type TimeFilter,
  type SortOption,
  calculateGlobalStats,
  processHistoryEvents,
  groupEventsByDay,
} from './historyData'

type ViewMode = 'timeline' | 'grid' | 'compact'

export default function HistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid

  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv_episode'>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLogOpen, setIsLogOpen] = useState(false)

  const historyQuery = useQuery({
    queryKey: ['history', uid],
    queryFn: () => (uid ? fetchHistory(uid, 150) : []),
    enabled: Boolean(uid),
  })

  const rawEvents = historyQuery.data || []
  const globalStats = useMemo(() => calculateGlobalStats(rawEvents), [rawEvents])

  const processedEvents = useMemo(
    () => processHistoryEvents(rawEvents, typeFilter, timeFilter, searchQuery, sortOption),
    [rawEvents, typeFilter, timeFilter, searchQuery, sortOption]
  )

  const timelineGroups = useMemo(() => groupEventsByDay(processedEvents), [processedEvents])

  const handleDelete = async (event: HistoryEvent) => {
    if (!uid) return
    await deleteHistoryEventWithUndo(uid, event)
    historyQuery.refetch()
  }

  const currentMonthName = new Date().toLocaleDateString(undefined, { month: 'long' })

  return (
    <PageShell>
      <PageHeader
        eyebrow="WATCH JOURNAL"
        title="Viewing History"
        subtitle="Chronological log of every film and episode you've watched"
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsLogOpen(true)}
          >
            Log Past Watch
          </Button>
        }
      >
        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Filter history by title or episode name..."
          aria-label="Filter history titles"
        />
      </PageHeader>

      <StatRow>
        <StatTile
          icon={<HistoryIcon size={20} />}
          value={globalStats.totalCount}
          label="Total Logs"
          sublabel={`${globalStats.movieCount} movies • ${globalStats.tvCount} episodes`}
        />
        <StatTile
          icon={<Clock size={20} />}
          value={`${globalStats.totalHours}h`}
          label="Time Watched"
          sublabel={globalStats.totalCount > 0 ? `~${globalStats.avgMins}m per entry` : '0m avg'}
        />
        <StatTile
          icon={<Calendar size={20} />}
          value={globalStats.thisMonthCount}
          label={currentMonthName}
          sublabel={`${globalStats.thisMonthHours} hours logged`}
        />
        <StatTile
          icon={<Star size={20} />}
          value={globalStats.avgRating ? `⭐ ${globalStats.avgRating}` : '—'}
          label="Avg Rating"
          sublabel={globalStats.ratedCount > 0 ? `From ${globalStats.ratedCount} ratings` : 'No ratings yet'}
        />
      </StatRow>

      <FilterBar
        tabs={[
          { id: 'all', label: 'All', count: rawEvents.length },
          { id: 'movie', label: 'Movies', count: globalStats.movieCount },
          { id: 'tv_episode', label: 'Episodes', count: globalStats.tvCount },
        ]}
        activeTab={typeFilter}
        onTabChange={(id) => setTypeFilter(id as any)}
        sortOptions={[
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'runtime_desc', label: 'Longest Runtime' },
          { value: 'rating_desc', label: 'Highest Rated' },
        ]}
        sortValue={sortOption}
        onSortChange={(val) => setSortOption(val as any)}
        rightActions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="history-view-switcher" role="radiogroup" aria-label="View layout mode">
              <button
                type="button"
                className={`history-view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
                aria-label="Timeline View"
                title="Timeline View"
              >
                <SlidersHorizontal size={14} />
              </button>
              <button
                type="button"
                className={`history-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid View"
                title="Grid View"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                className={`history-view-btn ${viewMode === 'compact' ? 'active' : ''}`}
                onClick={() => setViewMode('compact')}
                aria-label="Compact View"
                title="Compact List View"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        }
      />

      <div className="history-subfilter-chips" role="radiogroup" aria-label="Time period filter">
        {[
          { id: 'all', label: 'All Time' },
          { id: '7d', label: 'Last 7 Days' },
          { id: '30d', label: 'Last 30 Days' },
          { id: 'this_month', label: 'This Month' },
          { id: 'this_year', label: 'This Year' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`history-period-chip ${timeFilter === t.id ? 'active' : ''}`}
            onClick={() => setTimeFilter(t.id as TimeFilter)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {historyQuery.isLoading ? (
        <div className="history-loading-feed" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={120} style={{ borderRadius: 'var(--radius-card)' }} />
          ))}
        </div>
      ) : processedEvents.length === 0 ? (
        <EmptyStateCard
          title={searchQuery || typeFilter !== 'all' || timeFilter !== 'all' ? 'No matching logs found' : 'No watch history yet'}
          description={
            searchQuery || typeFilter !== 'all' || timeFilter !== 'all'
              ? 'Try widening your filters or search terms.'
              : 'As you watch movies and mark episodes as completed, your history will populate here automatically.'
          }
          action={
            <div style={{ display: 'flex', gap: 12 }}>
              {searchQuery || typeFilter !== 'all' || timeFilter !== 'all' ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('')
                    setTypeFilter('all')
                    setTimeFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              ) : null}
              <Button
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={() => setIsLogOpen(true)}
              >
                Log Past Watch
              </Button>
            </div>
          }
        />
      ) : viewMode === 'timeline' ? (
        <HistoryTimelineView
          timelineGroups={timelineGroups}
          onDelete={handleDelete}
          onTitleClick={(titleKey) => navigate(`/title/${titleKey}`)}
          onOpenEpisodes={(titleKey) => navigate(`/title/${titleKey}/episodes`)}
          formatWatchDate={(d) => ({
            timeStr: d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          })}
          formatMinutes={(mins) => (mins ? `${mins}m` : '')}
        />
      ) : viewMode === 'grid' ? (
        <HistoryGridView
          events={processedEvents}
          onDelete={handleDelete}
          onTitleClick={(titleKey) => navigate(`/title/${titleKey}`)}
          formatWatchDate={(d) => ({
            dayKey: d ? d.toISOString().split('T')[0] ?? '' : '',
          })}
        />
      ) : (
        <HistoryCompactView
          events={processedEvents}
          onDelete={handleDelete}
          onTitleClick={(titleKey) => navigate(`/title/${titleKey}`)}
          formatWatchDate={(d) => ({
            dayKey: d ? d.toISOString().split('T')[0] ?? '' : '',
            timeStr: d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          })}
        />
      )}

      <LogPastWatchDialog
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        onSaved={() => historyQuery.refetch()}
      />
    </PageShell>
  )
}
