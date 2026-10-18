import { useState, type ChangeEvent } from 'react'
import { Star, Calendar, Tv, Users, ChevronRight } from 'lucide-react'
import type { TitleDetails } from '@/shared/schemas/title'
import { getProfileUrl } from '@/services/tmdb/images'
import { Card } from '@/shared/ui/layout/Card'
import { FALLBACK_PROVIDERS } from './titleTypes'

interface TitleOverviewTabProps {
  details: TitleDetails
  entry: any | null
  isMovie: boolean
  localNotes: string
  isSavingNotes: boolean
  onNotesChange: (notes: string) => void
  onRatingSelect: (rating: number) => void
  onAddDate: (e: ChangeEvent<HTMLInputElement>) => void
  onSelectCastTab: () => void
}

export function TitleOverviewTab({
  details,
  entry,
  isMovie,
  localNotes,
  isSavingNotes,
  onNotesChange,
  onRatingSelect,
  onAddDate,
  onSelectCastTab,
}: TitleOverviewTabProps) {
  const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(true)

  const director = details.crew?.find((c) => c.job === 'Director')?.name || null
  const writer = details.crew?.find((c) => c.job === 'Writer' || c.job === 'Screenplay')?.name || null
  const creators = details.tv?.creators?.map((c) => c.name).join(', ') || null
  const spokenLanguage = details.originalLanguage ? details.originalLanguage.toUpperCase() : 'EN'

  const addedDate = entry?.addedAt && typeof (entry.addedAt as any).toDate === 'function'
    ? (entry.addedAt as any).toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const watchedDate = entry?.completedAt && typeof (entry.completedAt as any).toDate === 'function'
    ? (entry.completedAt as any).toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const ratedLabel = entry?.rating ? `${entry.rating} / 10` : 'Not rated yet'
  const isOverviewLong = (details.overview?.length || 0) > 280

  const streamProviders = details.providers?.flatrate || []
  const hasLiveProviders = streamProviders.length > 0

  return (
    <div className="title-overview-grid">
      {/* Left Column: Synopsis, Journal & Cast Preview */}
      <div className="title-overview-main-col">
        {/* Plot Synopsis Card */}
        <Card className="title-section-card">
          <div className="title-card-header">
            <h3 className="title-card-heading">Storyline</h3>
          </div>
          <p className="title-overview-text">
            {isOverviewLong && isOverviewCollapsed
              ? `${details.overview.slice(0, 280)}...`
              : details.overview || 'No overview synopsis available for this title.'}
          </p>
          {isOverviewLong && (
            <button
              className="title-read-more-btn"
              onClick={() => setIsOverviewCollapsed(!isOverviewCollapsed)}
              type="button"
            >
              {isOverviewCollapsed ? 'Read full overview' : 'Show less'}
            </button>
          )}
        </Card>

        {/* Personal Tracking & Journal (Only if in Library) */}
        {entry && (
          <Card className="title-section-card title-journal-card">
            <div className="title-card-header">
              <h3 className="title-card-heading">Your Watch Journal</h3>
              <span className="title-journal-status-pill">
                In Library ({entry.status ? entry.status.replace('_', ' ') : 'Saved'})
              </span>
            </div>

            {/* 10-Star Interactive Rating */}
            <div className="title-rating-interactive-block" id="personal-rating-section">
              <div className="title-rating-header">
                <span className="title-field-label">Personal Rating</span>
                {entry.rating ? (
                  <span className="title-rating-score-highlight">
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    <strong>{entry.rating}</strong> / 10
                  </span>
                ) : (
                  <span className="title-field-muted">Click a star to rate</span>
                )}
              </div>
              <div className="title-stars-row">
                {Array.from({ length: 10 }).map((_, i) => {
                  const starVal = i + 1
                  const isFilled = (entry.rating ?? 0) >= starVal
                  return (
                    <button
                      key={starVal}
                      className="title-star-btn"
                      onClick={() => onRatingSelect(starVal)}
                      aria-label={`Rate ${starVal} of 10 stars`}
                      type="button"
                    >
                      <Star
                        size={22}
                        fill={isFilled ? '#f59e0b' : 'none'}
                        color={isFilled ? '#f59e0b' : 'rgba(255, 255, 255, 0.25)'}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Personal Notes */}
            <div className="title-notes-block">
              <div className="title-notes-header">
                <label htmlFor="title-personal-notes" className="title-field-label">Personal Notes</label>
                <span className="title-notes-autosave">
                  {isSavingNotes ? 'Saving...' : 'Saved to cloud'} · {localNotes.length} chars
                </span>
              </div>
              <textarea
                id="title-personal-notes"
                className="title-notes-textarea"
                value={localNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Log your thoughts, favorite quotes, or watch impressions..."
                rows={3}
              />
            </div>

            {/* Watch Timeline */}
            <div className="title-timeline-block">
              <span className="title-field-label">Viewing History</span>
              <div className="title-timeline-grid">
                <div className="title-timeline-tile">
                  <span className="title-timeline-tile-lbl">Added</span>
                  <span className="title-timeline-tile-val">{addedDate || 'In Library'}</span>
                </div>
                <div className="title-timeline-tile">
                  <span className="title-timeline-tile-lbl">Completed</span>
                  <span className="title-timeline-tile-val">{watchedDate || 'Not yet'}</span>
                </div>
                <div className="title-timeline-tile">
                  <span className="title-timeline-tile-lbl">Rating</span>
                  <span className="title-timeline-tile-val">{ratedLabel}</span>
                </div>
              </div>

              {/* Add watch date button */}
              <div className="title-add-date-wrapper">
                <button className="title-add-date-btn" type="button">
                  <Calendar size={14} />
                  <span>+ Log watch date</span>
                  <input
                    type="date"
                    className="title-add-date-input"
                    onChange={onAddDate}
                    max={new Date().toISOString().slice(0, 10)}
                    aria-label="Select watch date"
                  />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Top Cast Highlight Rail */}
        {details.cast && details.cast.length > 0 && (
          <Card className="title-section-card">
            <div className="title-card-header">
              <h3 className="title-card-heading">Top Billed Cast</h3>
              <button
                className="title-section-link-btn"
                onClick={onSelectCastTab}
                type="button"
              >
                <span>Full Cast & Crew</span>
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="title-cast-preview-row">
              {details.cast.slice(0, 6).map((actor) => {
                const avatar = actor.profilePath ? getProfileUrl(actor.profilePath, 'w185') : null
                return (
                  <div key={actor.id} className="title-cast-preview-tile">
                    <div className="title-cast-avatar-box">
                      {avatar ? (
                        <img src={avatar} alt={actor.name} className="title-cast-avatar-img" />
                      ) : (
                        <div className="title-cast-avatar-fallback">
                          <Users size={20} />
                        </div>
                      )}
                    </div>
                    <div className="title-cast-name-text">{actor.name}</div>
                    <div className="title-cast-char-text">{actor.character || 'Actor'}</div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Right Column: Providers & Detailed Metadata */}
      <div className="title-overview-side-col">
        {/* Where to Stream Card */}
        <Card className="title-section-card">
          <div className="title-card-header">
            <h3 className="title-card-heading">Where to Stream</h3>
          </div>
          {hasLiveProviders ? (
            <div className="title-providers-chips-list">
              {streamProviders.map((p) => (
                <div key={p.id} className="title-provider-badge">
                  {p.logoPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${p.logoPath}`}
                      alt={p.name}
                      className="title-provider-logo"
                    />
                  ) : (
                    <Tv size={16} />
                  )}
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="title-providers-chips-list">
              {FALLBACK_PROVIDERS.map((fp) => (
                <div
                  key={fp.name}
                  className="title-provider-badge"
                  style={{ borderLeft: `3px solid ${fp.color}` }}
                >
                  <Tv size={14} />
                  <span>{fp.name}</span>
                </div>
              ))}
            </div>
          )}
          <p className="title-card-footnote">Availability may vary by region or subscription</p>
        </Card>

        {/* Detailed Metadata Card */}
        <Card className="title-section-card">
          <div className="title-card-header">
            <h3 className="title-card-heading">Information</h3>
          </div>
          <div className="title-meta-details-list">
            {[
              director ? { lbl: 'Director', val: director } : null,
              creators ? { lbl: 'Creators', val: creators } : null,
              writer ? { lbl: 'Writer', val: writer } : null,
              { lbl: 'Type', val: isMovie ? 'Feature Film' : 'TV Series' },
              { lbl: 'Status', val: details.status || 'Released' },
              { lbl: 'Original Language', val: spokenLanguage },
              details.tv ? { lbl: 'Seasons', val: `${details.tv.totalSeasons} (${details.tv.totalEpisodes || 0} eps)` } : null,
            ].filter(Boolean).map((item: any, idx) => (
              <div key={idx} className="title-meta-detail-item">
                <span className="title-meta-detail-lbl">{item.lbl}</span>
                <span className="title-meta-detail-val">{item.val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
