import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSearch } from '../hooks/useSearch'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { addToLibrary, removeFromLibraryWithUndo } from '@/features/library/api/libraryApi'
import { useAuthStore } from '@/features/auth/store/authStore'
import { Skeleton, EmptyState, toast } from '@/shared/ui'
import { Film, AlertTriangle } from 'lucide-react'
import { SearchHeader } from './SearchHeader'
import { SearchResultsGrid } from './SearchResultsGrid'
import styles from './SearchPage.module.css'
import type { NormalisedMediaItem } from '@/services/tmdb/normalize'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('q') || ''
  const shouldAutoFocus = searchParams.get('add') === 'true'
  const inputRef = useRef<HTMLInputElement>(null)
  const observerRef = useRef<HTMLDivElement>(null)

  const { user } = useAuthStore()
  const uid = user?.uid
  const { entries: libraryEntries } = useLibrary('all')

  const libraryMap = useMemo(() => {
    return new Map(libraryEntries.map((e) => [e.titleKey, e]))
  }, [libraryEntries])

  const {
    query,
    setQuery,
    debouncedQuery,
    typeFilter,
    setTypeFilter,
    yearFilter,
    setYearFilter,
    recentSearches,
    removeRecentSearch,
    clearRecentSearches,
    results,
    totalResults,
    specialMatch,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isSearching,
    isError,
    error,
    refetch,
  } = useSearch(initialQuery)

  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)

  useEffect(() => {
    if (shouldAutoFocus) inputRef.current?.focus()
  }, [shouldAutoFocus])

  const handleQueryChange = (val: string) => {
    setHighlightedIndex(-1)
    setQuery(val)
    if (val.trim()) setSearchParams({ q: val.trim() }, { replace: true })
    else setSearchParams({}, { replace: true })
  }

  const handleQuickAdd = useCallback(
    async (item: NormalisedMediaItem) => {
      if (!uid) {
        toast.info('Please sign in to add titles to your library.')
        return
      }
      try {
        await addToLibrary(uid, {
          titleKey: item.titleKey,
          tmdbId: item.id,
          type: item.type,
          title: item.title,
          year: item.year,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          status: 'plan_to_watch',
        })
        toast.success(`Added "${item.title}" to library`, {
          label: 'Undo',
          onClick: async () => {
            const entry = libraryMap.get(item.titleKey)
            if (entry) await removeFromLibraryWithUndo(uid, item.titleKey, entry)
          },
        })
      } catch (err) {
        console.error('Failed to add title to library:', err)
        toast.error('Failed to add title to library. Please try again.')
      }
    },
    [uid, libraryMap]
  )

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchNextPage()
      },
      { threshold: 0.1 }
    )
    const el = observerRef.current
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputActive = document.activeElement === inputRef.current
      const hasResults = results.length > 0

      if (e.key === 'ArrowDown') {
        if (!hasResults) return
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        if (!hasResults) return
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
      } else if (e.key === 'Enter') {
        if (specialMatch) {
          e.preventDefault()
          navigate(`/title/${specialMatch.titleKey}`)
          return
        }
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          e.preventDefault()
          navigate(`/title/${results[highlightedIndex]!.titleKey}`)
        } else if (hasResults && isInputActive) {
          e.preventDefault()
          navigate(`/title/${results[0]!.titleKey}`)
        }
      } else if ((e.key === 'a' || e.key === 'A') && !isInputActive) {
        const target = highlightedIndex >= 0 ? results[highlightedIndex] : results[0]
        if (target && !libraryMap.has(target.titleKey)) {
          e.preventDefault()
          void handleQuickAdd(target)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [results, highlightedIndex, specialMatch, navigate, libraryMap, handleQuickAdd])

  return (
    <div className={styles.container}>
      <SearchHeader
        query={query}
        onQueryChange={handleQueryChange}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        yearFilter={yearFilter}
        onYearFilterChange={setYearFilter}
        recentSearches={recentSearches}
        onSelectRecent={handleQueryChange}
        onRemoveRecent={removeRecentSearch}
        onClearRecent={clearRecentSearches}
        specialMatch={specialMatch}
        onOpenSpecialMatch={(tk) => navigate(`/title/${tk}`)}
        inputRef={inputRef}
      />

      <div>
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            {isSearching ? `Search Results (${totalResults})` : 'Trending This Week'}
          </h2>
          <div className={styles.keyboardHint} aria-hidden="true">
            <span><kbd className={styles.kbd}>↑</kbd><kbd className={styles.kbd}>↓</kbd> navigate</span>
            <span><kbd className={styles.kbd}>↵</kbd> open</span>
            <span><kbd className={styles.kbd}>a</kbd> quick add</span>
          </div>
        </div>

        {isError ? (
          <div className={styles.errorBox}>
            <AlertTriangle size={36} color="var(--accent)" />
            <div className={styles.errorTitle}>Unable to fetch results</div>
            <div className={styles.errorDesc}>
              {error instanceof Error ? error.message : 'Something went wrong while contacting TMDB.'}
            </div>
            <button type="button" className={styles.retryBtn} onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton width="100%" height={260} />
                <Skeleton width="80%" height={16} />
                <Skeleton width="40%" height={12} />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <SearchResultsGrid
            results={results}
            highlightedIndex={highlightedIndex}
            libraryMap={libraryMap}
            onCardClick={(tk) => navigate(`/title/${tk}`)}
            onQuickAdd={handleQuickAdd}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onFetchNextPage={() => fetchNextPage()}
            observerRef={observerRef}
          />
        ) : (
          <div>
            <EmptyState
              icon={<Film size={40} />}
              title="No titles found"
              description={
                isSearching
                  ? `We couldn't find any titles matching "${debouncedQuery}".`
                  : 'No trending titles available.'
              }
            />
            {isSearching && (
              <div className={styles.spellingBox}>
                <div className={styles.spellingTitle}>Search Suggestions & Tips</div>
                <div className={styles.spellingDesc}>
                  • Check spelling or try a shorter title keyword.<br />
                  • If searching for non-English titles, try the original name or English translation.<br />
                  • Try setting Year to "All Years" or Type to "All".
                </div>
                {(yearFilter || typeFilter !== 'all') && (
                  <button
                    type="button"
                    className={styles.resetFiltersBtn}
                    onClick={() => {
                      setYearFilter('')
                      setTypeFilter('all')
                    }}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
