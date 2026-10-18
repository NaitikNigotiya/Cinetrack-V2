import { Check, Film } from 'lucide-react'
import { getStillUrl } from '@/services/tmdb/images'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'

interface EpisodeItemCardProps {
  episode: {
    episodeNumber: number
    name: string
    overview: string | null
    airDate: string | null
    stillPath: string | null
    voteAverage: number | null
    runtimeMinutes: number | null
  }
  isWatched: boolean
  onToggle: () => void
}

export function EpisodeItemCard({ episode, isWatched, onToggle }: EpisodeItemCardProps) {
  const stillUrl = getStillUrl(episode.stillPath, 'w300')

  return (
    <Card
      variant="default"
      style={{
        display: 'flex',
        gap: 'var(--space-4)',
        alignItems: 'center',
        padding: 'var(--space-4)',
        opacity: isWatched ? 0.8 : 1,
        transition: 'opacity var(--transition-fast)',
      }}
    >
      {stillUrl ? (
        <img
          src={stillUrl}
          alt={episode.name}
          loading="lazy"
          style={{
            width: '120px',
            height: '75px',
            objectFit: 'cover',
            borderRadius: 'var(--radius-control)',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: '120px',
            height: '75px',
            background: 'var(--surface-page)',
            borderRadius: 'var(--radius-control)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Film size={20} color="var(--text-muted)" />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 'var(--fs-stat-label)', fontWeight: 700, color: 'var(--brand-primary)' }}>
            EPISODE {episode.episodeNumber}
          </span>
          {episode.runtimeMinutes && (
            <span style={{ fontSize: 'var(--fs-stat-label)', color: 'var(--text-muted)' }}>
              · {episode.runtimeMinutes}m
            </span>
          )}
          {episode.airDate && (
            <span style={{ fontSize: 'var(--fs-stat-label)', color: 'var(--text-muted)' }}>
              · {episode.airDate}
            </span>
          )}
        </div>

        <h4 style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700, margin: '2px 0 4px 0' }}>
          {episode.name}
        </h4>

        {episode.overview && (
          <p
            style={{
              fontSize: 'var(--fs-small)',
              color: 'var(--text-muted)',
              margin: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {episode.overview}
          </p>
        )}
      </div>

      <Button
        variant={isWatched ? 'primary' : 'secondary'}
        size="sm"
        onClick={onToggle}
        aria-label={`Mark episode ${episode.episodeNumber} as ${isWatched ? 'unwatched' : 'watched'}`}
        style={{ flexShrink: 0, minWidth: '40px', padding: '8px' }}
      >
        <Check size={16} />
      </Button>
    </Card>
  )
}
