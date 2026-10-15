import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSearch } from '../hooks/useSearch'
import { PosterCard, Skeleton, EmptyState } from '@/shared/ui'
import { makeTitleKey } from '@/shared/lib/ids'
import { Search, X, Film } from 'lucide-react'
import clsx from 'clsx'
import styles from './SearchPage.module.css'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('q') || ''
  const shouldAutoFocus = searchParams.get('add') === 'true'
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    yearFilter,
    setYearFilter,
    recentSearches,
    clearRecentSearches,
    results,
    isLoading,
    isSearching,
  } = useSearch(initialQuery)

  useEffect(() => {
    if (shouldAutoFocus) {
      inputRef.current?.focus()
    }
  }, [shouldAutoFocus])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (val.trim()) {
      setSearchParams({ q: val.trim() }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  const handleCardClick = (type: 'movie' | 'tv', id: number) => {
    const titleKey = makeTitleKey(type, id)
    navigate(`/title/${titleKey}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchHeader}>
        <div className={styles.searchBarWrapper}>
          <span className={styles.searchIcon} aria-hidden="true">
            <Search size={20} />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search movies, TV shows, anime..."
            className={styles.searchInput}
            aria-label="Search titles"
          />
          {query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => handleQueryChange('')}
              aria-label="Clear search"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className={styles.filtersRow}>
          <div className={styles.typePills} role="group" aria-label="Filter by type">
            <button
              type="button"
              className={clsx(styles.pill, typeFilter === 'all' && styles.pillActive)}
              onClick={() => setTypeFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={clsx(styles.pill, typeFilter === 'movie' && styles.pillActive)}
              onClick={() => setTypeFilter('movie')}
            >
              Movies
            </button>
            <button
              type="button"
              className={clsx(styles.pill, typeFilter === 'tv' && styles.pillActive)}
              onClick={() => setTypeFilter('tv')}
            >
              TV Shows
            </button>
          </div>

          <select
            className={styles.yearSelect}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            aria-label="Filter by release year"
          >
            <option value="">All Years</option>
            {Array.from({ length: 35 }).map((_, i) => {
              const yr = 2026 - i
              return (
                <option key={yr} value={yr.toString()}>
                  {yr}
                </option>
              )
            })}
          </select>
        </div>

        {/* Recent Searches */}
        {!isSearching && recentSearches.length > 0 && (
          <div className={styles.recentSection}>
            <span className={styles.recentLabel}>Recent:</span>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                className={styles.recentChip}
                onClick={() => handleQueryChange(term)}
              >
                {term}
              </button>
            ))}
            <button
              type="button"
              className={styles.clearRecentBtn}
              onClick={clearRecentSearches}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
          {isSearching ? `Search Results (${results.length})` : 'Trending This Week'}
        </h2>

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
        ) : results.length > 0 ? (
          <div className={styles.grid}>
            {results.map((item) => {
              const type = (item.media_type || (item.title ? 'movie' : 'tv')) as 'movie' | 'tv'
              const title = item.title || item.name || 'Untitled'
              const yearStr = item.release_date || item.first_air_date
              const year = yearStr ? parseInt(yearStr.slice(0, 4), 10) : null

              return (
                <PosterCard
                  key={`${type}-${item.id}`}
                  title={title}
                  posterPath={item.poster_path}
                  year={year}
                  type={type}
                  rating={item.vote_average}
                  onClick={() => handleCardClick(type, item.id)}
                />
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Film size={40} />}
            title="No titles found"
            description={
              query
                ? `We couldn't find any titles matching "${query}". Try searching for something else.`
                : 'No trending titles available.'
            }
          />
        )}
      </div>
    </div>
  )
}
