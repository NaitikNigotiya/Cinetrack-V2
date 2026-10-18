import { Tv, Film } from 'lucide-react'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import type { TmdbSearchResult } from '@/services/tmdb/schemas'

interface LogPastWatchAutocompleteProps {
  showSuggestions: boolean
  searchResults: TmdbSearchResult[]
  onSelect: (item: TmdbSearchResult) => void
}

export function LogPastWatchAutocomplete({
  showSuggestions,
  searchResults,
  onSelect,
}: LogPastWatchAutocompleteProps) {
  if (!showSuggestions || searchResults.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-3)',
        zIndex: 100,
        maxHeight: '280px',
        overflowY: 'auto',
        padding: '6px',
      }}
    >
      <div style={{ padding: '4px 8px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 700 }}>
        Suggested Titles ({searchResults.length})
      </div>
      {searchResults.map((item) => {
        const posterUrl = getPosterUrl(item.poster_path, 'w92')
        const displayTitle = item.title || item.name || 'Untitled'
        const releaseDate = item.release_date || item.first_air_date
        const year = releaseDate ? releaseDate.slice(0, 4) : ''
        const isTv = item.media_type === 'tv'

        return (
          <div
            key={`${item.media_type}_${item.id}`}
            onClick={() => onSelect(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-overlay)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '52px',
                borderRadius: 'var(--radius-xs)',
                overflow: 'hidden',
                backgroundColor: 'var(--surface-overlay)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {posterUrl ? (
                <img src={posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : isTv ? (
                <Tv size={16} color="var(--text-3)" />
              ) : (
                <Film size={16} color="var(--text-3)" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--text-1)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayTitle}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-3)' }}>
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: isTv ? 'rgba(56, 189, 248, 0.15)' : 'rgba(229, 9, 20, 0.15)',
                    color: isTv ? '#38bdf8' : '#ff4d4d',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {isTv ? 'TV Show' : 'Movie'}
                </span>
                {year && <span>{year}</span>}
                {item.vote_average ? <span>★ {item.vote_average.toFixed(1)}</span> : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
