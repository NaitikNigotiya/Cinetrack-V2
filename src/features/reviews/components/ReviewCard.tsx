import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RatingControl, IconButton, Badge } from '@/shared/ui'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { Edit2, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import type { Review } from '@/shared/schemas'
import styles from './ReviewCard.module.css'

interface ReviewCardProps {
  review: Review
  onEdit: (review: Review) => void
  onDelete: (review: Review) => void
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(!review.containsSpoilers)

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          {review.posterPath ? (
            <img
              src={getPosterUrl(review.posterPath, 'w92') ?? ''}
              alt={review.title}
              className={styles.poster}
              loading="lazy"
            />
          ) : (
            <div className={styles.posterPlaceholder} />
          )}
          <div>
            <Link to={`/title/${review.titleKey}`} className={styles.titleLink}>
              <h3 className={styles.title}>{review.title}</h3>
            </Link>
            {review.rating !== null && (
              <div className={styles.ratingWrapper}>
                <RatingControl value={review.rating} readonly size="sm" />
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          {review.containsSpoilers && (
            <Badge variant="warning" className={styles.spoilerBadge}>
              <AlertTriangle size={12} style={{ marginRight: '4px' }} />
              Spoilers
            </Badge>
          )}
          <IconButton
            icon={<Edit2 size={16} />}
            aria-label={`Edit review for ${review.title}`}
            onClick={() => onEdit(review)}
          />
          <IconButton
            icon={<Trash2 size={16} />}
            aria-label={`Delete review for ${review.title}`}
            onClick={() => onDelete(review)}
          />
        </div>
      </div>

      <div className={styles.bodyContainer}>
        {review.containsSpoilers && !spoilerRevealed ? (
          <div className={styles.spoilerCover} onClick={() => setSpoilerRevealed(true)}>
            <div className={styles.spoilerOverlayContent}>
              <Eye size={20} />
              <span>Contains spoilers. Tap to read.</span>
            </div>
            <p className={`${styles.bodyText} ${styles.blurred}`}>{review.body}</p>
          </div>
        ) : (
          <div>
            <p className={styles.bodyText}>{review.body}</p>
            {review.containsSpoilers && (
              <button
                type="button"
                className={styles.hideButton}
                onClick={() => setSpoilerRevealed(false)}
              >
                <EyeOff size={14} /> Hide spoilers
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
