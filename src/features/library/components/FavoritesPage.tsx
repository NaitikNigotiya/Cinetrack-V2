import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useLibrary } from '../hooks/useLibrary'
import {
  PageShell,
  PageHeader,
  FilterBar,
  Pill,
  EmptyStateCard,
  PosterGrid,
  PosterCard,
  Button,
} from '@/shared/ui'
import './FavoritesPage.css'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { entries } = useLibrary('favorites')
  const [activeFilter, setActiveFilter] = useState('All')
  const [sortBy, setSortBy] = useState('date')

  const favorites = useMemo(() => entries.filter((e) => e.isFavorite), [entries])
  const moviesCount = useMemo(() => favorites.filter((e) => e.type === 'movie').length, [favorites])
  const tvCount = useMemo(() => favorites.filter((e) => e.type === 'tv').length, [favorites])

  const filteredFavorites = useMemo(() => {
    return favorites
      .filter((e) => {
        if (activeFilter === 'Movies') return e.type === 'movie'
        if (activeFilter === 'TV Shows') return e.type === 'tv'
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
        if (sortBy === 'title') return a.title.localeCompare(b.title)
        if (sortBy === 'year') return (b.year ?? 0) - (a.year ?? 0)

        const getMs = (val: any) => {
          if (!val) return 0
          if (typeof val.toDate === 'function') return val.toDate().getTime()
          if (val.seconds) return val.seconds * 1000
          return new Date(val).getTime() || 0
        }
        return getMs(b.addedAt) - getMs(a.addedAt)
      })
  }, [favorites, activeFilter, sortBy])

  return (
    <PageShell>
      <PageHeader
        eyebrow={<><Sparkles size={14} /> Loved</>}
        title="Favorites"
        subtitle="Your most loved movies and shows"
        meta={
          <Pill variant="filledBrand">
            {favorites.length} {favorites.length === 1 ? 'title' : 'titles'}
          </Pill>
        }
      />

      <FilterBar
        tabs={[
          { id: 'All', label: 'All', count: favorites.length },
          { id: 'Movies', label: 'Movies', count: moviesCount },
          { id: 'TV Shows', label: 'TV Shows', count: tvCount },
        ]}
        activeTab={activeFilter}
        onTabChange={(t) => setActiveFilter(t)}
        sortOptions={[
          { value: 'date', label: 'Date Added' },
          { value: 'rating', label: 'Rating' },
          { value: 'title', label: 'Title (A-Z)' },
          { value: 'year', label: 'Year' },
        ]}
        sortValue={sortBy}
        onSortChange={(val) => setSortBy(val)}
      />

      {filteredFavorites.length === 0 ? (
        <EmptyStateCard
          icon="❤️"
          title="No favorites yet"
          description="Click the heart icon on any movie or TV show to add it to your favorites."
          action={
            <Button variant="primary" onClick={() => navigate('/search')}>
              Browse Titles
            </Button>
          }
        />
      ) : (
        <PosterGrid>
          {filteredFavorites.map((entry) => (
            <PosterCard
              key={entry.titleKey}
              title={entry.title}
              year={entry.year}
              posterPath={entry.posterPath}
              rating={entry.rating}
              type={entry.type}
              isFavorite={true}
              status={entry.status}
              onClick={() => navigate(`/title/${entry.titleKey}`)}
            />
          ))}
        </PosterGrid>
      )}
    </PageShell>
  )
}
