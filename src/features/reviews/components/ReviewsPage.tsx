import { useState, useMemo, useEffect } from 'react'
import { Star, X, Search, Film, Edit2, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fetchReviews, saveReview, deleteReview } from '../api/reviewsApi'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { getImageUrl } from '@/services/tmdb/images'
import { toast } from '@/shared/ui'
import type { Review } from '@/shared/schemas'

import './ReviewsPage.css'

export default function ReviewsPage() {
  const { user } = useAuthStore()
  const uid = user?.uid
  const queryClient = useQueryClient()

  // Queries
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', uid],
    queryFn: () => (uid ? fetchReviews(uid) : []),
    enabled: Boolean(uid),
  })

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (reviewData: {
      titleKey: string
      title: string
      posterPath: string | null
      rating: number | null
      body: string
      containsSpoilers: boolean
    }) => {
      if (!uid) throw new Error('Not authenticated')
      return saveReview(uid, reviewData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', uid] })
      toast.success('Review saved!')
    },
    onError: () => toast.error('Failed to save review.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (titleKey: string) => {
      if (!uid) throw new Error('Not authenticated')
      return deleteReview(uid, titleKey)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', uid] })
      toast.success('Review deleted.')
    },
    onError: () => toast.error('Failed to delete review.'),
  })

  // Sorting state
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'alphabetical'>('newest')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)

  // Selected title details
  const [selectedTitle, setSelectedTitle] = useState<{
    titleKey: string
    title: string
    posterPath: string | null
    year?: number
  } | null>(null)

  const [rating, setRating] = useState<number>(0)
  const [reviewText, setReviewText] = useState('')
  const [containsSpoilers, setContainsSpoilers] = useState(false)

  // TMDb Title Search (modal)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['search-titles', searchQuery],
    queryFn: () => (searchQuery.trim().length >= 2 ? tmdbClient.searchMulti(searchQuery) : null),
    enabled: searchQuery.trim().length >= 2,
    staleTime: 30 * 1000,
  })

  const searchResults = (searchData?.results ?? []).filter(
    (r: any) => r.media_type === 'movie' || r.media_type === 'tv'
  )

  // Pre-fill modal when editing
  useEffect(() => {
    if (editingReview) {
      setSelectedTitle({
        titleKey: editingReview.titleKey,
        title: editingReview.title,
        posterPath: editingReview.posterPath,
      })
      setRating(editingReview.rating ?? 0)
      setReviewText(editingReview.body)
      setContainsSpoilers(editingReview.containsSpoilers ?? false)
      setSearchQuery('')
    } else {
      setSelectedTitle(null)
      setRating(0)
      setReviewText('')
      setContainsSpoilers(false)
      setSearchQuery('')
    }
  }, [editingReview])

  // Sorting logic
  const sortedReviews = useMemo(() => {
    const getTs = (ts: any) => {
      if (!ts) return Date.now()
      return ts.toDate ? ts.toDate().getTime() : new Date(ts).getTime()
    }
    const items = [...reviews]
    if (sortBy === 'newest')
      return items.sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt))
    if (sortBy === 'highest')
      return items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    if (sortBy === 'alphabetical')
      return items.sort((a, b) => a.title.localeCompare(b.title))
    return items
  }, [reviews, sortBy])

  const handleOpenCreate = () => {
    setEditingReview(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (review: Review) => {
    setEditingReview(review)
    setIsModalOpen(true)
  }

  const handleDelete = async (titleKey: string, title: string) => {
    if (window.confirm(`Delete your review for "${title}"?`)) {
      await deleteMutation.mutateAsync(titleKey)
    }
  }

  const handlePublish = async () => {
    if (!selectedTitle || rating < 1 || reviewText.length < 10) return
    try {
      await saveMutation.mutateAsync({
        titleKey: selectedTitle.titleKey,
        title: selectedTitle.title,
        posterPath: selectedTitle.posterPath,
        rating,
        body: reviewText,
        containsSpoilers,
      })
      setIsModalOpen(false)
    } catch {
      // error handled in mutation
    }
  }

  const isPublishDisabled =
    !selectedTitle || rating < 1 || reviewText.length < 10 || saveMutation.isPending

  return (
    <div className="unified-page-container reviews-page">
      <header className="unified-page-header">
        <div>
          <h1 className="page-title">Reviews</h1>
          <p className="page-subtitle">Your personal movie and show reviews</p>
        </div>
        <button onClick={handleOpenCreate} className="page-header-btn" type="button">
          + Write Review
        </button>
      </header>

      {/* Loading */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 160, borderRadius: 'var(--radius-lg, 12px)' }}
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="col-empty-placeholder">
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>No reviews yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Write thoughtful critiques and rate your watched movies and shows.
          </p>
          <button onClick={handleOpenCreate} className="page-header-btn" type="button">
            Write First Review
          </button>
        </div>
      ) : (
        <>
          {/* Sort bar */}
          <div className="sort-filters-row">
            <span className="sort-label">Sort by:</span>
            {(['newest', 'highest', 'alphabetical'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className={`sort-btn ${sortBy === opt ? 'sort-btn--active' : ''}`}
                type="button"
              >
                {opt === 'newest'
                  ? 'Newest'
                  : opt === 'highest'
                  ? 'Highest Rated'
                  : 'Title A-Z'}
              </button>
            ))}
          </div>

          {/* Reviews list */}
          <div className="reviews-list">
            {sortedReviews.map((review) => (
              <div key={review.titleKey} className="review-card animate-fade-in">
                <div className="review-card-top">
                  {review.posterPath ? (
                    <img
                      src={getImageUrl(review.posterPath, 'w200') || ''}
                      alt={review.title}
                      className="review-poster"
                    />
                  ) : (
                    <div
                      className="review-poster"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Film size={20} color="var(--text-muted)" />
                    </div>
                  )}
                  <div className="review-card-info">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '16px',
                      }}
                    >
                      <div>
                        <h3 className="review-title-text" style={{ margin: 0 }}>
                          {review.title}
                        </h3>
                        <div className="review-year" style={{ marginTop: '2px' }}>
                          ⭐ {review.rating ?? '—'}/10
                          {review.containsSpoilers && (
                            <span
                              style={{
                                marginLeft: 8,
                                padding: '1px 6px',
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: 'var(--color-error, #ef4444)',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              SPOILERS
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="review-actions" style={{ flexShrink: 0 }}>
                        <button
                          onClick={() => handleOpenEdit(review)}
                          className="btn-review-action"
                          type="button"
                          aria-label="Edit review"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(review.titleKey, review.title)}
                          className="btn-review-action btn-review-action--delete"
                          type="button"
                          aria-label="Delete review"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="review-body-text" style={{ margin: '12px 0 0 0' }}>
                      {review.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Write / Edit Review Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <header className="review-modal-header">
              <h2 className="review-modal-title">
                {editingReview ? 'Edit Review' : 'Write a Review'}
              </h2>
              <button
                className="btn-close-modal"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </header>

            <div className="review-modal-body">
              {/* Step 1: Movie / TV selection */}
              {!selectedTitle ? (
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
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {searchQuery.length >= 2 && (
                    <div className="search-results-dropdown">
                      {isSearchLoading ? (
                        <div
                          style={{
                            padding: 12,
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                          }}
                        >
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
                                setSelectedTitle({
                                  titleKey: `${res.media_type || 'movie'}:${res.id}`,
                                  title: name,
                                  posterPath: res.poster_path ?? null,
                                  year: resYear,
                                })
                              }
                            >
                              {poster ? (
                                <img
                                  src={poster}
                                  alt={name}
                                  className="search-dropdown-poster"
                                />
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
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                                  {name}
                                </div>
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  {res.media_type === 'movie' ? 'Movie' : 'TV Show'}{' '}
                                  {resYear > 0 ? `(${resYear})` : ''}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div
                          style={{
                            padding: 12,
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                          }}
                        >
                          No matches found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
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
                  {!editingReview && (
                    <button
                      className="btn-review-action"
                      onClick={() => setSelectedTitle(null)}
                      aria-label="Remove selection"
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Step 2: Star rating */}
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
                        className={`star-btn-picker ${
                          isFilled ? 'star-btn-picker--filled' : ''
                        }`}
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
                  {rating > 0 && (
                    <span className="star-rating-count-lbl">{rating}/10</span>
                  )}
                </div>
              </div>

              {/* Step 3: Review text */}
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

              {/* Step 4: Contains spoilers */}
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
                {saveMutation.isPending ? 'Saving…' : 'Publish Review'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
