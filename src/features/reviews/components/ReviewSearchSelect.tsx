import { Search, Film, X } from 'lucide-react'
import { getImageUrl } from '@/services/tmdb/images'

export interface SelectedTitle {
  titleKey: string
  title: string
  posterPath: string | null
  year?: number
}

interface ReviewSearchSelectProps {
  selectedTitle: SelectedTitle | null
  onSelectTitle: (t: SelectedTitle | null) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  searchResults: any[]
  isSearchLoading: boolean
  isEditing: boolean
}

export function ReviewSearchSelect({
  selectedTitle,
  onSelectTitle,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearchLoading,
  isEditing,
}: ReviewSearchSelectProps) {
  if (selectedTitle) {
    return (
      <div className="selected-title-badge animate-fade-in">
        {selectedTitle.posterPath ? (
          <img
            src={getImageUrl(selectedTitle.posterPath, 'w200') || ''}
            alt={selectedTitle.title}
            className="selected-title-poster"
          />
        ) : (
          <div
            className="selected-title-poster"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-overlay)',
            }}
          >
            <Film size={16} color="var(--text-muted)" />
          </div>
        )}
        <div className="selected-title-info">
          <div className="selected-title-name">{selectedTitle.title}</div>
          {selectedTitle.year && selectedTitle.year > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {selectedTitle.year}
            </div>
          )}
        </div>
        {!isEditing && (
          <button
            className="btn-review-action"
            onClick={() => onSelectTitle(null)}
            aria-label="Remove selection"
            type="button"
          >
            <X size={16} />
          </button>
        )}
      </div>
    )
  }

  return (
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
          placeholder="Search movie or TV show title..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
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
              const resYear = res.release_date
                ? new Date(res.release_date).getFullYear()
                : res.first_air_date
                ? new Date(res.first_air_date).getFullYear()
                : 0
              const poster = getImageUrl(res.poster_path, 'w200')
              return (
                <div
                  key={`${res.media_type}:${res.id}`}
                  className="search-dropdown-item"
                  onClick={() =>
                    onSelectTitle({
                      titleKey: `${res.media_type || 'movie'}:${res.id}`,
                      title: name,
                      posterPath: res.poster_path ?? null,
                      year: resYear,
                    })
                  }
                >
                  {poster ? (
                    <img src={poster} alt={name} className="search-dropdown-poster" />
                  ) : (
                    <div
                      className="search-dropdown-poster"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-overlay)',
                      }}
                    >
                      <Film size={12} color="var(--text-muted)" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {res.media_type === 'movie' ? 'Movie' : 'TV Show'}{' '}
                      {resYear > 0 ? `(${resYear})` : ''}
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
  )
}
