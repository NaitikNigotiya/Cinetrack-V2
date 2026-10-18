import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { addToLibrary } from '@/features/library/api/libraryApi'
import { useInfiniteSearch } from '@/services/tmdb/hooks'
import { useRecentSearches } from '../hooks/useRecentSearches'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { PosterCard } from '@/shared/ui/PosterCard/PosterCard'
import { toast } from '@/shared/ui'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { SearchField } from '@/shared/ui/layout/SearchField'
import { FilterBar } from '@/shared/ui/layout/FilterBar'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'
import { SearchDefaultState } from './SearchDefaultState'
import { SearchAddToLibrarySheet } from './SearchAddToLibrarySheet'
import { FILTER_TABS, filterAndSortSearchResults, SkeletonGrid } from './searchHelpers'
import type { NormalisedMediaItem } from '@/services/tmdb/normalize'
import type { LibraryStatus } from '@/shared/schemas'
import './SearchPage.css'

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  const { user } = useAuthStore()
  const uid = user?.uid
  const { entries, refetch: refetchLibrary } = useLibrary('all')
  const libraryTitleKeys = useMemo(() => new Set(entries.map((e) => e.titleKey)), [entries])

  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all')

  const [genre, setGenre] = useState('All')
  const [year, setYear] = useState('All')
  const [rating, setRating] = useState('All')
  const [sortBy, setSortBy] = useState('Popular')

  const [selectedResult, setSelectedResult] = useState<NormalisedMediaItem | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>('plan_to_watch')
  const [isAdding, setIsAdding] = useState(false)

  const { recent, addSearch, clearSearch, clearAll } = useRecentSearches()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(val)
      setSearchParams(val ? { q: val } : {}, { replace: true })
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  useEffect(() => {
    const handleGlobalSlash = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalSlash)
    return () => window.removeEventListener('keydown', handleGlobalSlash)
  }, [])

  const handlePillClick = (term: string) => {
    setQuery(term)
    setDebouncedQuery(term)
    setSearchParams({ q: term })
    addSearch(term)
  }

  const handleBrowseCategory = (catId: string) => {
    if (catId === 'movie' || catId === 'tv') {
      setTypeFilter(catId)
      setQuery('2024')
      setDebouncedQuery('2024')
    } else {
      setQuery(catId)
      setDebouncedQuery(catId)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      addSearch(query.trim())
    }
  }

  const {
    data: searchData,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteSearch(debouncedQuery, {
    type: typeFilter === 'all' ? 'multi' : typeFilter,
  })

  const results = useMemo(() => {
    return searchData?.pages.flatMap((p) => p.results) ?? []
  }, [searchData])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const { data: trendingData } = useQuery({
    queryKey: ['trending', 'week'],
    queryFn: () => tmdbClient.getTrending('all', 'week'),
    staleTime: 30 * 60 * 1000,
  })

  const handleOpenAdd = (item: NormalisedMediaItem) => {
    setSelectedResult(item)
    setSelectedStatus('plan_to_watch')
  }

  const handleConfirmAdd = async () => {
    if (!selectedResult || !uid) return
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
        status: selectedStatus,
      })
      toast.success(`Added "${selectedResult.title}" to library`)
      setSelectedResult(null)
      refetchLibrary()
    } catch {
      toast.error('Failed to add title to library')
    } finally {
      setIsAdding(false)
    }
  }

  const filteredResults = useMemo(
    () => filterAndSortSearchResults(results, year, rating, sortBy),
    [results, year, rating, sortBy]
  )

  const hasQuery = debouncedQuery.trim().length >= 2
  const trendingItems = (trendingData?.results ?? []).slice(0, 20)

  return (
    <PageShell>
      <PageHeader
        eyebrow="FIND"
        title="Search"
        subtitle="Discover movies, TV shows, cast, and crew"
      >
        <SearchField
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="Search movies, TV shows, actors..."
          showShortcutHint={true}
          aria-label="Search movies, TV shows, and actors"
          ref={inputRef}
          id="search-input"
        />
      </PageHeader>

      {!hasQuery && (
        <SearchDefaultState
          recent={recent}
          onClearSearch={clearSearch}
          onClearAllRecent={clearAll}
          onSelectTerm={handlePillClick}
          onBrowseCategory={handleBrowseCategory}
          genre={genre}
          setGenre={setGenre}
          year={year}
          setYear={setYear}
          rating={rating}
          setRating={setRating}
          sortBy={sortBy}
          setSortBy={setSortBy}
          trendingItems={trendingItems}
        />
      )}

      {hasQuery && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
          <FilterBar
            tabs={FILTER_TABS}
            activeTab={typeFilter}
            onTabChange={(t) => setTypeFilter(t as 'all' | 'movie' | 'tv')}
          />

          {isLoading && <SkeletonGrid />}

          {isError && !isLoading && (
            <EmptyStateCard
              icon="⚠️"
              title="Something went wrong"
              description="Check your connection and try again."
            />
          )}

          {!isLoading && !isError && filteredResults.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 'var(--card-gap)',
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

          {hasNextPage && <div ref={sentinelRef} style={{ height: '40px' }} />}

          {!isLoading && !isError && filteredResults.length === 0 && (
            <EmptyStateCard
              icon="🔍"
              title={`No results for "${debouncedQuery}"`}
              description="Try different keywords or check your spelling."
            />
          )}
        </div>
      )}

      <SearchAddToLibrarySheet
        item={selectedResult}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onConfirm={handleConfirmAdd}
        onClose={() => setSelectedResult(null)}
        isAdding={isAdding}
      />
    </PageShell>
  )
}
