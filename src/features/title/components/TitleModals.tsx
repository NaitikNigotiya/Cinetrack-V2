import { useNavigate } from 'react-router-dom'
import { Check, Trash2, FolderOpen } from 'lucide-react'
import type { LibraryStatus, Collection } from '@/shared/schemas'
import type { TitleDetails } from '@/shared/schemas/title'
import { getPosterUrl } from '@/services/tmdb/images'
import { BottomSheet, TrailerModal } from '@/shared/ui'
import { STATUS_OPTS, type UserReview } from './titleTypes'
import { Button } from '@/shared/ui/Button/Button'
import { TitleLightboxModal } from './TitleLightboxModal'

interface TitleModalsProps {
  details: TitleDetails
  entry: any | null
  isMovie: boolean
  showStatusSheet: boolean
  setShowStatusSheet: (open: boolean) => void
  onStatusChange: (status: LibraryStatus) => void
  onRemoveFromLibrary: () => void

  showAddSheet: boolean
  setShowAddSheet: (open: boolean) => void
  selectedStatus: LibraryStatus
  setSelectedStatus: (status: LibraryStatus) => void
  onAddToWatchlist: (status: LibraryStatus) => void

  showCollectionSheet: boolean
  setShowCollectionSheet: (open: boolean) => void
  userCollections: Collection[]
  onAddToCollection: (collectionId: string) => void

  isReviewSheetOpen: boolean
  setIsReviewSheetOpen: (open: boolean) => void
  editingReview: UserReview | null
  revTitle: string
  setRevTitle: (t: string) => void
  revRating: number
  setRevRating: (r: number) => void
  revText: string
  setRevText: (t: string) => void
  revTags: string
  setRevTags: (t: string) => void
  onSaveReview: () => void

  lightboxIndex: number | null
  setLightboxIndex: (idx: number | null) => void
  images: any[]

  showTrailer: boolean
  setShowTrailer: (open: boolean) => void
  trailerKey: string | null
}

