import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibrary } from '../hooks/useLibrary'
import { PosterCard } from '@/shared/ui/PosterCard/PosterCard'
import './FavoritesPage.css'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { entries } = useLibrary('favorites')
  const [activeFilter, setActiveFilter] = useState('All')
  const [sortBy, setSortBy] = useState('date')

  const favorites = useMemo(() => entries.filter((e) => e.isFavorite), [entries])

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
    <div className="unified-page-container" style={{ padding: '24px' }}>
      <header className="unified-page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 800 }}>Favorites</h1>
            <span
              style={{
                background: 'var(--color-brand)',
                color: 'var(--text-on-brand)',
                fontSize: '12px',
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: '999px',
              }}
            >
              {favorites.length} titles
            </span>
          </div>
          <p className="page-subtitle" style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: 4 }}>
            Your most loved movies and shows
          </p>
        </div>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="favs-sort-select"
          style={{ width: 'auto', flexShrink: 0 }}
        >
          <option value="date">Date Added</option>
          <option value="rating">Rating</option>
          <option value="title">Title A-Z</option>
          <option value="year">Year</option>
        </select>
      </header>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['All', 'Movies', 'TV Shows'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`favs-pill-btn ${activeFilter === tab ? 'favs-pill-btn--active' : ''}`}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredFavorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>❤️</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            No favorites yet
          </h3>
          <p style={{ fontSize: 14 }}>Click the heart icon on any movie or TV show to add it to your favorites.</p>
        </div>
      ) : (
        /* Poster grid */
        <div
          className="media-card-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '16px',
          }}
        >
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
        </div>
      )}
    </div>
  )
}
