import { BottomSheet } from '@/shared/ui/BottomSheet/BottomSheet'

export type SortKey = 'addedAt' | 'title' | 'rating' | 'year' | 'runtime'

interface WatchlistFilterSheetProps {
  isOpen: boolean
  onClose: () => void
  tempSortBy: SortKey
  setTempSortBy: (k: SortKey) => void
  tempFilterType: 'all' | 'movie' | 'tv'
  setTempFilterType: (t: 'all' | 'movie' | 'tv') => void
  availableGenres: string[]
  tempGenres: string[]
  onGenreToggle: (g: string) => void
  onApply: () => void
  onReset: () => void
}

export function WatchlistFilterSheet({
  isOpen,
  onClose,
  tempSortBy,
  setTempSortBy,
  tempFilterType,
  setTempFilterType,
  availableGenres,
  tempGenres,
  onGenreToggle,
  onApply,
  onReset,
}: WatchlistFilterSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} label="Filter & Sort Watchlist">
      <div className="wl-filter-sheet-body">
        <div className="wl-filter-section">
          <h4 className="wl-filter-heading">Sort By</h4>
          <div className="wl-filter-radio-group">
            {[
              { id: 'addedAt', label: 'Date Added (Newest First)' },
              { id: 'rating', label: 'Highest Rating' },
              { id: 'title', label: 'Title (A-Z)' },
              { id: 'year', label: 'Release Year' },
              { id: 'runtime', label: 'Runtime Length' },
            ].map((opt) => (
              <label key={opt.id} className="wl-filter-radio-lbl">
                <input
                  type="radio"
                  name="wl-sort"
                  className="wl-filter-radio-input"
                  checked={tempSortBy === opt.id}
                  onChange={() => setTempSortBy(opt.id as SortKey)}
                />
                <span className="wl-filter-radio-custom" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="wl-filter-section">
          <h4 className="wl-filter-heading">Media Type</h4>
          <div className="wl-filter-pills-row">
            {(['all', 'movie', 'tv'] as const).map((t) => (
              <button
                key={t}
                className={`wl-filter-pill-btn ${tempFilterType === t ? 'wl-filter-pill-btn--active' : ''}`}
                onClick={() => setTempFilterType(t)}
                type="button"
              >
                {t === 'all' ? 'All Types' : t === 'movie' ? 'Movies Only' : 'TV Shows Only'}
              </button>
            ))}
          </div>
        </div>

        {availableGenres.length > 0 && (
          <div className="wl-filter-section">
            <h4 className="wl-filter-heading">Genres</h4>
            <div className="wl-filter-genre-grid">
              {availableGenres.map((g) => {
                const isActive = tempGenres.includes(g)
                return (
                  <button
                    key={g}
                    className={`wl-filter-genre-chip ${isActive ? 'wl-filter-genre-chip--active' : ''}`}
                    onClick={() => onGenreToggle(g)}
                    type="button"
                  >
                    {g}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="wl-filter-actions">
          <button className="wl-filter-apply-btn" onClick={onApply} type="button">
            Apply Filters
          </button>
          <button className="wl-filter-reset-btn" onClick={onReset} type="button">
            Reset All
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
