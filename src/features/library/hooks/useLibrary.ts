import { useState, useMemo } from 'react'
import { useAppStore } from '@/domain/store'
import {
  selectWatchingList,
  selectWatchlist,
  selectCompletedList,
  selectFavoritesList,
} from '@/domain/selectors'
import type { LibraryStatus } from '@/shared/schemas'

export type LibraryTab = 'all' | LibraryStatus | 'favorites'
export type SortOption = 'updatedAt' | 'addedAt' | 'title' | 'year' | 'rating'

export interface LibraryFilters {
  tab: LibraryTab
  type: 'all' | 'movie' | 'tv'
  searchQuery: string
  sortBy: SortOption
  sortOrder: 'asc' | 'desc'
}

export function useLibrary(initialTab: LibraryTab = 'all') {
  const library = useAppStore((state) => state.library)
  const isReady = useAppStore((state) => state.isReady)

  const [filters, setFilters] = useState<LibraryFilters>({
    tab: initialTab,
    type: 'all',
    searchQuery: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })

  const counts = useMemo(() => {
    return {
      all: library.length,
      watching: selectWatchingList(library).length,
      plan_to_watch: selectWatchlist(library).length,
      completed: selectCompletedList(library).length,
      on_hold: library.filter((e) => e.status === 'on_hold').length,
      dropped: library.filter((e) => e.status === 'dropped').length,
      favorites: selectFavoritesList(library).length,
    }
  }, [library])

  const totalCount = library.length

  const entries = useMemo(() => {
    let list = library

    if (filters.tab === 'favorites') {
      list = list.filter((e) => e.isFavorite)
    } else if (filters.tab !== 'all') {
      list = list.filter((e) => e.status === filters.tab)
    }

    if (filters.type !== 'all') {
      list = list.filter((e) => e.type === filters.type)
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase()
      list = list.filter((e) => e.title.toLowerCase().includes(q))
    }

    const sorted = [...list].sort((a, b) => {
      let diff = 0
      if (filters.sortBy === 'title') {
        diff = a.title.localeCompare(b.title)
      } else if (filters.sortBy === 'year') {
        diff = (a.year ?? 0) - (b.year ?? 0)
      } else if (filters.sortBy === 'rating') {
        diff = (a.rating ?? 0) - (b.rating ?? 0)
      } else if (filters.sortBy === 'addedAt') {
        const getMs = (v: any) => (v?.toDate ? v.toDate().getTime() : v?.seconds ? v.seconds * 1000 : new Date(v || 0).getTime() || 0)
        diff = getMs(a.addedAt) - getMs(b.addedAt)
      } else {
        const getMs = (v: any) => (v?.toDate ? v.toDate().getTime() : v?.seconds ? v.seconds * 1000 : new Date(v || 0).getTime() || 0)
        diff = getMs(a.updatedAt) - getMs(b.updatedAt)
      }
      return filters.sortOrder === 'asc' ? diff : -diff
    })

    return sorted
  }, [library, filters])

  return {
    filters,
    setFilters,
    entries,
    counts,
    totalCount,
    isLoading: !isReady,
    refetch: () => Promise.resolve(),
  }
}
