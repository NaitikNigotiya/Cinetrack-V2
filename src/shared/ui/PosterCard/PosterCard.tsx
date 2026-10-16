import { Link } from 'react-router-dom'
import { Star, Film } from 'lucide-react'
import clsx from 'clsx'
import { getPosterUrl, getPosterSrcSet } from '@/shared/lib/tmdbImage'
import { usePrefetchTitle } from '@/services/tmdb/hooks'
import { StatusBadge, type LibraryStatus } from '../Badge/StatusBadge'
import { Badge } from '../Badge/Badge'
import styles from './PosterCard.module.css'

export interface PosterCardProps {
  title: string
  titleKey?: string | undefined
  posterPath?: string | null | undefined
  year?: number | null | undefined
  type?: 'movie' | 'tv' | undefined
  status?: LibraryStatus | undefined
  statusBadge?: string | undefined
  rating?: number | null | undefined
  progress?: { watched: number; total: number } | undefined
  onClick?: (() => void) | undefined
  detailHref?: string | undefined
  quickAction?: { label: string; onClick: () => void } | undefined
  className?: string | undefined
  priority?: boolean | undefined
}

export function PosterCard({
  title,
  titleKey,
  posterPath,
  year,
  status,
  statusBadge,
  rating,
  progress,
  onClick,
  detailHref,
  quickAction,
  className,
  priority = false,
}: PosterCardProps) {
  const { prefetchTitle } = usePrefetchTitle()
  const effectiveTitleKey = titleKey || (detailHref?.startsWith('/title/') ? detailHref.replace('/title/', '') : undefined)

  const handleTriggerPrefetch = () => {
    if (effectiveTitleKey) {
      void prefetchTitle(effectiveTitleKey)
    }
  }

  const posterUrl = getPosterUrl(posterPath, 'w342')
  const posterSrcSet = getPosterSrcSet(posterPath)

  const progressPercent =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.watched / progress.total) * 100))
      : 0

  const cardContent = (
    <>
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

        {statusBadge && !status && (
          <div className={styles.badgeTopLeft}>
            <Badge variant="accent">{statusBadge}</Badge>
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
    </>
  )

  if (detailHref) {
    return (
      <div
        className={clsx(styles.card, className)}
        onMouseEnter={handleTriggerPrefetch}
        onFocus={handleTriggerPrefetch}
        onPointerDown={handleTriggerPrefetch}
      >
        <Link to={detailHref} className={styles.cardLink} onClick={onClick}>
          {cardContent}
        </Link>
        {quickAction && (
          <button
            type="button"
            className={styles.quickActionBtn}
            onClick={(e) => {
              e.preventDefault()
              quickAction.onClick()
            }}
          >
            {quickAction.label}
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={clsx(styles.card, className)}
      onClick={onClick}
      onMouseEnter={handleTriggerPrefetch}
      onFocus={handleTriggerPrefetch}
      onPointerDown={handleTriggerPrefetch}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {cardContent}
      {quickAction && (
        <button
          type="button"
          className={styles.quickActionBtn}
          onClick={(e) => {
            e.stopPropagation()
            quickAction.onClick()
          }}
        >
          {quickAction.label}
        </button>
      )}
    </div>
  )
}
