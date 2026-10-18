import { Search, Film } from 'lucide-react'
import { BottomSheet } from '@/shared/ui/BottomSheet/BottomSheet'
import { getImageUrl } from '@/services/tmdb/images'
import type { LibraryEntry } from '@/shared/schemas'

interface CollectionCreateModalProps {
  isOpen: boolean
  onClose: () => void
  name: string
  setName: (v: string) => void
  description: string
  setDescription: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
}

export function CollectionCreateModal({
  isOpen,
  onClose,
  name,
  setName,
  description,
  setDescription,
  onSubmit,
  isPending,
}: CollectionCreateModalProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} label="Create a new collection">
      <form onSubmit={onSubmit} className="dp-add-sheet">
        <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>Create New Collection</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: 6,
                display: 'block',
              }}
            >
              Collection Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cozy Rain Favorites"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                background: 'var(--surface-card)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: 6,
                display: 'block',
              }}
            >
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this collection about?"
              style={{
                width: '100%',
                height: 80,
                padding: '10px 14px',
                borderRadius: 'var(--radius-control)',
                background: 'var(--surface-card)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: 14,
                resize: 'none',
              }}
            />
          </div>
          <button
            className="dp-confirm-btn"
            type="submit"
            disabled={isPending}
            style={{ marginTop: 8 }}
          >
            {isPending ? 'Creating…' : 'Create Collection'}
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}

interface CollectionAddTitlesSheetProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  setSearchQuery: (v: string) => void
  candidateTitles: LibraryEntry[]
  onAddTitle: (item: { titleKey: string; title: string; posterPath: string | null; type: 'movie' | 'tv' }) => void
}

export function CollectionAddTitlesSheet({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  candidateTitles,
  onAddTitle,
}: CollectionAddTitlesSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} label="Add titles to collection">
      <div className="dp-add-sheet">
        <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>Add Titles</p>
        <div
          className="sp-input-wrap"
          style={{
            margin: '0 0 16px 0',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-control)',
            padding: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-card)',
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your library..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              padding: '10px 10px',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        <div className="col-search-results-list">
          {candidateTitles.length > 0 ? (
            candidateTitles.map((item) => {
              const poster = getImageUrl(item.posterPath, 'w200')
              return (
                <div key={item.titleKey} className="col-search-row">
                  {poster ? (
                    <img src={poster} alt={item.title} className="col-search-thumb" />
                  ) : (
                    <div className="col-search-thumb-ph">
                      <Film size={12} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{item.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      {item.type === 'movie' ? 'Movie' : 'TV Show'} · {item.year ?? '—'}
                    </p>
                  </div>
                  <button
                    className="col-add-candidate-btn"
                    onClick={() =>
                      onAddTitle({
                        titleKey: item.titleKey,
                        title: item.title,
                        posterPath: item.posterPath,
                        type: item.type,
                      })
                    }
                    type="button"
                  >
                    + Add
                  </button>
                </div>
              )
            })
          ) : (
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '24px 0',
              }}
            >
              {searchQuery ? 'No matching titles found in library.' : 'Search your library to add titles.'}
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
