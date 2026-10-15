import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  type QueryConstraint,
} from 'firebase/firestore'
import {
  getLibraryCollection,
  getStatsSummaryDocRef,
} from '@/services/firebase/collections'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { LibraryEntry, LibraryStatus } from '@/shared/schemas'

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
  const { user } = useAuthStore()
  const uid = user?.uid

  const [filters, setFilters] = useState<LibraryFilters>({
    tab: initialTab,
    type: 'all',
    searchQuery: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })

  // Fetch pre-aggregated tab counts from stats/summary
  const statsQuery = useQuery({
    queryKey: ['stats', 'summary', uid],
    queryFn: async () => {
      if (!uid) return null
      const snap = await getDoc(getStatsSummaryDocRef(uid))
      return snap.exists() ? snap.data() : null
    },
    enabled: Boolean(uid),
  })

  // Fetch library titles with query filters & pagination limit
  const libraryQuery = useQuery({
    queryKey: ['library', uid, filters],
    queryFn: async (): Promise<LibraryEntry[]> => {
      if (!uid) return []
      const colRef = getLibraryCollection(uid)
      const constraints: QueryConstraint[] = []

      if (filters.tab === 'favorites') {
        constraints.push(where('isFavorite', '==', true))
      } else if (filters.tab !== 'all') {
        constraints.push(where('status', '==', filters.tab))
      }

      if (filters.type !== 'all') {
        constraints.push(where('type', '==', filters.type))
      }

      // Sort
      constraints.push(orderBy(filters.sortBy, filters.sortOrder))
      constraints.push(limit(40))

      try {
        const q = query(colRef, ...constraints)
        const snap = await getDocs(q)
        return snap.docs.map((d) => d.data())
      } catch (err) {
        console.warn('Index might be building or query failed, falling back:', err)
        // Simple fallback query
        const fallbackQ = query(colRef, limit(40))
        const snap = await getDocs(fallbackQ)
        return snap.docs.map((d) => d.data())
      }
    },
    enabled: Boolean(uid),
  })

  const rawEntries = libraryQuery.data ?? []

  // Client-side text filter
  const entries = rawEntries.filter((e) => {
    if (!filters.searchQuery.trim()) return true
    return e.title.toLowerCase().includes(filters.searchQuery.toLowerCase())
  })

  const counts = statsQuery.data?.statusCounts || {}
  const totalCount = Object.values(counts).reduce((sum, n) => sum + (typeof n === 'number' ? n : 0), 0)

  return {
    filters,
    setFilters,
    entries,
    counts,
    totalCount,
    isLoading: libraryQuery.isLoading,
    refetch: libraryQuery.refetch,
  }
}
