import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Film,
  ChevronDown,
} from 'lucide-react'

import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { addToLibrary } from '@/features/library/api/libraryApi'
import { useSearch } from '../hooks/useSearch'
import { useRecentSearches } from '../hooks/useRecentSearches'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { BottomSheet } from '@/shared/ui/BottomSheet/BottomSheet'
import { PosterCard } from '@/shared/ui/PosterCard/PosterCard'
import { toast } from '@/shared/ui'
import type { NormalisedMediaItem } from '@/services/tmdb/normalize'
import type { LibraryStatus } from '@/shared/schemas'

import './SearchPage.css'

// ─── Constants ────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'movie' | 'tv'

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Movies', value: 'movie' },
  { label: 'TV Shows', value: 'tv' },
]

const STATUS_OPTIONS: { emoji: string; label: string; value: LibraryStatus }[] = [
  { emoji: '👁', label: 'Watching', value: 'watching' },
  { emoji: '✓', label: 'Completed', value: 'completed' },
  { emoji: '🕐', label: 'Plan to Watch', value: 'plan_to_watch' },
  { emoji: '✗', label: 'Dropped', value: 'dropped' },
]

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

// ─── Skeleton Grid ────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="media-card-grid" aria-label="Loading results…">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="sp-skeleton-card">
          <div className="skeleton sp-skeleton-poster" />
          <div className="skeleton sp-skeleton-line" />
          <div className="skeleton sp-skeleton-line sp-skeleton-line--short" />
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div className="sp-empty animate-fade-in">
      <span className="sp-empty-icon" aria-hidden="true">🔍</span>
      <p className="sp-empty-title">No results for "{query}"</p>
      <p className="sp-empty-desc">Try different keywords or check spelling</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const { user } = useAuthStore()
  const uid = user?.uid

  const { entries: libraryEntries } = useLibrary('all')
  const libraryTitleKeys = useMemo(
    () => new Set(libraryEntries.map((e) => e.titleKey)),
    [libraryEntries]
  )

  const inputRef = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Use search hook
  const {
    query,
    setQuery,
    debouncedQuery,
    typeFilter,
    setTypeFilter,
    results,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useSearch(initialQuery)

  const { recent, addSearch, clearSearch, clearAll } = useRecentSearches()

  // Additional Filter State
  const [showFilters, setShowFilters] = useState(false)
  const [genre, setGenre] = useState('All')
  const [year, setYear] = useState('All')
  const [rating, setRating] = useState('All')
  const [sortBy, setSortBy] = useState('Popular')

  // Bottom Sheet State for adding to library
  const [selectedResult, setSelectedResult] = useState<NormalisedMediaItem | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>('plan_to_watch')
  const [isAdding, setIsAdding] = useState(false)

  // Trending rail query
  const { data: trendingData } = useQuery({
    queryKey: ['trending', 'week'],
    queryFn: () => tmdbClient.getTrending('all', 'week', 1),
    staleTime: 30 * 60 * 1000,
  })

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Infinite scrolling observer
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage()
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (val.trim()) {
      setSearchParams({ q: val.trim() }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      addSearch(query.trim())
    }
  }

  const handlePillClick = (term: string) => {
    setQuery(term)
    addSearch(term)
    setSearchParams({ q: term }, { replace: true })
    inputRef.current?.focus()
  }

  const handleBrowseCategory = (id: string) => {
    if (id === 'movie') {
      setTypeFilter('movie')
    } else if (id === 'tv') {
      setTypeFilter('tv')
    }
    inputRef.current?.focus()
  }

  const handleOpenAdd = (item: NormalisedMediaItem) => {
    if (query.trim().length >= 2) {
      addSearch(query.trim())
    }
    setSelectedResult(item)
    setSelectedStatus('plan_to_watch')
  }

  const handleConfirmAdd = async () => {
    if (!selectedResult || !uid) {
      toast.info('Please sign in to add to your library')
      return
    }
    setIsAdding(true)
    try {
      await addToLibrary(uid, {
        titleKey: selectedResult.titleKey,
        tmdbId: selectedResult.id,
        type: selectedResult.type,
        title: selectedResult.title,
        year: selectedResult.year,
        posterPath: selectedResult.posterPath,
        backdropPath: selectedResult.backdropPath,
        genres: selectedResult.genreIds.map((id) => ({ id, name: '' })),
        status: selectedStatus,
      })
      toast.success(`Added "${selectedResult.title}" to ${selectedStatus.replace(/_/g, ' ')}`)
      setSelectedResult(null)
    } catch (err) {
      console.error('[CineTrack] Add failed:', err)
      toast.error('Failed to add title. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  // Filter & Sort results
  const filteredResults = useMemo(() => {
    let list = [...results]

    if (genre !== 'All') {
      // Keep all or filter if genre maps are available
    }

    if (year !== 'All') {
      if (year.endsWith('s')) {
        const decade = parseInt(year.slice(0, 4), 10)
        list = list.filter((r) => r.year && r.year >= decade && r.year < decade + 10)
      } else {
        const y = parseInt(year, 10)
        list = list.filter((r) => r.year === y)
      }
    }

    if (rating !== 'All') {
      const min = parseFloat(rating.replace('+', ''))
      list = list.filter((r) => r.voteAverage != null && r.voteAverage >= min)
    }

    if (sortBy === 'Rating') {
      list.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))
    } else if (sortBy === 'Latest') {
      list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    } else if (sortBy === 'Title A-Z') {
      list.sort((a, b) => a.title.localeCompare(b.title))
    }

    return list
  }, [results, genre, year, rating, sortBy])

  const hasQuery = debouncedQuery.trim().length >= 2
  const trendingItems = (trendingData?.results ?? []).slice(0, 20)

  return (
    <div className="sp-page">
      <div className="sp-inner">
        {/* ── Sticky Search Bar ─────────────────────────────────────────────── */}
        <div className="sp-sticky-header">
          <div className="sp-input-wrap">
            <span className="sp-input-icon" aria-hidden="true">
              <Search size={20} />
            </span>

            <input
              ref={inputRef}
              id="search-input"
              className="sp-input"
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search movies, TV shows, actors..."
              aria-label="Search movies, TV shows, and actors"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />

            {query && (
              <div className="sp-input-right">
                <button
                  className="sp-clear-btn"
                  onClick={() => handleQueryChange('')}
                  aria-label="Clear search"
                  type="button"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {!query && (
              <div className="sp-kbd-hint" aria-hidden="true">
                ⌘K
              </div>
            )}
          </div>
        </div>

        {/* ── Default State (No Query) ──────────────────────────────────────── */}
        {!hasQuery && (
          <div className="sp-default-state animate-fade-in">
            {/* Recent Searches */}
            {recent.length > 0 && (
              <section className="sp-section" aria-label="Recent searches">
                <div className="sp-section-header">
                  <h2 className="sp-section-title">Recent Searches</h2>
                  <button className="sp-section-clear" onClick={clearAll} type="button">
                    Clear all
                  </button>
                </div>
                <div className="sp-pills-row">
                  {recent.slice(0, 8).map((q) => (
                    <button
                      key={q}
                      className="sp-pill sp-pill--recent"
                      onClick={() => handlePillClick(q)}
                      type="button"
                    >
                      <Clock size={12} aria-hidden="true" />
                      <span>{q}</span>
                      <span
                        className="sp-pill-remove"
                        role="button"
                        aria-label={`Remove ${q}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          clearSearch(q)
                        }}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation()
                            clearSearch(q)
                          }
                        }}
                      >
                        <X size={11} />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Popular Searches */}
            <section className="sp-section" aria-label="Popular searches">
              <div className="sp-section-header">
                <h2 className="sp-section-title">Popular Searches</h2>
              </div>
              <div className="sp-pills-row">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    className="sp-pill sp-pill--popular"
                    onClick={() => handlePillClick(term)}
                    type="button"
                  >
                    <TrendingUp size={12} aria-hidden="true" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Browse By */}
            <section className="sp-section" aria-label="Browse by category">
              <div className="sp-section-header">
                <h2 className="sp-section-title">Browse by</h2>
              </div>
              <div className="sp-browse-grid">
                {BROWSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className="sp-browse-card"
                    onClick={() => handleBrowseCategory(cat.id)}
                    type="button"
                  >
                    <span className="sp-browse-icon">{cat.icon}</span>
                    <span className="sp-browse-label">{cat.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Filters */}
            <section className="sp-section" aria-label="Filters">
              <div className="sp-section-header">
                <h2 className="sp-section-title">Filters</h2>
                <button
                  className="sp-advanced-toggle"
                  onClick={() => setShowFilters((v) => !v)}
                  type="button"
                >
                  Advanced <ChevronDown size={12} className={showFilters ? 'sp-chevron-up' : ''} />
                </button>
              </div>
              <div className={`sp-filters-row ${showFilters ? 'sp-filters-row--visible' : ''}`}>
                <div className="sp-filter-group">
                  <label className="sp-filter-label" htmlFor="sp-genre">Genre</label>
                  <select
                    id="sp-genre"
                    className="sp-filter-select"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                  >
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="sp-filter-group">
                  <label className="sp-filter-label" htmlFor="sp-year">Year</label>
                  <select
                    id="sp-year"
                    className="sp-filter-select"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="sp-filter-group">
                  <label className="sp-filter-label" htmlFor="sp-rating">Rating</label>
                  <select
                    id="sp-rating"
                    className="sp-filter-select"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  >
                    {RATING_OPTIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="sp-filter-group">
                  <label className="sp-filter-label" htmlFor="sp-sort">Sort By</label>
                  <select
                    id="sp-sort"
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
            </section>

            {/* Trending This Week */}
            {trendingItems.length > 0 && (
              <section className="sp-section" aria-label="Trending this week">
                <div className="sp-section-header">
                  <h2 className="sp-section-title">Trending This Week</h2>
                </div>
                <div className="sp-trending-rail">
                  {trendingItems.map((item: any) => {
                    const poster = getPosterUrl(item.poster_path, 'w185')
                    const mediaType = item.media_type || (item.release_date ? 'movie' : 'tv')
                    const titleKey = `${mediaType}:${item.id}`
                    const title = item.title ?? item.name ?? 'Untitled'
                    return (
                      <div
                        key={item.id}
                        className="sp-trending-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/title/${titleKey}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/title/${titleKey}`)
                        }}
                        aria-label={title}
                      >
                        {poster ? (
                          <img
                            src={poster}
                            alt={title}
                            className="sp-trending-poster"
                            loading="lazy"
                          />
                        ) : (
                          <div className="sp-trending-no-poster">
                            <Film size={20} color="var(--text-muted)" />
                          </div>
                        )}
                        <p className="sp-trending-title">{title}</p>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Results State (Has Query) ─────────────────────────────────────── */}
        {hasQuery && (
          <div className="sp-results-state">
            {/* Filter pills row */}
            <div className="sp-filter-pills" role="group" aria-label="Filter results by type">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`sp-filter-pill ${typeFilter === opt.value ? 'sp-filter-pill--active' : ''}`}
                  onClick={() => setTypeFilter(opt.value)}
                  aria-pressed={typeFilter === opt.value}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Loading */}
            {isLoading && <SkeletonGrid />}

            {/* Error */}
            {isError && !isLoading && (
              <div className="sp-empty animate-fade-in">
                <span className="sp-empty-icon">⚠️</span>
                <p className="sp-empty-title">Something went wrong</p>
                <p className="sp-empty-desc">Check your connection and try again.</p>
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && !isError && filteredResults.length > 0 && (
              <div
                className="media-card-grid animate-fade-in"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '16px',
                }}
              >
                {filteredResults.map((result) => {
                  const isInWatchlist = libraryTitleKeys.has(result.titleKey)
                  return (
                    <PosterCard
                      key={result.titleKey}
                      title={result.title}
                      year={result.year}
                      posterPath={result.posterPath}
                      rating={result.voteAverage}
                      type={result.type}
                      showAddButton={true}
                      isInWatchlist={isInWatchlist}
                      onClick={() => {
                        addSearch(query.trim())
                        navigate(`/title/${result.titleKey}`)
                      }}
                      onAddClick={(e) => {
                        e.stopPropagation()
                        handleOpenAdd(result)
                      }}
                    />
                  )
                })}
              </div>
            )}

            {/* Infinite Scroll Sentinel */}
            {hasNextPage && <div ref={sentinelRef} style={{ height: '40px' }} />}

            {/* No results */}
            {!isLoading && !isError && filteredResults.length === 0 && (
              <EmptyState query={debouncedQuery} />
            )}
          </div>
        )}
      </div>

      {/* ── Add to Watchlist Bottom Sheet ─────────────────────────────────── */}
      <BottomSheet
        isOpen={selectedResult !== null}
        onClose={() => setSelectedResult(null)}
        label="Add to library"
      >
        {selectedResult && (
          <div className="sp-add-sheet">
            <div className="sp-add-header">
              {getPosterUrl(selectedResult.posterPath, 'w185') ? (
                <img
                  src={getPosterUrl(selectedResult.posterPath, 'w185')!}
                  alt={selectedResult.title}
                  className="sp-add-thumb"
                />
              ) : (
                <div className="sp-add-thumb-placeholder">
                  <Film size={20} color="var(--text-muted)" />
                </div>
              )}
              <div className="sp-add-meta">
                <p className="sp-add-title">{selectedResult.title}</p>
                <p className="sp-add-year">{selectedResult.year ?? '—'}</p>
                <span
                  className={`sp-add-type-badge ${
                    selectedResult.type === 'movie'
                      ? 'sp-add-type-badge--movie'
                      : 'sp-add-type-badge--tv'
                  }`}
                >
                  {selectedResult.type === 'movie' ? 'Movie' : 'TV Show'}
                </span>
              </div>
            </div>

            <div className="sp-status-grid" role="radiogroup" aria-label="Watch status">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`sp-status-btn ${
                    selectedStatus === opt.value ? 'sp-status-btn--active' : ''
                  }`}
                  onClick={() => setSelectedStatus(opt.value)}
                  role="radio"
                  aria-checked={selectedStatus === opt.value}
                  type="button"
                >
                  <span aria-hidden="true">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <button
              className="sp-confirm-btn"
              onClick={handleConfirmAdd}
              disabled={isAdding}
              type="button"
            >
              {isAdding ? 'Adding…' : 'Add to Library'}
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
