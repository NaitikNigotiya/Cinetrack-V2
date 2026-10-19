import { Clock, TrendingUp, X } from 'lucide-react'
import { Section } from '@/shared/ui/layout/Section'
import { Card } from '@/shared/ui/layout/Card'
import { Pill } from '@/shared/ui/layout/Pill'
import { SearchTrendingRail } from './SearchTrendingRail'
import type { CarouselItem } from '@/shared/ui/ContentCarousel/ContentCarousel'

const POPULAR_SEARCHES = [
  'Oppenheimer',
  'True Detective',
  'Spirited Away',
  'The Dark Knight',
  'Parasite',
]

const BROWSE_CATEGORIES = [
  { id: 'movie', icon: '🎬', label: 'Movies' },
  { id: 'tv', icon: '📺', label: 'TV Shows' },
  { id: 'actor', icon: '🎭', label: 'Actors' },
  { id: 'director', icon: '🎥', label: 'Directors' },
]

export interface SearchDefaultStateProps {
  recent: string[]
  onClearSearch: (q: string) => void
  onClearAllRecent: () => void
  onSelectTerm: (term: string) => void
  onBrowseCategory: (id: string) => void
  genre?: string
  setGenre?: (g: string) => void
  year?: string
  setYear?: (y: string) => void
  rating?: string
  setRating?: (r: string) => void
  sortBy?: string
  setSortBy?: (s: string) => void
  trendingItems: CarouselItem[]
  onAddTitle?: (item: CarouselItem) => void
  addedTitleKeys?: Set<string>
}

export function SearchDefaultState({
  recent,
  onClearSearch,
  onClearAllRecent,
  onSelectTerm,
  onBrowseCategory,
  trendingItems,
  onAddTitle,
  addedTitleKeys,
}: SearchDefaultStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* Recent Searches */}
      {recent.length > 0 && (
        <Section
          title="Recent Searches"
          action={
            <button
              className="sp-clear-all-btn"
              onClick={onClearAllRecent}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 'var(--fs-small)',
                cursor: 'pointer',
              }}
            >
              Clear all
            </button>
          }
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {recent.map((term) => (
              <Pill
                key={term}
                clickable={true}
                onClick={() => onSelectTerm(term)}
              >
                <Clock size={12} style={{ marginRight: '6px' }} />
                <span>{term}</span>
                <button
                  type="button"
                  className="sp-pill-remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearSearch(term)
                  }}
                  aria-label={`Remove ${term} from history`}
                  style={{
                    marginLeft: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  <X size={12} />
                </button>
              </Pill>
            ))}
          </div>
        </Section>
      )}

      {/* Popular Searches */}
      <Section title="Popular Searches">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {POPULAR_SEARCHES.map((term) => (
            <Pill
              key={term}
              clickable={true}
              onClick={() => onSelectTerm(term)}
            >
              <TrendingUp size={12} style={{ marginRight: '6px', color: 'var(--brand-primary)' }} />
              <span>{term}</span>
            </Pill>
          ))}
        </div>
      </Section>

      {/* Browse by Category */}
      <Section title="Browse by Category">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 'var(--card-gap)',
          }}
        >
          {BROWSE_CATEGORIES.map((cat) => (
            <Card
              key={cat.id}
              variant="interactive"
              onClick={() => onBrowseCategory(cat.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-5) var(--space-4)',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '2rem' }}>{cat.icon}</span>
              <span style={{ fontSize: 'var(--fs-card-title)', fontWeight: 600 }}>{cat.label}</span>
            </Card>
          ))}
        </div>
      </Section>

      {/* Trending This Week Carousel */}
      <SearchTrendingRail
        trendingItems={trendingItems}
        onAddTitle={onAddTitle}
        addedTitleKeys={addedTitleKeys}
      />
    </div>
  )
}
