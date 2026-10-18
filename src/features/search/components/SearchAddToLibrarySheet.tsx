import { Film } from 'lucide-react'
import { BottomSheet } from '@/shared/ui/BottomSheet/BottomSheet'
import { Button } from '@/shared/ui/Button/Button'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import type { NormalisedMediaItem } from '@/services/tmdb/normalize'
import type { LibraryStatus } from '@/shared/schemas'

const STATUS_OPTIONS: { emoji: string; label: string; value: LibraryStatus }[] = [
  { emoji: '👁', label: 'Watching', value: 'watching' },
  { emoji: '✓', label: 'Completed', value: 'completed' },
  { emoji: '🕐', label: 'Plan to Watch', value: 'plan_to_watch' },
  { emoji: '✗', label: 'Dropped', value: 'dropped' },
]

interface SearchAddToLibrarySheetProps {
  item: NormalisedMediaItem | null
  selectedStatus: LibraryStatus
  onSelectStatus: (status: LibraryStatus) => void
  onConfirm: () => void
  onClose: () => void
  isAdding: boolean
}

export function SearchAddToLibrarySheet({
  item,
  selectedStatus,
  onSelectStatus,
  onConfirm,
  onClose,
  isAdding,
}: SearchAddToLibrarySheetProps) {
  if (!item) return null

  const poster = getPosterUrl(item.posterPath, 'w185')

  return (
    <BottomSheet isOpen={item !== null} onClose={onClose} label="Add to library">
      <div className="sp-add-sheet">
        <div className="sp-add-header">
          {poster ? (
            <img src={poster} alt={item.title} className="sp-add-thumb" />
          ) : (
            <div className="sp-add-thumb-placeholder">
              <Film size={20} color="var(--text-muted)" />
            </div>
          )}
          <div className="sp-add-meta">
            <p className="sp-add-title">{item.title}</p>
            <p className="sp-add-year">{item.year ?? '—'}</p>
            <span
              className={`sp-add-type-badge ${
                item.type === 'movie' ? 'sp-add-type-badge--movie' : 'sp-add-type-badge--tv'
              }`}
            >
              {item.type === 'movie' ? 'Movie' : 'TV Show'}
            </span>
          </div>
        </div>

        <div className="sp-status-grid" role="radiogroup" aria-label="Watch status">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`sp-status-btn ${
                selectedStatus === opt.value ? 'sp-status-btn--active' : ''
              }`}
              onClick={() => onSelectStatus(opt.value)}
              role="radio"
              aria-checked={selectedStatus === opt.value}
              type="button"
            >
              <span aria-hidden="true">{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={isAdding}
          style={{ width: '100%', marginTop: 'var(--space-4)' }}
        >
          {isAdding ? 'Adding…' : 'Add to Library'}
        </Button>
      </div>
    </BottomSheet>
  )
}
