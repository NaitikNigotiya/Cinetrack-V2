import { useRef, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { Section } from '@/shared/ui/layout/Section'
import { ContentCarousel, type CarouselItem } from '@/shared/ui/ContentCarousel/ContentCarousel'

interface DiscoverGenreSectionProps {
  genreId: number
  label: string
  color: string
  emoji: string
  onAdd: (item: CarouselItem) => void
  onClick: (item: CarouselItem) => void
}

function tmdbToCarousel(item: any): CarouselItem {
  return {
    id: item.id,
    media_type: item.media_type ?? (item.title ? 'movie' : 'tv'),
    title: item.title ?? item.name,
    name: item.name,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    vote_average: item.vote_average ?? item.voteAverage,
    overview: item.overview,
    genre_ids: item.genre_ids,
  }
}

export function DiscoverGenreSection({
  genreId,
  label,
  color,
  emoji,
  onAdd,
  onClick,
}: DiscoverGenreSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [shouldFetch, setShouldFetch] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldFetch(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { data } = useQuery({
    queryKey: ['discover-genre', genreId],
    queryFn: () => tmdbClient.discoverByGenre('movie', genreId),
    enabled: shouldFetch,
    staleTime: 15 * 60 * 1000,
  })

  const items = (data?.results ?? []).slice(0, 15).map(tmdbToCarousel)

  return (
    <div ref={sectionRef}>
      <Section
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: color,
              }}
            />
            <span>{emoji} {label} Movies</span>
          </span>
        }
      >
        {items.length > 0 ? (
          <ContentCarousel items={items} onAdd={onAdd} onClick={onClick} />
        ) : (
          <div style={{ display: 'flex', gap: 'var(--card-gap)', overflowX: 'hidden' }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{
                  flex: '0 0 130px',
                  aspectRatio: '2/3',
                  borderRadius: 'var(--radius-tile)',
                }}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
