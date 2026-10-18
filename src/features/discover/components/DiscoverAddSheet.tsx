import { Film } from 'lucide-react'
import { BottomSheet } from '@/shared/ui/BottomSheet/BottomSheet'
import { Button } from '@/shared/ui/Button/Button'
import { getImageUrl } from '@/services/tmdb/images'
import type { CarouselItem } from '@/shared/ui/ContentCarousel/ContentCarousel'
import type { LibraryStatus } from '@/shared/schemas'

const STATUS_OPTIONS: { emoji: string; label: string; value: LibraryStatus }[] = [
  { emoji: '👁', label: 'Watching', value: 'watching' },
  { emoji: '✓', label: 'Completed', value: 'completed' },
  { emoji: '🕐', label: 'Plan to Watch', value: 'plan_to_watch' },
  { emoji: '✗', label: 'Dropped', value: 'dropped' },
]

interface DiscoverAddSheetProps {
  selectedItem: CarouselItem | null
  selectedStatus: LibraryStatus
  onSelectStatus: (status: LibraryStatus) => void
  onConfirm: () => void
  onClose: () => void
  isAdding: boolean
}

export function DiscoverAddSheet({
  selectedItem,
  selectedStatus,
  onSelectStatus,
  onConfirm,
  onClose,
  isAdding,
}: DiscoverAddSheetProps) {
  if (!selectedItem) return null

  const title = selectedItem.title ?? selectedItem.name ?? 'Untitled'
  const year = (selectedItem.release_date ?? selectedItem.first_air_date)?.slice(0, 4) ?? '—'
  const posterUrl = getImageUrl(selectedItem.poster_path, 'w200')

  return (
    <BottomSheet isOpen={selectedItem !== null} onClose={onClose} label="Add to watchlist">
      <div className="dp-add-sheet">
        <div className="dp-add-header">
          {posterUrl ? (
            <img src={posterUrl} alt={title} className="dp-add-thumb" />
          ) : (
            <div className="dp-add-thumb-ph">
              <Film size={22} color="var(--text-muted)" />
            </div>
          )}
          <div className="dp-add-meta">
            <p className="dp-add-title">{title}</p>
            <p className="dp-add-year">{year}</p>
            {(selectedItem.vote_average ?? 0) > 0 && (
              <p className="dp-add-rating">⭐ {selectedItem.vote_average!.toFixed(1)}</p>
            )}
          </div>
        </div>

        <div className="dp-status-grid" role="radiogroup" aria-label="Watch status">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`dp-status-btn ${selectedStatus === opt.value ? 'dp-status-btn--active' : ''}`}
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
          {isAdding ? 'Adding…' : 'Add to Watchlist'}
        </Button>
      </div>
    </BottomSheet>
  )
}
