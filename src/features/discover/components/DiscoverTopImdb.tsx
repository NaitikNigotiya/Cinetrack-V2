import { useNavigate } from 'react-router-dom'
import { Film, Plus, Check } from 'lucide-react'
import { getImageUrl } from '@/services/tmdb/images'
import { Button } from '@/shared/ui/Button/Button'
import type { CarouselItem } from '@/shared/ui/ContentCarousel/ContentCarousel'

export interface TopImdbItem {
  id: number
  title?: string | undefined
  name?: string | undefined
  year?: number | undefined
  release_date?: string | null | undefined
  rating?: number | undefined
  vote_average?: number | undefined
  genres?: string | undefined
  poster_path?: string | null | undefined
  [key: string]: unknown
}

const IMDB_TOP_FALLBACK: TopImdbItem[] = [
  { id: 278, title: 'The Shawshank Redemption', year: 1994, rating: 9.3, genres: 'Drama' },
  { id: 238, title: 'The Godfather', year: 1972, rating: 9.2, genres: 'Crime, Drama' },
  { id: 424, title: "Schindler's List", year: 1993, rating: 9.0, genres: 'Drama, History' },
  { id: 389, title: '12 Angry Men', year: 1957, rating: 9.0, genres: 'Drama, Crime' },
  { id: 129, title: 'Spirited Away', year: 2001, rating: 8.6, genres: 'Animation, Family' },
  { id: 680, title: 'Pulp Fiction', year: 1994, rating: 8.9, genres: 'Crime, Drama' },
  { id: 497, title: 'The Green Mile', year: 1999, rating: 8.6, genres: 'Crime, Drama' },
  { id: 155, title: 'The Dark Knight', year: 2008, rating: 9.0, genres: 'Action, Crime' },
  { id: 496243, title: 'Parasite', year: 2019, rating: 8.5, genres: 'Drama, Thriller' },
  { id: 550, title: 'Fight Club', year: 1999, rating: 8.8, genres: 'Drama, Thriller' },
]

interface DiscoverTopImdbProps {
  topRatedItems: TopImdbItem[]
  titleKeys: Set<string>
  onAdd: (item: CarouselItem) => void
}

export function DiscoverTopImdb({ topRatedItems, titleKeys, onAdd }: DiscoverTopImdbProps) {
  const navigate = useNavigate()
  const items = topRatedItems.length > 0 ? topRatedItems : IMDB_TOP_FALLBACK

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-3)',
      }}
    >
      {items.map((item, idx) => {
        const title = item.title ?? item.name ?? 'Untitled'
        const year = item.year ?? item.release_date?.slice(0, 4) ?? '—'
        const voteAvg = item.vote_average ?? item.rating ?? 0
        const rating = voteAvg > 0 ? voteAvg.toFixed(1) : '—'
        const genres = item.genres ?? ''
        const poster = getImageUrl(item.poster_path ?? null, 'w200')
        const compositeId = `movie:${item.id}`
        const inList = titleKeys.has(compositeId)

        return (
          <div
            key={item.id}
            onClick={() => navigate(`/title/movie:${item.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              backgroundColor: 'var(--surface-card)',
              borderRadius: 'var(--radius-tile)',
              border: 'var(--border-card)',
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--fs-card-title)',
                fontWeight: 800,
                color: 'var(--brand-primary)',
                minWidth: '32px',
                textAlign: 'center',
              }}
            >
              #{String(idx + 1).padStart(2, '0')}
            </span>

            {poster ? (
              <img
                src={poster}
                alt={title}
                loading="lazy"
                style={{
                  width: '44px',
                  height: '66px',
                  borderRadius: 'var(--radius-control)',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '66px',
                  borderRadius: 'var(--radius-control)',
                  background: 'var(--surface-page)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Film size={16} color="var(--text-muted)" />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 'var(--fs-body)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  margin: 0,
                }}
              >
                {title}
              </p>
              <p
                style={{
                  fontSize: 'var(--fs-small)',
                  color: 'var(--text-muted)',
                  margin: '2px 0 0 0',
                }}
              >
                {year} · ⭐ {rating}
              </p>
              {genres && (
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    margin: '2px 0 0 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {typeof genres === 'string' ? genres : ''}
                </p>
              )}
            </div>

            <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
              {inList ? (
                <Button variant="secondary" size="sm" disabled style={{ padding: '6px 10px' }}>
                  <Check size={14} />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  style={{ padding: '6px 10px' }}
                  onClick={() =>
                    onAdd({
                      id: item.id,
                      media_type: 'movie',
                      title,
                      poster_path: item.poster_path ?? null,
                      release_date: item.release_date ?? (item.year ? String(item.year) : undefined),
                      vote_average: item.vote_average ?? item.rating,
                    })
                  }
                >
                  <Plus size={14} />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
