import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film, Heart, Star } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { getBackdropUrl, getPosterUrl } from '@/shared/lib/tmdbImage'
import type { LibraryEntry, LibraryStatus } from '@/shared/schemas'

const STATUS_LABELS: Record<LibraryStatus, string> = {
  watching: 'Watching',
  completed: 'Completed',
  plan_to_watch: 'Plan to Watch',
  on_hold: 'On Hold',
  dropped: 'Dropped',
}

const STATUS_COLORS: Record<LibraryStatus, string> = {
  watching: 'var(--status-watching)',
  completed: 'var(--status-completed)',
  plan_to_watch: 'var(--status-plan)',
  on_hold: 'var(--status-on-hold, #f39c12)',
  dropped: 'var(--status-dropped)',
}

interface WatchlistSmartViewProps {
  smartSections: {
    watchSoon: LibraryEntry[]
    thisWeekend: LibraryEntry[]
    waitingForRelease: LibraryEntry[]
    maybeLater: LibraryEntry[]
  }
  onToggleFavorite: (e: React.MouseEvent, entry: LibraryEntry) => void
}

export function WatchlistSmartView({ smartSections, onToggleFavorite }: WatchlistSmartViewProps) {
  const navigate = useNavigate()
  const [activeSmartTab, setActiveSmartTab] = useState<'watchSoon' | 'thisWeekend' | 'waitingForRelease' | 'maybeLater'>('watchSoon')

  const renderSmartCard = (entry: LibraryEntry) => {
    const backdropUrl = getBackdropUrl(entry.backdropPath, 'w780')
    const posterFallback = getPosterUrl(entry.posterPath, 'w342')
    const displayImg = backdropUrl || posterFallback

    return (
      <div
        key={entry.titleKey}
        className="wl-smart-card"
        onClick={() => navigate(`/title/${entry.titleKey}`)}
      >
        <div className="wl-smart-card-top">
          {displayImg ? (
            <img src={displayImg} alt={entry.title} className="wl-smart-card-img" loading="lazy" />
          ) : (
            <div className="wl-smart-card-img-ph">
              <Film size={24} />
            </div>
          )}
          <div className="wl-smart-card-overlay" />

          <span
            className="wl-smart-card-status-badge"
            style={{ background: STATUS_COLORS[entry.status] }}
          >
            {STATUS_LABELS[entry.status]}
          </span>

          {entry.rating != null && (
            <span className="wl-smart-card-rating-badge">
              ⭐ {entry.rating.toFixed(1)}
            </span>
          )}

          <button
            className={`wl-smart-card-heart ${entry.isFavorite ? 'wl-smart-card-heart--active' : ''}`}
            onClick={(e) => onToggleFavorite(e, entry)}
            aria-label={entry.isFavorite ? 'Remove favorite' : 'Add favorite'}
            type="button"
          >
            <Heart size={14} fill={entry.isFavorite ? 'currentColor' : 'none'} />
          </button>

          <div className="wl-smart-card-title-block">
            <h4 className="wl-smart-card-title">{entry.title}</h4>
            <span className="wl-smart-card-year">
              {entry.year || '—'} · {entry.type === 'tv' ? 'TV Series' : 'Movie'}
            </span>
          </div>
        </div>

        <div className="wl-smart-card-bottom">
          <div className="wl-smart-card-genres">
            {entry.genres?.slice(0, 3).map((g) => (
              <span key={g.id || g.name} className="wl-smart-genre-chip">
                {g.name}
              </span>
            ))}
          </div>

          <div className="wl-smart-card-footer">
            <div className="wl-smart-stars">
              {entry.rating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--star-filled, #f5c518)' }}>
                  <Star size={12} fill="currentColor" />
                  <span>{entry.rating.toFixed(1)}</span>
                </div>
              ) : null}
            </div>
            <span className="wl-smart-added-date">
              {entry.runtimeMinutes ? `${entry.runtimeMinutes}m` : ''}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="wl-status-tabs-row wl-status-tabs-row--mobile-only">
        {[
          { id: 'watchSoon', label: 'Watch Soon', count: smartSections.watchSoon.length },
          { id: 'thisWeekend', label: 'This Weekend', count: smartSections.thisWeekend.length },
          { id: 'waitingForRelease', label: 'Upcoming', count: smartSections.waitingForRelease.length },
          { id: 'maybeLater', label: 'Maybe Later', count: smartSections.maybeLater.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSmartTab(tab.id as any)}
            className={`wl-status-tab-btn ${activeSmartTab === tab.id ? 'wl-status-tab-btn--active' : ''}`}
            type="button"
          >
            {tab.label}
            <span className="wl-status-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--card-gap)',
          width: '100%',
        }}
      >
        <Card
          className={activeSmartTab === 'watchSoon' ? undefined : 'wl-smart-column--hidden-mobile'}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="wl-column-title">Watch Soon</h3>
            <span className="wl-column-badge">{smartSections.watchSoon.length} titles</span>
          </div>
          <div className="wl-column-cards-list">
            {smartSections.watchSoon.length === 0 ? (
              <p className="wl-column-empty">No high priority titles</p>
            ) : (
              smartSections.watchSoon.map(renderSmartCard)
            )}
          </div>
        </Card>

        <Card
          className={activeSmartTab === 'thisWeekend' ? undefined : 'wl-smart-column--hidden-mobile'}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="wl-column-title">This Weekend</h3>
            <span className="wl-column-badge">{smartSections.thisWeekend.length} titles</span>
          </div>
          <div className="wl-column-cards-list">
            {smartSections.thisWeekend.length === 0 ? (
              <p className="wl-column-empty">No short titles saved</p>
            ) : (
              smartSections.thisWeekend.map(renderSmartCard)
            )}
          </div>
        </Card>

        <Card
          className={activeSmartTab === 'waitingForRelease' ? undefined : 'wl-smart-column--hidden-mobile'}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="wl-column-title">Waiting For Release</h3>
            <span className="wl-column-badge">{smartSections.waitingForRelease.length} titles</span>
          </div>
          <div className="wl-column-cards-list">
            {smartSections.waitingForRelease.length === 0 ? (
              <p className="wl-column-empty">No upcoming titles</p>
            ) : (
              smartSections.waitingForRelease.map(renderSmartCard)
            )}
          </div>
        </Card>

        <Card
          className={activeSmartTab === 'maybeLater' ? undefined : 'wl-smart-column--hidden-mobile'}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="wl-column-title">Maybe Later</h3>
            <span className="wl-column-badge">{smartSections.maybeLater.length} titles</span>
          </div>
          <div className="wl-column-cards-list">
            {smartSections.maybeLater.length === 0 ? (
              <p className="wl-column-empty">No backlogged titles</p>
            ) : (
              smartSections.maybeLater.map(renderSmartCard)
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
