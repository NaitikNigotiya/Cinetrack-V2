import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAppStore } from '@/domain/store'
import { selectFavoritesList } from '@/domain/selectors'
import { toggleFavorite } from '@/domain/operations'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  PageShell,
  PageHeader,
  FilterBar,
  Pill,
  EmptyStateCard,
  PosterGrid,
  PosterCard,
  Button,
  toast,
} from '@/shared/ui'
import './FavoritesPage.css'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid
  const library = useAppStore((state) => state.library)

  const [activeFilter, setActiveFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title' | 'year'>('date')

  const favorites = useMemo(() => selectFavoritesList(library, sortBy), [library, sortBy])
  const moviesCount = useMemo(() => favorites.filter((e) => e.type === 'movie').length, [favorites])
  const tvCount = useMemo(() => favorites.filter((e) => e.type === 'tv').length, [favorites])

  const filteredFavorites = useMemo(() => {
    return favorites.filter((e) => {
      if (activeFilter === 'Movies') return e.type === 'movie'
      if (activeFilter === 'TV Shows') return e.type === 'tv'
      return true
    })
  }, [favorites, activeFilter])

  const handleToggleFavorite = async (e: React.MouseEvent, titleKey: string, currentFav: boolean) => {
    e.stopPropagation()
    if (!uid) return
    try {
      await toggleFavorite(uid, titleKey, !currentFav)
      toast.success(currentFav ? 'Removed from favorites' : 'Saved to favorites')
    } catch {
      toast.error('Failed to update favorite')
    }
  }

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
        onSortChange={(val) => setSortBy(val as any)}
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
              onToggleFavorite={(e) => handleToggleFavorite(e, entry.titleKey, true)}
              onClick={() => navigate(`/title/${entry.titleKey}`)}
            />
          ))}
        </PosterGrid>
      )}
    </PageShell>
  )
}
