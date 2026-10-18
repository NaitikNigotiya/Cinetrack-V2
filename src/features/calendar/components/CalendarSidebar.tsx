import { Calendar as CalendarIcon, Film, Trash2 } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'
import { getImageUrl } from '@/services/tmdb/images'
import type { PlannedWatch, LibraryEntry } from '@/shared/schemas'

export interface UpcomingReleaseItem {
  titleKey: string
  title: string
  type: 'movie' | 'tv'
  posterPath: string | null
  releaseDate: string | null
  daysUntil: number
}

interface CalendarSidebarProps {
  selectedDay: Date
  selectedDayKey: string
  todayStr: string
  selectedDayWatched: LibraryEntry[]
  selectedDayPlanned: PlannedWatch[]
  onOpenAddModal: (mode: 'watched' | 'planned') => void
  onDeletePlan: (id: string) => void
  upcomingReleases: UpcomingReleaseItem[]
}

export function CalendarSidebar({
  selectedDay,
  selectedDayKey,
  todayStr,
  selectedDayWatched,
  selectedDayPlanned,
  onOpenAddModal,
  onDeletePlan,
  upcomingReleases,
}: CalendarSidebarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* 1. Day Inspector Card */}
      <Card variant="default">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700, margin: 0 }}>
            {selectedDay.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </h3>
          <span style={{ fontSize: 'var(--fs-stat-label)', color: 'var(--text-muted)' }}>
            {selectedDayKey === todayStr ? 'Today' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Button
            variant="primary"
            size="sm"
            style={{ flex: 1 }}
            onClick={() => onOpenAddModal('watched')}
          >
            + Log Watch
          </Button>
          <Button
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
            onClick={() => onOpenAddModal('planned')}
          >
            + Plan Watch
          </Button>
        </div>

        {selectedDayWatched.length > 0 || selectedDayPlanned.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedDayWatched.map((w) => {
              const poster = getImageUrl(w.posterPath, 'w200')
              return (
                <div
                  key={w.titleKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    background: 'var(--surface-page)',
                    borderRadius: 'var(--radius-control)',
                    borderLeft: '3px solid var(--brand-primary)',
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
                        fontSize: 'var(--fs-small)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {w.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✓ Watched</div>
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
                    gap: '10px',
                    padding: '8px 10px',
                    background: 'var(--surface-page)',
                    borderRadius: 'var(--radius-control)',
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
                        fontSize: 'var(--fs-small)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#00B4D8' }}>
                      📅 {p.note || 'Planned'}
                    </div>
                  </div>
                  <button
                    onClick={() => p.id && onDeletePlan(p.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                    type="button"
                    aria-label="Delete plan"
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
              fontSize: 'var(--fs-small)',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '16px 0',
              margin: 0,
            }}
          >
            No watches or plans for this day.
          </p>
        )}
      </Card>

      {/* 2. Upcoming Releases Card */}
      <Card variant="default">
        <h3
          style={{
            fontSize: 'var(--fs-card-title)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 0 16px 0',
          }}
        >
          <CalendarIcon size={18} color="var(--text-muted)" />
          Upcoming Releases
        </h3>

        {upcomingReleases.length > 0 ? (
          <div className="upcoming-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingReleases.map((item) => {
              const poster = getImageUrl(item.posterPath, 'w200')
              return (
                <article
                  key={item.titleKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    background: 'var(--surface-page)',
                    borderRadius: 'var(--radius-control)',
                  }}
                >
                  {poster ? (
                    <img
                      src={poster}
                      alt={item.title}
                      loading="lazy"
                      style={{ width: 28, height: 42, objectFit: 'cover', borderRadius: 2 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 28,
                        height: 42,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Film size={14} color="var(--text-muted)" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 'var(--fs-small)',
                        fontWeight: 600,
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.title}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                      Releases {item.releaseDate}
                    </span>
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
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: 0 }}>
            No future releases in your Plan to Watch list.
          </p>
        )}
      </Card>
    </div>
  )
}
