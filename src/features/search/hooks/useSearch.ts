import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { tmdbKeys } from '@/services/tmdb/queryKeys'

const RECENT_SEARCHES_KEY = 'cinetrack_recent_searches'

export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Debounce query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      if (query.trim() && !recentSearches.includes(query.trim())) {
        const next = [query.trim(), ...recentSearches.filter((s) => s !== query.trim())].slice(0, 10)
        setRecentSearches(next)
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, recentSearches])

  // Multi-search query
  const searchQuery = useQuery({
    queryKey: tmdbKeys.search(debouncedQuery, typeFilter, yearFilter),
    queryFn: () => tmdbClient.searchMulti(debouncedQuery),
    enabled: Boolean(debouncedQuery.trim()),
  })

  // Trending fallback query when search input is empty
  const trendingQuery = useQuery({
    queryKey: tmdbKeys.trending('all', 'week'),
    queryFn: () => tmdbClient.getTrending('all', 'week'),
    enabled: !debouncedQuery.trim(),
  })

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  }

  // Filter results by type & year
  const rawResults = debouncedQuery.trim()
    ? searchQuery.data?.results ?? []
    : trendingQuery.data?.results ?? []

  const filteredResults = rawResults.filter((item) => {
    const itemType = item.media_type || (item.title ? 'movie' : 'tv')
    if (typeFilter !== 'all' && itemType !== typeFilter) return false
    if (yearFilter) {
      const releaseYear = (item.release_date || item.first_air_date || '').slice(0, 4)
      if (releaseYear !== yearFilter) return false
    }
    return true
  })

  return {
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    yearFilter,
    setYearFilter,
    recentSearches,
    clearRecentSearches,
    results: filteredResults,
    isLoading: debouncedQuery.trim() ? searchQuery.isLoading : trendingQuery.isLoading,
    isSearching: Boolean(debouncedQuery.trim()),
  }
}
