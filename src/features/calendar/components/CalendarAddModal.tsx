import { X, Search, Film } from 'lucide-react'
import { Button } from '@/shared/ui/Button/Button'
import { getImageUrl } from '@/services/tmdb/images'

interface CalendarAddModalProps {
  isOpen: boolean
  onClose: () => void
  addMode: 'watched' | 'planned'
  targetDateStr: string
  setTargetDateStr: (d: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  isSearchLoading: boolean
  searchResults: any[]
  selectedMedia: any
  setSelectedMedia: (m: any) => void
  planNote: string
  setPlanNote: (n: string) => void
  onSubmit: () => void
}

export function CalendarAddModal({
  isOpen,
  onClose,
  addMode,
  targetDateStr,
  setTargetDateStr,
  searchQuery,
  setSearchQuery,
  isSearchLoading,
  searchResults,
  selectedMedia,
  setSelectedMedia,
  planNote,
  setPlanNote,
  onSubmit,
}: CalendarAddModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <header className="review-modal-header">
          <h2 className="review-modal-title">
            {addMode === 'watched' ? 'Log Watch' : 'Plan Watch'}
          </h2>
          <button className="btn-close-modal" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </header>

        <div className="review-modal-body">
          <div>
            <label className="sort-label">Date</label>
            <input
              type="date"
              value={targetDateStr}
              onChange={(e) => setTargetDateStr(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-control)',
                background: 'var(--surface-page)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: 'var(--fs-small)',
                marginTop: 4,
              }}
            />
          </div>

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
                <div style={{ fontSize: 12, color: 'var(--brand-primary)' }}>Selected ✓</div>
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
                  borderRadius: 'var(--radius-control)',
                  background: 'var(--surface-page)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--fs-small)',
                  marginTop: 4,
                }}
              />
            </div>
          )}
        </div>

        <footer className="review-modal-footer">
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={!selectedMedia}
            style={{ width: '100%' }}
          >
            {addMode === 'watched' ? 'Log Watch' : 'Add to Plan'}
          </Button>
        </footer>
      </div>
    </div>
  )
}
