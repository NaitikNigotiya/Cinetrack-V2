import { useState, useEffect } from 'react'
import { X, Star } from 'lucide-react'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { ReviewSearchSelect, type SelectedTitle } from './ReviewSearchSelect'
import type { Review } from '@/shared/schemas'

interface ReviewEditorModalProps {
  isOpen: boolean
  onClose: () => void
  editingReview: Review | null
  onSave: (reviewData: {
    titleKey: string
    title: string
    posterPath: string | null
    rating: number | null
    body: string
    containsSpoilers: boolean
  }) => void
  isPending: boolean
}

export function ReviewEditorModal({
  isOpen,
  onClose,
  editingReview,
  onSave,
  isPending,
}: ReviewEditorModalProps) {
  const [selectedTitle, setSelectedTitle] = useState<SelectedTitle | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [reviewText, setReviewText] = useState('')
  const [containsSpoilers, setContainsSpoilers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)

  useEffect(() => {
    if (editingReview) {
      setSelectedTitle({
        titleKey: editingReview.titleKey,
        title: editingReview.title,
        posterPath: editingReview.posterPath,
      })
      setRating(editingReview.rating || 0)
      setReviewText(editingReview.body)
      setContainsSpoilers(editingReview.containsSpoilers || false)
    } else {
      setSelectedTitle(null)
      setRating(0)
      setReviewText('')
      setContainsSpoilers(false)
      setSearchQuery('')
      setSearchResults([])
    }
  }, [editingReview, isOpen])

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchLoading(true)
      try {
        const res = await tmdbClient.searchMulti(searchQuery)
        const filtered = (res.results || []).filter(
          (item: any) => item.media_type === 'movie' || item.media_type === 'tv'
        )
        setSearchResults(filtered)
      } catch {
        // silent
      } finally {
        setIsSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  if (!isOpen) return null

  const isPublishDisabled =
    !selectedTitle || rating === 0 || reviewText.trim().length < 10 || isPending

  const handlePublish = () => {
    if (!selectedTitle || rating === 0 || reviewText.trim().length < 10) return
    onSave({
      titleKey: selectedTitle.titleKey,
      title: selectedTitle.title,
      posterPath: selectedTitle.posterPath,
      rating,
      body: reviewText.trim(),
      containsSpoilers,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <header className="review-modal-header">
          <h2 className="review-modal-title">
            {editingReview ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button className="btn-close-modal" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </header>

        <div className="review-modal-body">
          <ReviewSearchSelect
            selectedTitle={selectedTitle}
            onSelectTitle={setSelectedTitle}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchResults={searchResults}
            isSearchLoading={isSearchLoading}
            isEditing={Boolean(editingReview)}
          />

          <div className="star-rating-picker">
            <label className="sort-label">Your Rating (Required)</label>
            <div className="star-picker-row">
              {[...Array(10)].map((_, i) => {
                const starVal = i + 1
                const isFilled = starVal <= rating
                return (
                  <button
                    key={i}
                    type="button"
                    className={`star-btn-picker ${isFilled ? 'star-btn-picker--filled' : ''}`}
                    onClick={() => setRating(starVal)}
                    aria-label={`Rate ${starVal} stars`}
                  >
                    <Star
                      size={20}
                      fill={isFilled ? 'var(--imdb-gold, #f5c518)' : 'none'}
                    />
                  </button>
                )
              })}
              {rating > 0 && <span className="star-rating-count-lbl">{rating}/10</span>}
            </div>
          </div>

          <div className="review-text-input-group">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <label className="sort-label">Review (min 10 characters)</label>
              <span
                style={{
                  fontSize: '11px',
                  color:
                    reviewText.length >= 10
                      ? 'var(--color-success, #22c55e)'
                      : 'var(--text-muted)',
                }}
              >
                {reviewText.length} chars
              </span>
            </div>
            <textarea
              className="review-textarea"
              placeholder="What did you think? Share your thoughts, highlights, or critiques..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              cursor: 'pointer',
              color: 'var(--text-secondary, #b3b6cb)',
            }}
          >
            <input
              type="checkbox"
              checked={containsSpoilers}
              onChange={(e) => setContainsSpoilers(e.target.checked)}
            />
            <span>This review contains spoilers</span>
          </label>
        </div>

        <footer className="review-modal-footer">
          <button
            className="btn-publish-review"
            onClick={handlePublish}
            disabled={isPublishDisabled}
            type="button"
          >
            {isPending ? 'Saving…' : 'Publish Review'}
          </button>
        </footer>
      </div>
    </div>
  )
}