export function TitleModals({
  details,
  entry,
  isMovie,
  showStatusSheet,
  setShowStatusSheet,
  onStatusChange,
  onRemoveFromLibrary,
  showAddSheet,
  setShowAddSheet,
  selectedStatus,
  setSelectedStatus,
  onAddToWatchlist,
  showCollectionSheet,
  setShowCollectionSheet,
  userCollections,
  onAddToCollection,
  isReviewSheetOpen,
  setIsReviewSheetOpen,
  editingReview,
  revTitle,
  setRevTitle,
  revRating,
  setRevRating,
  revText,
  setRevText,
  revTags,
  setRevTags,
  onSaveReview,
  lightboxIndex,
  setLightboxIndex,
  images,
  showTrailer,
  setShowTrailer,
  trailerKey,
}: TitleModalsProps) {
  const navigate = useNavigate()
  const poster = details.posterPath ? getPosterUrl(details.posterPath, 'w185') : null

  return (
    <>
      {/* 1. Watch Status Sheet */}
      <BottomSheet isOpen={showStatusSheet} onClose={() => setShowStatusSheet(false)}>
        <div className="title-sheet-content">
          <h3 className="title-sheet-heading">Update Watch Status</h3>
          <div className="title-status-options-list">
            {STATUS_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`title-status-opt-btn ${entry?.status === opt.value ? 'title-status-opt-btn--active' : ''}`}
                onClick={() => {
                  onStatusChange(opt.value)
                  setShowStatusSheet(false)
                }}
              >
                <span className="title-status-opt-emoji">{opt.emoji}</span>
                <div className="title-status-opt-texts">
                  <div className="title-status-opt-label">{opt.label}</div>
                  <div className="title-status-opt-desc">{opt.desc}</div>
                </div>
                {entry?.status === opt.value && <Check size={18} color="var(--color-brand)" />}
              </button>
            ))}
          </div>

          <div className="title-sheet-danger-action">
            <Button
              variant="danger"
              leftIcon={<Trash2 size={15} />}
              onClick={() => {
                onRemoveFromLibrary()
                setShowStatusSheet(false)
              }}
              style={{ width: '100%' }}
            >
              Remove from Library
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* 2. Add to Watchlist Sheet */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)}>
        <div className="title-sheet-content">
          <div className="title-sheet-title-preview">
            {poster && (
              <img src={poster} alt={details.title} className="title-sheet-thumb-img" />
            )}
            <div>
              <div className="title-sheet-thumb-title">{details.title}</div>
              <div className="title-sheet-thumb-sub">
                {details.year} · {isMovie ? 'Feature Film' : 'TV Series'}
              </div>
            </div>
          </div>

          <h4 className="title-sheet-subheading">Select Watch Status</h4>
          <div className="title-status-grid-2col">
            {STATUS_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`title-status-grid-tile ${selectedStatus === opt.value ? 'title-status-grid-tile--active' : ''}`}
                onClick={() => setSelectedStatus(opt.value)}
              >
                <span className="title-status-opt-emoji">{opt.emoji}</span>
                <span className="title-status-grid-label">{opt.label}</span>
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            onClick={() => {
              onAddToWatchlist(selectedStatus)
              setShowAddSheet(false)
            }}
            style={{ width: '100%', marginTop: '16px' }}
          >
            Add to Library
          </Button>
        </div>
      </BottomSheet>

      {/* 3. Add to Collection Sheet */}
      <BottomSheet isOpen={showCollectionSheet} onClose={() => setShowCollectionSheet(false)}>
        <div className="title-sheet-content">
          <h3 className="title-sheet-heading">Add to Collection</h3>
          <div className="title-collections-picker-list">
            {userCollections.length === 0 ? (
              <div className="title-collections-picker-empty">
                <p>No custom collections created yet.</p>
                <button
                  type="button"
                  className="title-collections-link-btn"
                  onClick={() => {
                    setShowCollectionSheet(false)
                    navigate('/collections')
                  }}
                >
                  Create your first collection →
                </button>
              </div>
            ) : (
              userCollections.map((col) => (
                <button
                  key={col.id || col.name}
                  type="button"
                  className="title-collection-item-row"
                  onClick={() => col.id && onAddToCollection(col.id)}
                >
                  <FolderOpen size={18} color="var(--color-brand)" />
                  <div className="title-collection-item-info">
                    <div className="title-collection-item-name">{col.name}</div>
                    <div className="title-collection-item-count">{col.items?.length || 0} titles</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </BottomSheet>

      {/* 4. Write/Edit Review Sheet */}
      <BottomSheet
        isOpen={isReviewSheetOpen}
        onClose={() => setIsReviewSheetOpen(false)}
        label="Write review"
      >
        <div className="title-sheet-content">
          <h3 className="title-sheet-heading">{editingReview ? 'Edit Review' : 'Write a Review'}</h3>

          <div className="title-review-form-fields">
            <div>
              <label className="title-field-label">Headline / Title</label>
              <input
                type="text"
                value={revTitle}
                onChange={(e) => setRevTitle(e.target.value)}
                placeholder="e.g. A visual masterpiece!, Gripping thriller"
                className="title-form-input"
              />
            </div>

            <div>
              <div className="title-review-slider-header">
                <label className="title-field-label">Your Rating</label>
                <span className="title-review-slider-val">{revRating} / 10 ⭐</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={revRating}
                onChange={(e) => setRevRating(Number(e.target.value))}
                className="title-form-range"
              />
            </div>

            <div>
              <label className="title-field-label">Review Thoughts</label>
              <textarea
                value={revText}
                onChange={(e) => setRevText(e.target.value)}
                placeholder="Share your full critique, favorite moments, and takeaways..."
                className="title-form-textarea"
                rows={4}
              />
            </div>

            <div>
              <label className="title-field-label">Tags (comma-separated)</label>
              <input
                type="text"
                value={revTags}
                onChange={(e) => setRevTags(e.target.value)}
                placeholder="e.g. suspense, cinematography, oscars"
                className="title-form-input"
              />
            </div>

            <Button
              variant="primary"
              onClick={onSaveReview}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Save Review
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* 5. Lightbox Modal */}
      <TitleLightboxModal
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
        images={images}
      />

      {/* 6. Trailer Modal */}
      <TrailerModal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        videoKey={trailerKey}
        title={details.title}
      />
    </>
  )
}
