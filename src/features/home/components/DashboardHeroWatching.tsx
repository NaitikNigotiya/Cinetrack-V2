import { useNavigate } from 'react-router-dom'
import { Play, Search } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'

interface HeroProgress {
  titleKey: string
  type: string
  title: string
  year?: number | null
  rating?: string | null
  backdrop?: string | null
  poster?: string | null
  progressPercent: number
  progressText: string
  runtimeString: string
}

interface DashboardHeroWatchingProps {
  heroProgress: HeroProgress | null
}

export function DashboardHeroWatching({ heroProgress }: DashboardHeroWatchingProps) {
  const navigate = useNavigate()

  if (!heroProgress) {
    return (
      <Card variant="flat" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🍿</span>
        <h3 style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700, margin: '0 0 4px 0' }}>Nothing in progress</h3>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
          Search for something to watch
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/search')}>
          <Search size={14} style={{ marginRight: '6px' }} /> Search titles
        </Button>
      </Card>
    )
  }

  return (
    <div
      className="hp-hero-card"
      style={{
        ...(heroProgress.backdrop ? { backgroundImage: `url(${heroProgress.backdrop})` } : {}),
        borderRadius: 'var(--radius-card)',
        border: 'var(--border-card)',
      }}
    >
      <div className="hp-hero-overlay" />
      <div className="hp-hero-inner">
        {heroProgress.poster && (
          <img
            src={heroProgress.poster}
            alt={heroProgress.title}
            className="hp-hero-poster desktop-only"
            style={{ borderRadius: 'var(--radius-tile)' }}
          />
        )}
        <div className="hp-hero-info">
          <h2 className="hp-hero-title">{heroProgress.title}</h2>
          <div className="hp-hero-meta">
            {heroProgress.year && <span>{heroProgress.year}</span>}
            {heroProgress.year && <span>·</span>}
            <span>{heroProgress.runtimeString}</span>
            {heroProgress.rating && (
              <>
                <span>·</span>
                <span>⭐ {heroProgress.rating} TMDb</span>
              </>
            )}
          </div>
          <div className="hp-hero-progress-wrap">
            <div className="hp-hero-track">
              <div className="hp-hero-fill" style={{ width: `${heroProgress.progressPercent}%` }} />
            </div>
            <p className="hp-hero-progress-text">{heroProgress.progressText}</p>
          </div>
          <div className="hp-hero-actions">
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(
                  heroProgress.type === 'tv'
                    ? `/title/${heroProgress.titleKey}/episodes`
                    : `/title/${heroProgress.titleKey}`
                )
              }
            >
              <Play size={12} fill="currentColor" style={{ marginRight: '6px' }} /> Resume
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/title/${heroProgress.titleKey}`)}
            >
              Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
