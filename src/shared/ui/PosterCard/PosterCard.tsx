import { Star, Film } from 'lucide-react'
import clsx from 'clsx'
import { getPosterUrl, getPosterSrcSet } from '@/shared/lib/tmdbImage'
import { StatusBadge, type LibraryStatus } from '../Badge/StatusBadge'
import styles from './PosterCard.module.css'

export interface PosterCardProps {
  title: string
  posterPath?: string | null | undefined
  year?: number | null | undefined
  type?: 'movie' | 'tv' | undefined
  status?: LibraryStatus | undefined
  rating?: number | null | undefined
  progress?: { watched: number; total: number } | undefined
  onClick?: (() => void) | undefined
  className?: string | undefined
  priority?: boolean | undefined
}

export function PosterCard({
  title,
  posterPath,
  year,
  status,
  rating,
  progress,
  onClick,
  className,
  priority = false,
}: PosterCardProps) {
  const posterUrl = getPosterUrl(posterPath, 'w342')
  const posterSrcSet = getPosterSrcSet(posterPath)

  const progressPercent =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.watched / progress.total) * 100))
      : 0

  return (
    <div
      className={clsx(styles.card, className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className={styles.posterWrapper}>
        {posterUrl ? (
          <img
            src={posterUrl}
            srcSet={posterSrcSet}
            sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px"
            alt={`Poster of ${title}`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={styles.posterImg}
          />
        ) : (
          <div className={styles.posterFallback}>
            <Film size={32} />
            <span>No Poster</span>
          </div>
        )}

        {status && (
          <div className={styles.badgeTopLeft}>
            <StatusBadge status={status} />
          </div>
        )}

        {progress && progress.total > 0 && (
          <div className={styles.progressBarContainer} aria-hidden="true">
            <div
              className={styles.progressBar}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      <div className={styles.content}>
        <h4 className={styles.title} title={title}>
          {title}
        </h4>
        <div className={styles.meta}>
          {year ? <span>{year}</span> : <span />}
          {rating ? (
            <div className={styles.rating}>
              <Star size={12} fill="currentColor" />
              <span>{rating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
