import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fetchHistory, deleteHistoryEventWithUndo } from '../api/historyApi'
import { LogPastWatchDialog } from './LogPastWatchDialog'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { Button, IconButton, Skeleton, EmptyState } from '@/shared/ui'
import { Plus, Trash2, History as HistoryIcon, Film } from 'lucide-react'
import type { HistoryEvent } from '@/shared/schemas'
import styles from './HistoryPage.module.css'

function formatDayTitle(dateStr: string): string {
  if (dateStr === 'unknown') return 'Unknown Date'
  const d = new Date(`${dateStr}T12:00:00Z`)
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
}

export default function HistoryPage() {
  const { user } = useAuthStore()
  const uid = user?.uid

  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv_episode'>('all')
  const [isLogOpen, setIsLogOpen] = useState(false)

  const historyQuery = useQuery({
    queryKey: ['history', uid],
    queryFn: () => (uid ? fetchHistory(uid) : []),
    enabled: Boolean(uid),
  })

  const rawEvents = historyQuery.data

  // Filter by media type
  const events = useMemo(() => {
    if (!rawEvents) return []
    return rawEvents.filter((ev) => {
      if (typeFilter !== 'all' && ev.type !== typeFilter) return false
      return true
    })
  }, [rawEvents, typeFilter])

  // Group events by day key
  const { dayGroups, totalHours } = useMemo(() => {
    const groups: Record<string, HistoryEvent[]> = {}
    let mins = 0
    events.forEach((ev) => {
      mins += ev.runtimeMinutes || 0
      const dateObj = ev.watchedAt && typeof ev.watchedAt.toDate === 'function' ? ev.watchedAt.toDate() : null
      const dayKey = dateObj ? dateObj.toISOString().slice(0, 10) : 'unknown'
      if (!groups[dayKey]) groups[dayKey] = []
      groups[dayKey].push(ev)
    })
    return {
      dayGroups: groups,
      totalHours: (mins / 60).toFixed(1),
    }
  }, [events])

  const handleDelete = async (event: HistoryEvent) => {
    if (!uid) return
    await deleteHistoryEventWithUndo(uid, event)
    historyQuery.refetch()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>Watch History</h1>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsLogOpen(true)}
          >
            Log Past Watch
          </Button>
        </div>

        {/* Monthly Summary Banner */}
        <div className={styles.monthlyStatsBanner}>
          <div className={styles.statItem}>
            <span className={styles.statVal}>{events.length}</span>
            <span className={styles.statLabel}>Items Logged</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statVal}>{totalHours}h</span>
            <span className={styles.statLabel}>Watch Time</span>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.controlsBar}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'movie' | 'tv_episode')}
            style={{
              height: '36px',
              padding: '0 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-overlay)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-1)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
            }}
            aria-label="Filter history by media type"
          >
            <option value="all">All Types</option>
            <option value="movie">Movies Only</option>
            <option value="tv_episode">TV Episodes Only</option>
          </select>
        </div>
      </div>

      {/* History Timeline */}
      {historyQuery.isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={74} style={{ borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : Object.keys(dayGroups).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {Object.entries(dayGroups).map(([dayKey, dayEvents]) => (
            <div key={dayKey} className={styles.dayGroup}>
              <h2 className={styles.dayTitle}>{formatDayTitle(dayKey)}</h2>
              {dayEvents.map((ev) => {
                const poster = getPosterUrl(ev.posterPath, 'w92')
                return (
                  <div key={ev.eventId} className={styles.historyRow}>
                    <div className={styles.posterThumb}>
                      {poster ? (
                        <img src={poster} alt="" className={styles.posterImg} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)' }}>
                          <Film size={18} />
                        </div>
                      )}
                    </div>

                    <div className={styles.rowInfo}>
                      <div className={styles.rowTitle}>
                        {ev.title}
                        {ev.episodeLabel && (
                          <span style={{ marginLeft: '8px', color: 'var(--accent-text)', fontSize: 'var(--font-size-sm)' }}>
                            {ev.episodeLabel}
                          </span>
                        )}
                      </div>
                      <div className={styles.rowMeta}>
                        <span>{ev.runtimeMinutes}m</span>
                        {ev.rating && <span>Rated {ev.rating}</span>}
                        <span>{ev.type === 'movie' ? 'Movie' : 'TV'}</span>
                      </div>
                    </div>

                    <IconButton
                      icon={<Trash2 size={16} />}
                      aria-label={`Delete history entry for ${ev.title}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ev)}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<HistoryIcon size={40} />}
          title="No watch history yet"
          description="Log past watches or mark titles and episodes watched to build your timeline."
          action={
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setIsLogOpen(true)}>
              Log Your First Watch
            </Button>
          }
        />
      )}

      <LogPastWatchDialog
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        onSuccess={() => historyQuery.refetch()}
      />
    </div>
  )
}
