import { useState, useRef } from 'react'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { makeTitleKey } from '@/shared/lib/ids'
import type { TmdbSearchResult } from '@/services/tmdb/schemas'

export function useTmdbLogAutocomplete(
  onSelectCallback: (data: {
    title: string
    type: 'movie' | 'tv_episode'
    posterPath: string | null
    titleKey: string
    genreIds: number[]
    runtime: string
  }) => void
) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TmdbSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerSearch = (val: string) => {
    setSearchQuery(val)

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    if (val.trim().length >= 2) {
      setIsSearching(true)
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await tmdbClient.searchMulti(val.trim())
          const filtered = (res.results || []).filter(
            (item) => item.media_type === 'movie' || item.media_type === 'tv'
          )
          setSearchResults(filtered)
          setShowSuggestions(true)
        } catch {
          // ignore autocomplete failure
        } finally {
          setIsSearching(false)
        }
      }, 300)
    } else {
      setSearchResults([])
      setShowSuggestions(false)
      setIsSearching(false)
    }
  }

  const selectTmdbItem = async (item: TmdbSearchResult) => {
    const isTv = item.media_type === 'tv'
    const name = item.title || item.name || ''
    const posterPath = item.poster_path || null
    const titleKey = makeTitleKey(isTv ? 'tv' : 'movie', item.id)
    const genreIds = item.genre_ids || []
    setShowSuggestions(false)

    let runtime = isTv ? '45' : '120'
    try {
      if (isTv) {
        const tvDetails = await tmdbClient.getTvDetails(item.id)
        if (tvDetails.episode_run_time && tvDetails.episode_run_time[0]) {
          runtime = String(tvDetails.episode_run_time[0])
        }
      } else {
        const movieDetails = await tmdbClient.getMovieDetails(item.id)
        if (movieDetails.runtime) {
          runtime = String(movieDetails.runtime)
        }
      }
    } catch {
      // fallback
    }

    onSelectCallback({
      title: name,
      type: isTv ? 'tv_episode' : 'movie',
      posterPath,
      titleKey,
      genreIds,
      runtime,
    })
  }

  const resetSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowSuggestions(false)
    setIsSearching(false)
  }

  return {
    searchQuery,
    searchResults,
    isSearching,
    showSuggestions,
    setShowSuggestions,
    triggerSearch,
    selectTmdbItem,
    resetSearch,
  }
}
