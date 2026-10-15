import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLibrary, type LibraryTab, type SortOption } from '../hooks/useLibrary'
import { Tabs, PosterCard, Skeleton, EmptyState, Button } from '@/shared/ui'
import { Film, Plus } from 'lucide-react'
import styles from './LibraryPage.module.css'

export default function LibraryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = (searchParams.get('status') as LibraryTab) || 'all'

  const { filters, setFilters, entries, counts, totalCount, isLoading } = useLibrary(currentTab)

  const handleTabChange = (tabId: string) => {
    const tab = tabId as LibraryTab
    setFilters((prev) => ({ ...prev, tab }))
    if (tab === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ status: tab })
    }
  }

  const tabs = [
    { id: 'all', label: 'All', count: totalCount },
    { id: 'watching', label: 'Watching', count: counts['watching'] || 0 },
    { id: 'plan_to_watch', label: 'Plan to Watch', count: counts['plan_to_watch'] || 0 },
    { id: 'completed', label: 'Completed', count: counts['completed'] || 0 },
    { id: 'on_hold', label: 'On Hold', count: counts['on_hold'] || 0 },
    { id: 'dropped', label: 'Dropped', count: counts['dropped'] || 0 },
    { id: 'favorites', label: 'Favorites' },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>My Library</h1>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => navigate('/search?add=true')}
          >
            Add Title
          </Button>
        </div>

        {/* Status Tabs */}
        <Tabs tabs={tabs} activeTab={filters.tab} onChange={handleTabChange} />

        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.leftControls}>
            <input
              type="search"
              placeholder="Filter library..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className={styles.searchInput}
              aria-label="Filter titles"
            />

            <select
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as 'all' | 'movie' | 'tv' }))}
              className={styles.selectInput}
              aria-label="Filter by type"
            >
              <option value="all">All Media</option>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
            </select>
          </div>

          <div className={styles.rightControls}>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as SortOption }))}
              className={styles.selectInput}
              aria-label="Sort library"
            >
              <option value="updatedAt">Recently Updated</option>
              <option value="addedAt">Date Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="year">Release Year</option>
              <option value="rating">My Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton width="100%" height={260} />
              <Skeleton width="80%" height={16} />
              <Skeleton width="40%" height={12} />
            </div>
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className={styles.grid}>
          {entries.map((entry) => {
            const tvProgress =
              entry.type === 'tv' && entry.tv && entry.tv.totalEpisodes
                ? { watched: entry.tv.episodesWatched, total: entry.tv.totalEpisodes }
                : undefined

            return (
              <PosterCard
                key={entry.titleKey}
                title={entry.title}
                posterPath={entry.posterPath}
                year={entry.year}
                type={entry.type}
                status={entry.status}
                rating={entry.rating}
                progress={tvProgress}
                onClick={() => navigate(`/title/${entry.titleKey}`)}
              />
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Film size={40} />}
          title={
            filters.tab === 'all'
              ? 'Your library is empty'
              : `No titles in ${filters.tab.replace('_', ' ')}`
          }
          description="Find movies and TV shows to add to your personal watchlist."
          action={
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => navigate('/search')}
            >
              Search TMDB
            </Button>
          }
        />
      )}
    </div>
  )
}
