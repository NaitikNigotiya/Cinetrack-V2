import { useState, useEffect, useMemo } from 'react'
import { useInfiniteSearch, useTrending } from '@/services/tmdb/hooks'
import { parseSpecialSearchInput, resolveImdbId } from '../lib/searchResolver'
import type { NormalisedMediaItem } from '@/services/tmdb/normalize'
import type { TitleKey } from '@/shared/schemas/title'

const RECENT_SEARCHES_KEY = 'cinetrack_recent_searches'

export interface SpecialMatchState {
  titleKey: TitleKey
  label: string
}

export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(() => initialQuery.trim().replace(/\s+/g, ' '))
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [specialMatch, setSpecialMatch] = useState<SpecialMatchState | null>(null)

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Debounce input by 300ms and collapse whitespace
  useEffect(() => {
    const timer = setTimeout(() => {
      const collapsed = query.trim().replace(/\s+/g, ' ')
      setDebouncedQuery(collapsed)

      // Check for special URLs or IMDb IDs
      const special = parseSpecialSearchInput(collapsed)
      if (special) {
        if (special.kind === 'titleKey') {
          setSpecialMatch({
            titleKey: special.titleKey,
            label: `Direct ${special.mediaType.toUpperCase()} Link: #${special.id}`,
          })
        } else if (special.kind === 'imdb') {
          void resolveImdbId(special.imdbId).then((tk) => {
            if (tk) {
              setSpecialMatch({
                titleKey: tk,
                label: `IMDb Match for ${special.imdbId.toUpperCase()}`,
              })
            }
          })
        }
      } else {
        setSpecialMatch(null)
      }

      // Add to recent searches (case-insensitive deduplication, max 10)
      if (collapsed.length >= 2 && !special) {
        setRecentSearches((prev) => {
          const lower = collapsed.toLowerCase()
          const filtered = prev.filter((s) => s.toLowerCase() !== lower)
          const next = [collapsed, ...filtered].slice(0, 10)
          try {
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
          } catch {
            // ignore storage errors
          }
          return next
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const isSearchActive = debouncedQuery.length >= 2

  // Multi / Movie / TV infinite search
  const searchQuery = useInfiniteSearch(debouncedQuery, {
    type: typeFilter === 'all' ? 'multi' : typeFilter,
    year: yearFilter || undefined,
    enabled: isSearchActive,
  })

  // Trending fallback when query < 2 characters
  const trendingQuery = useTrending('all', 'week')

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  }

  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== term)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      return next
    })
  }

  // Flatten infinite query results
  const results = useMemo<NormalisedMediaItem[]>(() => {
    if (isSearchActive) {
      return searchQuery.data?.pages.flatMap((page) => page.results) ?? []
    }
    return trendingQuery.data?.results ?? []
  }, [isSearchActive, searchQuery.data, trendingQuery.data])

  const totalResults = isSearchActive
    ? searchQuery.data?.pages[0]?.totalResults ?? 0
    : trendingQuery.data?.totalResults ?? 0

  return {
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
    isLoading: isSearchActive ? searchQuery.isLoading : trendingQuery.isLoading,
    isFetchingNextPage: searchQuery.isFetchingNextPage,
    hasNextPage: Boolean(searchQuery.hasNextPage),
    fetchNextPage: searchQuery.fetchNextPage,
    isSearching: isSearchActive,
    isError: isSearchActive ? searchQuery.isError : trendingQuery.isError,
    error: isSearchActive ? searchQuery.error : trendingQuery.error,
    refetch: isSearchActive ? searchQuery.refetch : trendingQuery.refetch,
  }
}
