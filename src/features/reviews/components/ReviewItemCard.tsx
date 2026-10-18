import { useNavigate } from 'react-router-dom'
import { Star, Film, Edit2, Trash2 } from 'lucide-react'
import { getImageUrl } from '@/services/tmdb/images'
import type { Review } from '@/shared/schemas'

interface ReviewItemCardProps {
  review: Review
  onEdit: (review: Review) => void
  onDelete: (titleKey: string, title: string) => void
}

export function ReviewItemCard({ review, onEdit, onDelete }: ReviewItemCardProps) {
  const navigate = useNavigate()

  return (
    <div className="review-card animate-fade-in">
      <div className="review-card-top">
        {review.posterPath ? (
          <img
            src={getImageUrl(review.posterPath, 'w200') || ''}
            alt={review.title}
            className="review-poster"
            onClick={() => navigate(`/title/${review.titleKey}`)}
            title={`View ${review.title} details`}
          />
        ) : (
          <div
            className="review-poster"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => navigate(`/title/${review.titleKey}`)}
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
              <h3
                className="review-title-text"
                style={{ margin: 0 }}
                onClick={() => navigate(`/title/${review.titleKey}`)}
                title={`View ${review.title} details`}
              >
                {review.title}
              </h3>
              <div className="review-rating-row" style={{ marginTop: '4px' }}>
                <span className="review-stars-display">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  {review.rating ?? '—'}/10
                </span>
                {review.containsSpoilers && (
                  <span className="review-spoiler-tag">SPOILERS</span>
                )}
              </div>
            </div>
            <div className="review-actions" style={{ flexShrink: 0 }}>
              <button
                onClick={() => onEdit(review)}
                className="btn-review-action"
                type="button"
                aria-label="Edit review"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => onDelete(review.titleKey, review.title)}
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
  )
}
