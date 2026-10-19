import { Link } from 'react-router-dom'
import { Star, Film, Heart } from 'lucide-react'
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
  showAddButton?: boolean | undefined
  isInWatchlist?: boolean | undefined
  onAddClick?: ((e: React.MouseEvent) => void) | undefined
  isFavorite?: boolean | undefined
  onToggleFavorite?: ((e: React.MouseEvent) => void) | undefined
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
  showAddButton = false,
  isInWatchlist = false,
  onAddClick,
  isFavorite = false,
  onToggleFavorite,
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

        {onToggleFavorite ? (
          <button
            type="button"
            className={styles.favBtn}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite(e)
            }}
            aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 4,
              color: isFavorite ? '#e50914' : 'rgba(255,255,255,0.7)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        ) : isFavorite ? (
          <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 14, zIndex: 2 }}>
            ❤️
          </div>
        ) : null}

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

        {showAddButton && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAddClick?.(e)
            }}
            style={{
              position: 'absolute',
              bottom: 6,
              left: 6,
              right: 6,
              padding: '6px',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm, 6px)',
              background: isInWatchlist
                ? 'rgba(46, 204, 113, 0.9)'
                : 'rgba(229, 9, 20, 0.9)',
              color: 'white',
              fontSize: '11px',
              fontWeight: 700,
              backdropFilter: 'blur(4px)',
              zIndex: 3,
            }}
          >
            {isInWatchlist ? '✓ In Watchlist' : '+ Add'}
          </button>
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
