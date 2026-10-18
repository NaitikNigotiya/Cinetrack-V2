import { useNavigate } from 'react-router-dom'
import { Film } from 'lucide-react'
import { Section } from '@/shared/ui/layout/Section'
import { getPosterUrl } from '@/shared/lib/tmdbImage'

interface TrendingItem {
  id: number
  poster_path?: string | null | undefined
  media_type?: string | undefined
  release_date?: string | null | undefined
  first_air_date?: string | null | undefined
  title?: string | undefined
  name?: string | undefined
}

interface SearchTrendingRailProps {
  trendingItems: TrendingItem[]
}

export function SearchTrendingRail({ trendingItems }: SearchTrendingRailProps) {
  const navigate = useNavigate()

  if (trendingItems.length === 0) return null

  return (
    <Section title="Trending This Week">
      <div
        className="sp-trending-rail"
        style={{
          display: 'flex',
          gap: 'var(--card-gap)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-2)',
          scrollSnapType: 'x mandatory',
        }}
      >
        {trendingItems.map((item) => {
          const poster = getPosterUrl(item.poster_path, 'w185')
          const mediaType = item.media_type || (item.release_date ? 'movie' : 'tv')
          const titleKey = `${mediaType}:${item.id}`
          const title = item.title ?? item.name ?? 'Untitled'
          return (
            <div
              key={item.id}
              className="sp-trending-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/title/${titleKey}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/title/${titleKey}`)
              }}
              aria-label={title}
              style={{
                flex: '0 0 130px',
                scrollSnapAlign: 'start',
                cursor: 'pointer',
              }}
            >
              {poster ? (
                <img
                  src={poster}
                  alt={title}
                  className="sp-trending-poster"
                  loading="lazy"
                  style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-tile)',
                    border: '1px solid var(--border-subtle)',
                  }}
                />
              ) : (
                <div
                  className="sp-trending-no-poster"
                  style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    borderRadius: 'var(--radius-tile)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--surface-card)',
                  }}
                >
                  <Film size={20} color="var(--text-muted)" />
                </div>
              )}
              <p
                className="sp-trending-title"
                style={{
                  fontSize: 'var(--fs-small)',
                  fontWeight: 500,
                  marginTop: '6px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </p>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
