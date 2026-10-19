import { useState } from 'react'
import { Edit, Trash2, Star, FileText, Plus, ExternalLink } from 'lucide-react'
import type { UserReview } from './titleTypes'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'

export interface CommunityReview {
  id: string
  author: string
  rating: number | null
  content: string
  createdAt: string | null
  url: string | null
}

interface TitleReviewsTabProps {
  reviewsList: UserReview[]
  tmdbReviews?: CommunityReview[]
  releaseYear: number
  onOpenWriteReview: (review?: UserReview) => void
  onDeleteReview: (id: string) => void
}

function CommunityReviewCard({ review }: { review: CommunityReview }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = review.content.length > 500
  const displayText = !isLong || isExpanded
    ? review.content
    : `${review.content.slice(0, 500)}...`

  const formattedDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <Card className="title-section-card title-tmdb-review-card">
      <div className="title-tmdb-review-meta">
        <div className="title-tmdb-review-author">
          <span>{review.author}</span>
          {review.rating !== null && (
            <span className="title-tmdb-review-rating">
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              {review.rating}/10
            </span>
          )}
        </div>
        {formattedDate && <span className="title-tmdb-review-date">{formattedDate}</span>}
      </div>

      <p className="title-tmdb-review-content">{displayText}</p>

      {isLong && (
        <button
          type="button"
          className="title-tmdb-review-readmore"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {review.url && (
        <div>
          <a
            href={review.url}
            target="_blank"
            rel="noopener noreferrer"
            className="title-tmdb-review-link"
          >
            <span>Read full review on TMDB</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}
    </Card>
  )
}

export function TitleReviewsTab({
  reviewsList,
  tmdbReviews = [],
  releaseYear,
  onOpenWriteReview,
  onDeleteReview,
}: TitleReviewsTabProps) {
  const hasPersonal = reviewsList.length > 0
  const hasCommunity = tmdbReviews.length > 0

  if (!hasPersonal && !hasCommunity) {
    return (
      <EmptyStateCard
        icon={<FileText size={32} />}
        title="No reviews yet"
        description="No reviews have been written for this title yet. Be the first to share your thoughts!"
        action={
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => onOpenWriteReview()}
          >
            Write Review
          </Button>
        }
      />
    )
  }

  return (
    <div className="title-reviews-tab-container">
      {/* Tab Header Action Bar */}
      <div className="title-reviews-header-bar">
        <div>
          <h3 className="title-card-heading">Reviews</h3>
          <p className="title-card-sub">
            {reviewsList.length + tmdbReviews.length} review{(reviewsList.length + tmdbReviews.length) !== 1 ? 's' : ''} total
            {hasPersonal ? ` (${reviewsList.length} personal, ${tmdbReviews.length} community)` : ''}
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => onOpenWriteReview()}
        >
          Write Review
        </Button>
      </div>

      {/* 1. Personal Reviews */}
      {hasPersonal && (
        <div className="title-reviews-stack">
          <h4 className="title-section-title" style={{ fontSize: '16px' }}>Your Journal Reviews</h4>
          {reviewsList.map((rev) => (
            <Card key={rev.id} className="title-review-item-card">
              <div className="title-review-top-row">
                <div className="title-review-title-group">
                  <h4 className="title-review-heading">{rev.title}</h4>
                  <div className="title-review-rating-tag">
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <strong>{rev.rating}</strong>/10
                    <span className="title-review-year-tag">· {rev.year || releaseYear}</span>
                  </div>
                </div>

                <div className="title-review-actions-group">
                  <button
                    className="title-review-action-btn"
                    onClick={() => onOpenWriteReview(rev)}
                    aria-label="Edit review"
                    type="button"
                    title="Edit review"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    className="title-review-action-btn title-review-action-btn--delete"
                    onClick={() => onDeleteReview(rev.id)}
                    aria-label="Delete review"
                    type="button"
                    title="Delete review"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <p className="title-review-body-text">{rev.reviewText}</p>

              {rev.tags && rev.tags.length > 0 && (
                <div className="title-review-tags-list">
                  {rev.tags.map((tag) => (
                    <span key={tag} className="title-review-tag-pill">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 2. Community Reviews from TMDB */}
      {hasCommunity && (
        <div className="title-reviews-stack">
          {hasPersonal && (
            <h4 className="title-section-title" style={{ fontSize: '16px', marginTop: '16px' }}>
              TMDB Community Reviews
            </h4>
          )}
          {tmdbReviews.map((rev) => (
            <CommunityReviewCard key={rev.id} review={rev} />
          ))}
        </div>
      )}
    </div>
  )
}
