import { Edit, Trash2, Star, FileText, Plus } from 'lucide-react'
import type { UserReview } from './titleTypes'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'

interface TitleReviewsTabProps {
  reviewsList: UserReview[]
  releaseYear: number
  onOpenWriteReview: (review?: UserReview) => void
  onDeleteReview: (id: string) => void
}

export function TitleReviewsTab({
  reviewsList,
  releaseYear,
  onOpenWriteReview,
  onDeleteReview,
}: TitleReviewsTabProps) {
  return (
    <div className="title-reviews-tab-container">
      {/* Tab Header Action Bar */}
      <div className="title-reviews-header-bar">
        <div>
          <h3 className="title-card-heading">Personal Reviews</h3>
          <p className="title-card-sub">
            {reviewsList.length} review{reviewsList.length !== 1 ? 's' : ''} logged in your CineTrack journal
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

      {reviewsList.length > 0 ? (
        <div className="title-reviews-stack">
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
      ) : (
        <EmptyStateCard
          icon={<FileText size={32} />}
          title="No reviews written yet"
          description="Have thoughts on this title? Write your personal review and save it to your CineTrack journal."
          action={
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => onOpenWriteReview()}
            >
              Write First Review
            </Button>
          }
        />
      )}
    </div>
  )
}
