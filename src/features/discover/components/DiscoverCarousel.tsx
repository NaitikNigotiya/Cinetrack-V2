import { useRef } from 'react'
import { PosterCard, IconButton, Skeleton } from '@/shared/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TmdbSearchResult } from '@/services/tmdb/tmdb.schema'
import styles from './DiscoverCarousel.module.css'

interface DiscoverCarouselProps {
  title: string
  subtitle?: string | undefined
  items?: TmdbSearchResult[] | undefined
  isLoading?: boolean | undefined
  libraryKeys?: Set<string> | undefined
  onQuickAdd?: ((item: TmdbSearchResult) => void) | undefined
}

export function DiscoverCarousel({
  title,
  subtitle,
  items,
  isLoading,
  libraryKeys,
  onQuickAdd,
}: DiscoverCarouselProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return
    const scrollAmount = rowRef.current.clientWidth * 0.75
    rowRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.navButtons}>
          <IconButton
            icon={<ChevronLeft size={18} />}
            aria-label={`Scroll ${title} left`}
            onClick={() => scroll('left')}
          />
          <IconButton
            icon={<ChevronRight size={18} />}
            aria-label={`Scroll ${title} right`}
            onClick={() => scroll('right')}
          />
        </div>
      </div>

      <div ref={rowRef} className={styles.row}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.cardWrapper}>
              <Skeleton height={240} width={160} />
            </div>
          ))
        ) : !items || items.length === 0 ? (
          <div className={styles.emptyNotice}>No titles found</div>
        ) : (
          items.map((item) => {
            const mediaType = item.media_type || (item.title ? 'movie' : 'tv')
            const titleKey = `${mediaType}:${item.id}`
            const displayTitle = item.title || item.name || 'Untitled'
            const releaseDate = item.release_date || item.first_air_date
            const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined
            const inLibrary = libraryKeys?.has(titleKey)

            return (
              <div key={titleKey} className={styles.cardWrapper}>
                <PosterCard
                  title={displayTitle}
                  posterPath={item.poster_path}
                  year={year}
                  type={mediaType as 'movie' | 'tv'}
                  rating={item.vote_average ? item.vote_average : undefined}
                  detailHref={`/title/${titleKey}`}
                  statusBadge={inLibrary ? 'In Library' : undefined}
                  quickAction={
                    !inLibrary && onQuickAdd
                      ? {
                          label: 'Add to Library',
                          onClick: () => onQuickAdd(item),
                        }
                      : undefined
                  }
                />
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
