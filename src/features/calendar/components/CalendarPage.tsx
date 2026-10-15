import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  fetchPlannedWatches,
  togglePlannedWatchDone,
  deletePlannedWatch,
} from '../api/calendarApi'
import { CalendarMonthView } from './CalendarMonthView'
import { CalendarAgendaView } from './CalendarAgendaView'
import { Button, IconButton, Skeleton, ConfirmDialog, toast } from '@/shared/ui'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
} from 'lucide-react'
import type { PlannedWatch } from '@/shared/schemas'
import styles from './CalendarPage.module.css'

export default function CalendarPage() {
  const { user } = useAuthStore()
  const uid = user?.uid

  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month')
  const [deletingWatch, setDeletingWatch] = useState<PlannedWatch | null>(null)

  const plannedQuery = useQuery({
    queryKey: ['plannedWatches', uid],
    queryFn: () => (uid ? fetchPlannedWatches(uid) : []),
    enabled: Boolean(uid),
  })

  const plannedWatches = plannedQuery.data ?? []

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleToggleDone = async (watch: PlannedWatch) => {
    if (!uid || !watch.id) return
    try {
      await togglePlannedWatchDone(uid, watch.id, !watch.done)
      toast.success(watch.done ? 'Marked as uncompleted' : 'Marked as completed!')
      plannedQuery.refetch()
    } catch {
      toast.error('Failed to update status.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!uid || !deletingWatch || !deletingWatch.id) return
    try {
      await deletePlannedWatch(uid, deletingWatch.id)
      toast.success('Planned watch removed.')
      plannedQuery.refetch()
    } catch {
      toast.error('Failed to remove watch.')
    } finally {
      setDeletingWatch(null)
    }
  }

  const monthYearLabel = currentDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Watch Calendar</h1>
          <p className={styles.subtitle}>Plan upcoming viewing sessions and track scheduled titles</p>
        </div>

        <div className={styles.controls}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'month' ? styles.activeToggle : ''}`}
              onClick={() => setViewMode('month')}
              aria-label="Month view"
            >
              <CalendarIcon size={16} />
              <span>Month</span>
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'agenda' ? styles.activeToggle : ''}`}
              onClick={() => setViewMode('agenda')}
              aria-label="Agenda view"
            >
              <List size={16} />
              <span>Agenda</span>
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'month' && (
        <div className={styles.monthNavigator}>
          <div className={styles.navGroup}>
            <IconButton
              icon={<ChevronLeft size={20} />}
              aria-label="Previous month"
              onClick={handlePrevMonth}
            />
            <h2 className={styles.monthHeader}>{monthYearLabel}</h2>
            <IconButton
              icon={<ChevronRight size={20} />}
              aria-label="Next month"
              onClick={handleNextMonth}
            />
          </div>
          <Button variant="secondary" onClick={handleToday}>
            Today
          </Button>
        </div>
      )}

      {plannedQuery.isLoading ? (
        <Skeleton height={400} />
      ) : viewMode === 'month' ? (
        <CalendarMonthView
          currentDate={currentDate}
          plannedWatches={plannedWatches}
          onToggleDone={handleToggleDone}
          onDelete={setDeletingWatch}
        />
      ) : (
        <CalendarAgendaView
          plannedWatches={plannedWatches}
          onToggleDone={handleToggleDone}
          onDelete={setDeletingWatch}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingWatch)}
        title="Remove Planned Watch"
        message={`Are you sure you want to remove "${deletingWatch?.title}" from your schedule?`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingWatch(null)}
      />
    </div>
  )
}
