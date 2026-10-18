import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Play,
  Check,
  Clock,
  X,
  Heart,
  MoreHorizontal,
  ChevronDown,
  ListChecks,
  FolderOpen,
  Star,
  FileText,
  Share2,
  Trash2,
  Calendar,
  Film,
} from 'lucide-react'
import type { TitleDetails } from '@/shared/schemas/title'
import { getBackdropUrl, getPosterUrl } from '@/services/tmdb/images'
import { Button } from '@/shared/ui/Button/Button'

interface TitleHeroBannerProps {
  details: TitleDetails
  entry: any | null
  isMovie: boolean
  runtimeString: string
  isInWatchlist: boolean
  onOpenAddSheet: () => void
  onOpenStatusSheet: () => void
  onOpenTrailer: () => void
  onToggleFavorite: () => void
  onOpenCollectionSheet: () => void
  onScrollToRating: () => void
  onWriteReview: () => void
  onShare: () => void
  onRemove: () => void
}

export function TitleHeroBanner({
  details,
  entry,
  isMovie,
  runtimeString,
  isInWatchlist,
  onOpenAddSheet,
  onOpenStatusSheet,
  onOpenTrailer,
  onToggleFavorite,
  onOpenCollectionSheet,
  onScrollToRating,
  onWriteReview,
  onShare,
  onRemove,
}: TitleHeroBannerProps) {
  const navigate = useNavigate()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const backdrop = details.backdropPath ? getBackdropUrl(details.backdropPath, 'original') : null
  const poster = details.posterPath ? getPosterUrl(details.posterPath, 'w500') : null
  const releaseYear = details.year || 0
  const ratingAverage = details.voteAverage ? details.voteAverage.toFixed(1) : null

  return (
    <div className="title-hero-wrapper">
      {/* Background Backdrop with Gradient Overlays */}
      <div className="title-hero-backdrop-container">
        {backdrop ? (
          <img src={backdrop} alt={details.title} className="title-hero-backdrop-img" />
        ) : (
          <div className="title-hero-backdrop-fallback" />
        )}
        <div className="title-hero-vignette-radial" />
        <div className="title-hero-vignette-bottom" />
        <div className="title-hero-vignette-left" />
      </div>

      {/* Top Floating Navigation Bar */}
      <div className="title-hero-top-nav">
        <button
          className="title-hero-back-pill"
          onClick={() => navigate(-1)}
          type="button"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="title-hero-breadcrumbs">
          <span className="title-hero-breadcrumb-tag">
            {isMovie ? 'Movie' : 'TV Series'}
          </span>
          <span className="title-hero-breadcrumb-sep">/</span>
          <span className="title-hero-breadcrumb-curr">{details.title}</span>
        </div>

        <button
          className="title-hero-icon-pill"
          onClick={onShare}
          type="button"
          title="Share title"
          aria-label="Share"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* Hero Content Section */}
      <div className="title-hero-inner">
        {/* Left: Poster */}
        <div className="title-hero-poster-frame">
          {poster ? (
            <img src={poster} alt={details.title} className="title-hero-poster-img" />
          ) : (
            <div className="title-hero-poster-placeholder">
              <Film size={36} />
            </div>
          )}
          {ratingAverage && (
            <div className="title-hero-poster-rating">
              <Star size={14} fill="var(--star-filled, #f59e0b)" color="var(--star-filled, #f59e0b)" />
              <span>{ratingAverage}</span>
            </div>
          )}
        </div>

        {/* Right: Info, Meta & Actions */}
        <div className="title-hero-details">
          {/* Eyebrow & Badges */}
          <div className="title-hero-badges-row">
            <span className="title-hero-type-badge">
              {isMovie ? 'FEATURE FILM' : 'TV SERIES'}
            </span>
            {details.status && (
              <span className="title-hero-status-badge">{details.status}</span>
            )}
            {details.certification && (
              <span className="title-hero-cert-badge">{details.certification}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="title-hero-heading">{details.title}</h1>

          {/* Tagline */}
          {details.tagline && (
            <p className="title-hero-tagline">"{details.tagline}"</p>
          )}

          {/* Metadata Row */}
          <div className="title-hero-meta-row">
            {releaseYear > 0 && (
              <span className="title-hero-meta-item">
                <Calendar size={14} />
                {releaseYear}
              </span>
            )}
            {runtimeString && (
              <span className="title-hero-meta-item">
                <Clock size={14} />
                {runtimeString}
              </span>
            )}
            {ratingAverage && (
              <span className="title-hero-meta-item title-hero-meta-rating">
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                <strong>{ratingAverage}</strong>
                <span className="title-hero-meta-muted">TMDB</span>
              </span>
            )}
          </div>

          {/* Genres Chips */}
          {details.genres.length > 0 && (
            <div className="title-hero-genres-row">
              {details.genres.map((g) => (
                <span key={g.id} className="title-hero-genre-pill">
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Action Toolbar */}
          <div className="title-hero-actions-toolbar">
            {/* Primary Action Button */}
            {!isInWatchlist ? (
              <Button
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={onOpenAddSheet}
                className="title-hero-btn-primary"
              >
                Add to Watchlist
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={onOpenStatusSheet}
                className="title-hero-btn-status"
                rightIcon={<ChevronDown size={14} />}
              >
                {entry?.status === 'watching' && <><Play size={14} fill="currentColor" /> Watching</>}
                {entry?.status === 'completed' && <><Check size={14} /> Completed</>}
                {entry?.status === 'plan_to_watch' && <><Clock size={14} /> Plan to Watch</>}
                {entry?.status === 'dropped' && <><X size={14} /> Dropped</>}
                {!entry?.status && 'In Library'}
              </Button>
            )}

            {/* Trailer Button */}
            <Button
              variant="secondary"
              leftIcon={<Play size={14} fill="currentColor" />}
              onClick={onOpenTrailer}
              className="title-hero-btn-secondary"
            >
              Trailer
            </Button>

            {/* Favorite Button */}
            <Button
              variant={entry?.isFavorite ? 'primary' : 'secondary'}
              leftIcon={<Heart size={14} fill={entry?.isFavorite ? 'currentColor' : 'none'} />}
              onClick={onToggleFavorite}
              className={`title-hero-btn-fav ${entry?.isFavorite ? 'title-hero-btn-fav--active' : ''}`}
            >
              {entry?.isFavorite ? 'Favorited' : 'Favorite'}
            </Button>

            {/* TV Episode Tracking CTA */}
            {isInWatchlist && !isMovie && (
              <Button
                variant="secondary"
                leftIcon={<ListChecks size={15} />}
                onClick={() => navigate(`/title/${details.titleKey}/episodes`)}
                className="title-hero-btn-secondary"
              >
                Track Episodes
              </Button>
            )}

            {/* More Menu Popover */}
            <div className="title-hero-more-wrapper">
              <Button
                variant="secondary"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="title-hero-btn-icon"
                aria-label="More actions"
              >
                <MoreHorizontal size={16} />
              </Button>

              {showMoreMenu && (
                <>
                  <div className="title-hero-menu-backdrop" onClick={() => setShowMoreMenu(false)} />
                  <div className="title-hero-menu-dropdown">
                    {[
                      { icon: <FolderOpen size={15} />, label: 'Add to Collection', onClick: onOpenCollectionSheet },
                      { icon: <Star size={15} />, label: 'Rate this title', onClick: onScrollToRating },
                      { icon: <FileText size={15} />, label: 'Write a Review', onClick: onWriteReview },
                      { icon: <Share2 size={15} />, label: 'Share', onClick: onShare },
                      ...(isInWatchlist ? [{ icon: <Trash2 size={15} />, label: 'Remove from Library', onClick: onRemove, danger: true }] : []),
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        className={`title-hero-menu-item ${item.danger ? 'title-hero-menu-item--danger' : ''}`}
                        onClick={() => { setShowMoreMenu(false); item.onClick() }}
                        type="button"
                      >
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
