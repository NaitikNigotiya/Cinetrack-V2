import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SlidersHorizontal,
  Plus,
} from 'lucide-react'

import { useLibrary } from '../hooks/useLibrary'
import { updateLibraryEntry } from '../api/libraryApi'
import { useAuthStore } from '@/features/auth/store/authStore'
import { PosterCard } from '@/shared/ui/PosterCard/PosterCard'
import {
  toast,
  PageShell,
  PageHeader,
  FilterBar,
  EmptyStateCard,
  PosterGrid,
  Button,
} from '@/shared/ui'
import type { LibraryEntry, LibraryStatus } from '@/shared/schemas'
import { WatchlistSmartView } from './WatchlistSmartView'
import { WatchlistFilterSheet, type SortKey } from './WatchlistFilterSheet'
import './WatchlistPage.css'

export default function WatchlistPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid

  const { entries, isLoading, refetch } = useLibrary('all')

  const [viewType, setViewType] = useState<'smart' | 'status'>('smart')
  const [activeStatusTab, setActiveStatusTab] = useState<LibraryStatus | 'all'>('plan_to_watch')
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortKey>('addedAt')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [tempSortBy, setTempSortBy] = useState<SortKey>(sortBy)
  const [tempFilterType, setTempFilterType] = useState<'all' | 'movie' | 'tv'>(filterType)
  const [tempGenres, setTempGenres] = useState<string[]>(selectedGenres)

  const availableGenres = useMemo(() => {
    const set = new Set<string>()
    entries.forEach((e) => {
      e.genres?.forEach((g) => {
        if (g.name) set.add(g.name)
      })
    })
    return Array.from(set).sort()
  }, [entries])

  const smartSections = useMemo(() => {
    const list = entries.filter((e) => e.status !== 'completed' && e.status !== 'dropped')

    const watchSoon = list.filter((e) => e.status === 'watching' || ((e as any).priority != null && (e as any).priority >= 2))
    const thisWeekend = list.filter((e) => e.status === 'plan_to_watch' && (e.runtimeMinutes ?? 120) <= 100)
    const currentYear = new Date().getFullYear()
    const waitingForRelease = list.filter((e) => (e.year ?? 0) >= currentYear && e.status === 'plan_to_watch')
    const maybeLater = list.filter((e) => e.status === 'on_hold' || ((e as any).priority != null && (e as any).priority === 0))

    return {
      watchSoon,
      thisWeekend,
      waitingForRelease,
      maybeLater,
    }
  }, [entries])

  const statusViewEntries = useMemo(() => {
    let list = entries

    if (activeStatusTab !== 'all') {
      list = list.filter((e) => e.status === activeStatusTab)
    }

    if (filterType !== 'all') {
      list = list.filter((e) => e.type === filterType)
    }

    if (selectedGenres.length > 0) {
      list = list.filter((e) =>
        e.genres?.some((g) => selectedGenres.includes(g.name))
      )
    }

    return list.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'year') return (b.year ?? 0) - (a.year ?? 0)
      if (sortBy === 'runtime') return (b.runtimeMinutes ?? 0) - (a.runtimeMinutes ?? 0)

      const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0
      const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0
      return dateB - dateA
    })
  }, [entries, activeStatusTab, filterType, selectedGenres, sortBy])

  const handleToggleFavorite = async (e: React.MouseEvent, entry: LibraryEntry) => {
    e.stopPropagation()
    if (!uid) return
    try {
      await updateLibraryEntry(uid, entry.titleKey, { isFavorite: !entry.isFavorite })
      toast.success(entry.isFavorite ? 'Removed from favorites' : 'Saved to favorites')
      refetch()
    } catch {
      toast.error('Failed to update favorite')
    }
  }

  const handleOpenFilterSheet = () => {
    setTempSortBy(sortBy)
    setTempFilterType(filterType)
    setTempGenres(selectedGenres)
    setIsFilterOpen(true)
  }

  const handleApplyFilters = () => {
    setSortBy(tempSortBy)
    setFilterType(tempFilterType)
    setSelectedGenres(tempGenres)
    setIsFilterOpen(false)
  }

  const handleResetFilters = () => {
    setTempSortBy('addedAt')
    setTempFilterType('all')
    setTempGenres([])
    setSortBy('addedAt')
    setFilterType('all')
    setSelectedGenres([])
    setIsFilterOpen(false)
  }

  const activeFilterCount =
    (filterType !== 'all' ? 1 : 0) +
    selectedGenres.length +
    (sortBy !== 'addedAt' ? 1 : 0)

  return (
    <PageShell>
      <PageHeader
        eyebrow="UP NEXT"
        title="Watchlist"
        subtitle="Manage your queue, prioritize upcoming releases, and organize titles into smart queues."
        meta={<span>{entries.length} {entries.length === 1 ? 'title' : 'titles'} in total</span>}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => navigate('/search')}
            >
              Add Title
            </Button>
          </div>
        }
      />

      <FilterBar
        tabs={[
          { id: 'smart', label: '⚡ Smart View' },
          { id: 'status', label: 'All by Status', count: entries.length },
        ]}
        activeTab={viewType}
        onTabChange={(id) => setViewType(id as 'smart' | 'status')}
        rightActions={
          viewType === 'status' ? (
            <Button
              variant="secondary"
              leftIcon={<SlidersHorizontal size={14} />}
              onClick={handleOpenFilterSheet}
              style={{ position: 'relative' }}
            >
              Filter & Sort
              {activeFilterCount > 0 && (
                <span className="wl-filter-active-dot" />
              )}
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap)' }}>
          <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-card)' }} />
          <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-card)' }} />
        </div>
      ) : entries.length === 0 ? (
        <EmptyStateCard
          title="Your watchlist is empty"
          description="Search for movies and TV series to plan your upcoming watches and organize your queue."
          action={
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/search')}>
              Browse Titles
            </Button>
          }
        />
      ) : viewType === 'smart' ? (
        <WatchlistSmartView
          smartSections={smartSections}
          onToggleFavorite={handleToggleFavorite}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap)' }}>
          <FilterBar
            tabs={[
              { id: 'all', label: 'All', count: entries.length },
              { id: 'watching', label: 'Watching', count: entries.filter((e) => e.status === 'watching').length },
              { id: 'plan_to_watch', label: 'Plan to Watch', count: entries.filter((e) => e.status === 'plan_to_watch').length },
              { id: 'completed', label: 'Completed', count: entries.filter((e) => e.status === 'completed').length },
              { id: 'on_hold', label: 'On Hold', count: entries.filter((e) => e.status === 'on_hold').length },
              { id: 'dropped', label: 'Dropped', count: entries.filter((e) => e.status === 'dropped').length },
            ]}
            activeTab={activeStatusTab}
            onTabChange={(id) => setActiveStatusTab(id as any)}
          />

          {statusViewEntries.length === 0 ? (
            <EmptyStateCard
              title="No titles match this filter"
              description="Try changing the status tab or adjusting your genre and media type filters."
              action={
                <Button variant="secondary" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <PosterGrid>
              {statusViewEntries.map((entry) => (
                <PosterCard
                  key={entry.titleKey}
                  title={entry.title}
                  year={entry.year}
                  posterPath={entry.posterPath}
                  rating={entry.rating}
                  type={entry.type}
                  status={entry.status}
                  isFavorite={entry.isFavorite}
                  onClick={() => navigate(`/title/${entry.titleKey}`)}
                />
              ))}
            </PosterGrid>
          )}
        </div>
      )}

      <WatchlistFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        tempSortBy={tempSortBy}
        setTempSortBy={setTempSortBy}
        tempFilterType={tempFilterType}
        setTempFilterType={setTempFilterType}
        availableGenres={availableGenres}
        tempGenres={tempGenres}
        onGenreToggle={(g) =>
          setTempGenres((prev) =>
            prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
          )
        }
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </PageShell>
  )
}
