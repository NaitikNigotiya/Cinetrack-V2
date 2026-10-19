import { useNavigate } from 'react-router-dom'
import { Section } from '@/shared/ui/layout/Section'
import { ContentCarousel, type CarouselItem } from '@/shared/ui/ContentCarousel/ContentCarousel'

export interface SearchTrendingRailProps {
  trendingItems: CarouselItem[]
  onAddTitle?: ((item: CarouselItem) => void) | undefined
  addedTitleKeys?: Set<string> | undefined
}

export function SearchTrendingRail({
  trendingItems,
  onAddTitle,
  addedTitleKeys = new Set(),
}: SearchTrendingRailProps) {
  const navigate = useNavigate()

  if (trendingItems.length === 0) return null

  return (
    <Section title="Trending This Week">
      <ContentCarousel
        items={trendingItems}
        cardWidth={160}
        onAdd={(item) => onAddTitle?.(item)}
        onClick={(item) => {
          const mediaType = item.media_type || (item.release_date ? 'movie' : 'tv')
          navigate(`/title/${mediaType}:${item.id}`)
        }}
        addedTitleKeys={addedTitleKeys}
      />
    </Section>
  )
}
