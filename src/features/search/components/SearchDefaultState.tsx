import { useState } from 'react'
import { Clock, TrendingUp, X, ChevronDown } from 'lucide-react'
import { Section } from '@/shared/ui/layout/Section'
import { Card } from '@/shared/ui/layout/Card'
import { Pill } from '@/shared/ui/layout/Pill'
import { SearchTrendingRail } from './SearchTrendingRail'

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

const GENRE_OPTIONS = [
  'All', 'Action', 'Comedy', 'Drama', 'Horror',
  'Sci-Fi', 'Thriller', 'Romance', 'Animation', 'Documentary',
]
const YEAR_OPTIONS = ['All', '2025', '2024', '2023', '2022', '2021', '2020', '2010s', '2000s', '1990s']
const RATING_OPTIONS = ['All', '9+', '8+', '7+', '6+']
const SORT_OPTIONS = ['Popular', 'Latest', 'Rating', 'Title A-Z']

interface SearchDefaultStateProps {
  recent: string[]
  onClearSearch: (q: string) => void
  onClearAllRecent: () => void
  onSelectTerm: (term: string) => void
  onBrowseCategory: (id: string) => void
  genre: string
  setGenre: (g: string) => void
  year: string
  setYear: (y: string) => void
  rating: string
  setRating: (r: string) => void
  sortBy: string
  setSortBy: (s: string) => void
  trendingItems: Array<{
    id: number
    poster_path?: string | null | undefined
    media_type?: string | undefined
    release_date?: string | null | undefined
    first_air_date?: string | null | undefined
    title?: string | undefined
    name?: string | undefined
  }>
}

export function SearchDefaultState({
  recent,
  onClearSearch,
  onClearAllRecent,
  onSelectTerm,
  onBrowseCategory,
  genre,
  setGenre,
  year,
  setYear,
  rating,
  setRating,
  sortBy,
  setSortBy,
  trendingItems,
}: SearchDefaultStateProps) {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

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

      {/* Filter Drawer */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <button
          className="sp-filter-drawer-toggle"
          onClick={() => setFilterDrawerOpen((o) => !o)}
          type="button"
          aria-expanded={filterDrawerOpen}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span style={{ fontSize: 'var(--fs-section-title)', fontWeight: 700 }}>
            Advanced Filters
          </span>
          <ChevronDown
            size={18}
            style={{
              transition: 'transform 0.2s',
              transform: filterDrawerOpen ? 'rotate(180deg)' : 'none',
            }}
          />
        </button>

        {filterDrawerOpen && (
          <div
            className="sp-filter-drawer-body"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 'var(--space-4)',
              marginTop: 'var(--space-4)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <label className="sp-filter-label">Genre</label>
              <select
                className="sp-filter-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="sp-filter-label">Year / Decade</label>
              <select
                className="sp-filter-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="sp-filter-label">Min Rating</label>
              <select
                className="sp-filter-select"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                {RATING_OPTIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="sp-filter-label">Sort By</label>
              <select
                className="sp-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Card>

      <SearchTrendingRail trendingItems={trendingItems} />
    </div>
  )
}
