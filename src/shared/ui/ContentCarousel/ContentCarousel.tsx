import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Film, Plus, Check } from 'lucide-react'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import './ContentCarousel.css'

export interface CarouselItem {
  id: number
  media_type?: 'movie' | 'tv' | 'person' | string | undefined
  title?: string | undefined
  name?: string | undefined
  poster_path?: string | null | undefined
  backdrop_path?: string | null | undefined
  release_date?: string | null | undefined
  first_air_date?: string | null | undefined
  vote_average?: number | undefined
  overview?: string | undefined
  genre_ids?: number[] | undefined
}

interface ContentCarouselProps {
  items: CarouselItem[]
  onAdd: (item: CarouselItem) => void
  cardWidth?: number
  showYear?: boolean
  onClick?: (item: CarouselItem) => void
  addedTitleKeys?: Set<string>
}

export function ContentCarousel({
  items,
  onAdd,
  cardWidth = 110,
  showYear = true,
  onClick,
  addedTitleKeys = new Set(),
}: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const touchStartX = useRef(0)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
    }
  }, [updateScrollState, items])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0]?.clientX ?? 0
    const diff = touchStartX.current - endX
    if (Math.abs(diff) > 50) scroll(diff > 0 ? 'right' : 'left')
  }

  return (
    <div className="cc-root">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          className="cc-arrow cc-arrow--left"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          type="button"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {/* Scroll track */}
      <div
        ref={scrollRef}
        className="cc-scroll"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item) => {
          const title = item.title ?? item.name ?? 'Untitled'
          const year = (item.release_date ?? item.first_air_date)?.slice(0, 4) ?? ''
          const rating = (item.vote_average ?? 0) > 0 ? item.vote_average!.toFixed(1) : null
          const poster = getPosterUrl(item.poster_path, 'w185')
          const mediaType = item.media_type === 'tv' ? 'tv' : 'movie'
          const compositeId = `${mediaType}:${item.id}`
          const isAdded = addedTitleKeys.has(compositeId)

          return (
            <article
              key={item.id}
              className="cc-card"
              style={{ width: cardWidth }}
              onClick={() => onClick?.(item)}
            >
              <div
                className="cc-poster-wrap"
                style={{ width: cardWidth, height: Math.round(cardWidth * 1.5) }}
              >
                {poster ? (
                  <img src={poster} alt={title} className="cc-poster-img" loading="lazy" />
                ) : (
                  <div className="cc-poster-fallback">
                    <Film size={20} />
                  </div>
                )}

                {rating && <span className="cc-rating-badge">⭐ {rating}</span>}

                <button
                  className={`cc-add-btn ${isAdded ? 'cc-add-btn--added' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isAdded) onAdd(item)
                  }}
                  disabled={isAdded}
                  aria-label={isAdded ? 'In watchlist' : `Add ${title}`}
                  type="button"
                >
                  {isAdded ? <Check size={10} /> : <Plus size={10} />}
                </button>
              </div>

              <p className="cc-card-title" title={title}>
                {title}
              </p>
              {showYear && year && <p className="cc-card-year">{year}</p>}
            </article>
          )
        })}
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button
          className="cc-arrow cc-arrow--right"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          type="button"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  )
}
