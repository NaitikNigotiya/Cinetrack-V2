import { useNavigate } from 'react-router-dom'
import { Plus, Check, Play } from 'lucide-react'
import { getImageUrl } from '@/services/tmdb/images'
import { Button } from '@/shared/ui/Button/Button'

interface DiscoverHeroProps {
  heroItem: {
    id: number
    title?: string | undefined
    name?: string | undefined
    overview?: string | undefined
    backdrop_path?: string | null | undefined
    poster_path?: string | null | undefined
    media_type?: string | undefined
    [key: string]: unknown
  } | null | undefined
  isLoading: boolean
  inWatchlist: boolean
  onAdd: () => void
  onWatchTrailer: (id: number, mediaType: 'movie' | 'tv', title: string) => void
}

export function DiscoverHero({
  heroItem,
  isLoading,
  inWatchlist,
  onAdd,
  onWatchTrailer,
}: DiscoverHeroProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div
        className="skeleton"
        style={{
          height: '280px',
          borderRadius: 'var(--radius-card)',
          width: '100%',
        }}
      />
    )
  }

  if (!heroItem) return null

  const mediaType = (heroItem.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv'
  const title = heroItem.title ?? heroItem.name ?? 'Untitled'
  const backdropUrl = heroItem.backdrop_path
    ? getImageUrl(heroItem.backdrop_path, 'w780')
    : null
  const posterUrl = heroItem.poster_path
    ? getImageUrl(heroItem.poster_path, 'w500')
    : null

  return (
    <div
      className="dp-hero"
      style={{
        position: 'relative',
        height: '280px',
        width: '100%',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        backgroundColor: 'var(--surface-card)',
        border: 'var(--border-card)',
        backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center 25%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
      }}
      onClick={() => navigate(`/title/${mediaType}:${heroItem.id}`)}
    >
      <div className="dp-hero-overlay" />

      <div className="dp-hero-left">
        <span className="dp-hero-rank-badge">TRENDING #1</span>
        <h2 className="dp-hero-title">{title}</h2>
        {heroItem.overview && (
          <p className="dp-hero-overview">{heroItem.overview}</p>
        )}
        <div className="dp-hero-actions" onClick={(e) => e.stopPropagation()}>
          {inWatchlist ? (
            <Button variant="secondary" size="sm" disabled>
              <Check size={14} style={{ marginRight: '6px' }} /> In Watchlist
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onAdd}
            >
              <Plus size={14} style={{ marginRight: '6px' }} /> Add to Watchlist
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onWatchTrailer(heroItem.id, mediaType, title)}
            aria-label="Watch trailer"
          >
            <Play size={14} fill="currentColor" style={{ marginRight: '6px' }} /> Trailer
          </Button>
        </div>
      </div>

      {posterUrl && (
        <div className="dp-hero-poster-wrap desktop-only">
          <img
            src={posterUrl}
            alt={title}
            className="dp-hero-poster"
            style={{ borderRadius: 'var(--radius-tile)' }}
          />
        </div>
      )}
    </div>
  )
}
