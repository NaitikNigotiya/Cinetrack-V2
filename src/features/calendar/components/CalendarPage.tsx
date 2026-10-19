import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { fetchPlannedWatches, savePlannedWatch, deletePlannedWatch } from '../api/calendarApi'
import { addToLibrary } from '@/features/library/api/libraryApi'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { toast } from '@/shared/ui'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button/Button'
import { CalendarGrid } from './CalendarGrid'
import { CalendarSidebar } from './CalendarSidebar'
import { CalendarAddModal } from './CalendarAddModal'
import {
  formatDateString,
  computePlannedByDate,
  computeWatchedByDate,
  computeUpcomingReleases,
  computeMonthDays,
  computeWeekDays,
} from './calendarData'

import './CalendarPage.css'

export default function CalendarPage() {
  const { user } = useAuthStore()
  const uid = user?.uid
  const queryClient = useQueryClient()

  const { entries: libraryEntries, refetch: refetchLibrary } = useLibrary('all')

  const { data: plannedWatches = [] } = useQuery({
    queryKey: ['plannedWatches', uid],
    queryFn: () => (uid ? fetchPlannedWatches(uid) : []),
    enabled: Boolean(uid),
  })

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

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date())

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

  const plannedByDate = useMemo(() => computePlannedByDate(plannedWatches), [plannedWatches])
  const watchedByDate = useMemo(() => computeWatchedByDate(libraryEntries as any), [libraryEntries])
  const upcomingReleases = useMemo(() => computeUpcomingReleases(libraryEntries as any), [libraryEntries])

  const releasesByDate = useMemo(() => {
    const map = new Map<string, any[]>()
    upcomingReleases.forEach((rel) => {
      if (rel.releaseDate) {
        const key = rel.releaseDate.length === 10 ? rel.releaseDate : `${rel.releaseDate}-12-31`
        let list = map.get(key)
        if (!list) {
          list = []
          map.set(key, list)
        }
        list.push(rel)
      }
    })
    return map
  }, [upcomingReleases])

  const prevMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (viewMode === 'month') next.setMonth(next.getMonth() - 1)
      else next.setDate(next.getDate() - 7)
      return next
    })
  }

  const nextMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (viewMode === 'month') next.setMonth(next.getMonth() + 1)
      else next.setDate(next.getDate() + 7)
      return next
    })
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDay(now)
  }

  const monthDays = useMemo(() => computeMonthDays(currentDate), [currentDate])
  const weekDays = useMemo(() => computeWeekDays(currentDate), [currentDate])

  const handleOpenAddModal = (mode: 'watched' | 'planned', initialDate?: Date) => {
    setAddMode(mode)
    const d = initialDate || selectedDay
    setTargetDateStr(formatDateString(d))
    setSelectedMedia(null)
    setSearchQuery('')
    setPlanNote('')
    setIsAddModalOpen(true)
  }

  const todayStr = useMemo(() => formatDateString(new Date()), [])

  const handleSubmitAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedMedia || !uid) return

    const type = selectedMedia.media_type === 'tv' ? 'tv' : 'movie'
    const titleKey = `${type}:${selectedMedia.id}`
    const title = selectedMedia.title ?? selectedMedia.name ?? 'Untitled'
    const posterPath = selectedMedia.poster_path ?? null

    if (addMode === 'planned') {
      await addPlanMutation.mutateAsync({
        titleKey,
        title,
        posterPath,
        type,
        plannedFor: targetDateStr,
        note: planNote.trim() || undefined,
      })
    } else {
      try {
        await addToLibrary(uid, {
          titleKey,
          tmdbId: selectedMedia.id,
          type,
          title,
          posterPath: posterPath ?? undefined,
          status: 'completed',
          completedAt: new Date(targetDateStr),
        })
        toast.success(`Logged "${title}" as completed on ${targetDateStr}`)
        refetchLibrary()
      } catch {
        toast.error('Failed to log watch.')
      }
    }

    setIsAddModalOpen(false)
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="SCHEDULE"
        title="Release & Watch Calendar"
        subtitle="Track upcoming movie releases, TV airings, and your scheduled viewing events."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="cal-view-toggle">
              <button
                type="button"
                className={`cal-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
                onClick={() => setViewMode('month')}
              >
                Month
              </button>
              <button
                type="button"
                className={`cal-toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
                onClick={() => setViewMode('week')}
              >
                Week
              </button>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => handleOpenAddModal('planned')}
            >
              Plan Watch
            </Button>
          </div>
        }
      />

      <div className="cal-main-layout">
        <CalendarGrid
          viewMode={viewMode}
          currentDate={currentDate}
          selectedDayKey={formatDateString(selectedDay)}
          todayStr={todayStr}
          monthDays={monthDays}
          weekDays={weekDays.map((w) => ({ date: w.date, dateKey: w.dateKey }))}
          plannedByDate={plannedByDate}
          watchedByDate={watchedByDate}
          releasesByDate={releasesByDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onGoToToday={goToToday}
          onSelectDay={setSelectedDay}
        />

        <CalendarSidebar
          selectedDay={selectedDay}
          selectedDayKey={formatDateString(selectedDay)}
          todayStr={todayStr}
          selectedDayWatched={watchedByDate.get(formatDateString(selectedDay)) || []}
          selectedDayPlanned={plannedByDate.get(formatDateString(selectedDay)) || []}
          upcomingReleases={upcomingReleases}
          onDeletePlan={(planId) => deletePlanMutation.mutate(planId)}
          onOpenAddModal={(mode) => handleOpenAddModal(mode, selectedDay)}
        />
      </div>

      <CalendarAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        addMode={addMode}
        targetDateStr={targetDateStr}
        setTargetDateStr={setTargetDateStr}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        isSearchLoading={isSearchLoading}
        selectedMedia={selectedMedia}
        setSelectedMedia={setSelectedMedia}
        planNote={planNote}
        setPlanNote={setPlanNote}
        onSubmit={() => { void handleSubmitAdd() }}
      />
    </PageShell>
  )
}
