import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Zap,
  Film,
  Star,
  Clock,
  Trash2,
  Edit2,
  X,
  LayoutGrid,
  List,
} from 'lucide-react'
import { getImageUrl } from '@/services/tmdb/images'
import type { Collection, LibraryEntry, LibraryStatus } from '@/shared/schemas'
import type { SmartCollection } from './smartCollections'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatRow } from '@/shared/ui/layout/StatRow'
import { StatTile } from '@/shared/ui/layout/StatTile'
import { FilterBar, type SortOption, type TabOption } from '@/shared/ui/layout/FilterBar'
import { PosterGrid } from '@/shared/ui/layout/PosterGrid'
import { Card } from '@/shared/ui/layout/Card'
import { Pill } from '@/shared/ui/layout/Pill'
import { Button } from '@/shared/ui/Button/Button'
import { BottomSheet } from '@/shared/ui/BottomSheet/BottomSheet'

interface CollectionDetailViewProps {
  activeCollection: Collection | SmartCollection
  activeCollectionId: string
  entries: LibraryEntry[]
  onBack: () => void
  onOpenAddTitles: () => void
  onRemoveItem: (titleKey: string) => void
  onUpdateName: (name: string) => void
  onUpdateDescription?: (desc: string) => void
  onDeleteCollection?: () => void
}

const STATUS_LABELS: Record<LibraryStatus, string> = {
  plan_to_watch: 'Plan to Watch',
  watching: 'Watching',
  completed: 'Completed',
  on_hold: 'On Hold',
  dropped: 'Dropped',
}

export function CollectionDetailView({
  activeCollection,
  activeCollectionId,
  entries,
  onBack,
  onOpenAddTitles,
  onRemoveItem,
  onUpdateName,
  onUpdateDescription,
  onDeleteCollection,
}: CollectionDetailViewProps) {
  const navigate = useNavigate()
  const isSmart = activeCollectionId.startsWith('smart:')

  // Filter & sort state
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all')
  const [sortOption, setSortOption] = useState<'title' | 'date_added' | 'rating' | 'year'>('title')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Edit collection modal state (custom lists only)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editName, setEditName] = useState(activeCollection.name)
  const [editDesc, setEditDesc] = useState(activeCollection.description || '')

  const handleOpenEdit = () => {
    setEditName(activeCollection.name)
    setEditDesc(activeCollection.description || '')
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return
    if (editName.trim() !== activeCollection.name) {
      onUpdateName(editName.trim())
    }
    if (editDesc.trim() !== (activeCollection.description || '')) {
      onUpdateDescription?.(editDesc.trim())
    }
    setIsEditModalOpen(false)
  }

  // Build the list of entries with library metadata (runtime, rating, status)
  const rawCollectionEntries = useMemo(() => {
    if ('list' in activeCollection) {
      return activeCollection.list.map((e) => {
        const libEntry = entries.find((l) => l.titleKey === e.titleKey)
        return {
          titleKey: e.titleKey,
          title: e.title,
          posterPath: e.posterPath,
          year: e.year ?? libEntry?.year,
          rating: libEntry?.rating ?? e.rating,
          type: e.type,
          status: libEntry?.status ?? null,
          runtimeMinutes: libEntry?.runtimeMinutes ?? 0,
          addedAt: libEntry?.addedAt ? new Date(libEntry.addedAt).getTime() : 0,
        }
      })
    } else {
      const items = (activeCollection as Collection).items ?? []
      return items.map((i) => {
        const libEntry = entries.find((e) => e.titleKey === i.titleKey)
        return {
          titleKey: i.titleKey,
          title: i.title,
          posterPath: i.posterPath,
          year: libEntry?.year,
          rating: libEntry?.rating,
          type: i.type,
          status: libEntry?.status ?? null,
          runtimeMinutes: libEntry?.runtimeMinutes ?? 0,
          addedAt: (i as any).addedAt
            ? new Date((i as any).addedAt).getTime()
            : libEntry?.addedAt
            ? new Date(libEntry.addedAt).getTime()
            : 0,
        }
      })
    }
  }, [activeCollection, entries])

  // Compute stat totals
  const totalCount = rawCollectionEntries.length
  const totalMinutes = useMemo(() => {
    return rawCollectionEntries.reduce((acc, curr) => acc + (curr.runtimeMinutes || 0), 0)
  }, [rawCollectionEntries])
  const runtimeHours = (totalMinutes / 60).toFixed(1)

  const avgRating = useMemo(() => {
    const rated = rawCollectionEntries.filter((e) => (e.rating ?? 0) > 0)
    if (rated.length === 0) return '—'
    const sum = rated.reduce((acc, curr) => acc + curr.rating!, 0)
    return (sum / rated.length).toFixed(1)
  }, [rawCollectionEntries])

  // Filtered & sorted list
  const filteredEntries = useMemo(() => {
    let list = rawCollectionEntries
    if (typeFilter !== 'all') {
      list = list.filter((e) => e.type === typeFilter)
    }

    return [...list].sort((a, b) => {
      if (sortOption === 'year') {
        return (b.year ?? 0) - (a.year ?? 0)
      }
      if (sortOption === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0)
      }
      if (sortOption === 'date_added') {
        return b.addedAt - a.addedAt
      }
      return a.title.localeCompare(b.title)
    })
  }, [rawCollectionEntries, typeFilter, sortOption])

  const titleMetaText = `${totalCount} ${totalCount === 1 ? 'title' : 'titles'}`

  const filterTabs: TabOption<'all' | 'movie' | 'tv'>[] = [
    { id: 'all', label: 'All', count: rawCollectionEntries.length },
    {
      id: 'movie',
      label: 'Movies',
      count: rawCollectionEntries.filter((e) => e.type === 'movie').length,
    },
    {
      id: 'tv',
      label: 'TV',
      count: rawCollectionEntries.filter((e) => e.type === 'tv').length,
    },
  ]

  const sortOpts: SortOption<'title' | 'date_added' | 'rating' | 'year'>[] = [
    { value: 'title', label: 'Title A-Z' },
    { value: 'date_added', label: 'Date Added' },
    { value: 'rating', label: 'Rating' },
    { value: 'year', label: 'Year' },
  ]

  const viewModeOptions = [
    { mode: 'grid', icon: <LayoutGrid size={15} />, label: 'Grid' },
    { mode: 'list', icon: <List size={15} />, label: 'List' },
  ]

  return (
    <div className="col-detail-pane animate-fade-in">
      {/* 1. PageHeader */}
      <PageHeader
        eyebrow={isSmart ? 'SMART COLLECTION' : 'CUSTOM LIST'}
        title={activeCollection.name}
        subtitle={activeCollection.description || undefined}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft size={15} />}
              onClick={onBack}
            >
              ← Collections
            </Button>
            {!isSmart && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={15} />}
                  onClick={onOpenAddTitles}
                >
                  Add titles
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit2 size={14} />}
                  onClick={handleOpenEdit}
                >
                  Edit
                </Button>
                {onDeleteCollection && (
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 size={14} />}
                    onClick={onDeleteCollection}
                  >
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
        }
        meta={
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span>{titleMetaText}</span>
            {isSmart && (
              <Pill variant="brand">
                <Zap size={12} style={{ marginRight: '4px' }} /> Smart Auto-generated
              </Pill>
            )}
          </div>
        }
      />

      {/* 2. StatRow (3 small tiles: Titles, Average rating, Total runtime) */}
      <StatRow columns={3}>
        <StatTile
          icon={<Film size={20} />}
          value={totalCount}
          label="Titles"
        />
        <StatTile
          icon={<Star size={20} />}
          value={avgRating}
          label="Average rating"
        />
        <StatTile
          icon={<Clock size={20} />}
          value={totalMinutes > 0 ? `${runtimeHours}h` : '0h'}
          label="Total runtime (hours)"
        />
      </StatRow>

      {/* 3. FilterBar */}
      <FilterBar
        tabs={filterTabs}
        activeTab={typeFilter}
        onTabChange={(id) => setTypeFilter(id as any)}
        sortOptions={sortOpts}
        sortValue={sortOption}
        onSortChange={(val) => setSortOption(val as any)}
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode)}
        viewModeOptions={viewModeOptions}
      />

      {/* 4. PosterGrid or Empty State Card */}
      {filteredEntries.length > 0 ? (
        viewMode === 'grid' ? (
          <PosterGrid>
            {filteredEntries.map((e) => {
              const poster = getImageUrl(e.posterPath, 'w500')
              return (
                <div key={e.titleKey} className="col-poster-container">
                  <article
                    className="col-grid-card"
                    onClick={() => navigate(`/title/${e.titleKey}`)}
                  >
                    <div className="col-grid-poster-wrap">
                      {poster ? (
                        <img
                          src={poster}
                          alt={e.title}
                          className="col-grid-poster-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="col-grid-no-poster">
                          <Film size={28} />
                        </div>
                      )}
                      {e.rating && <span className="col-grid-rating-badge">⭐ {e.rating}</span>}
                    </div>

                    <div className="col-grid-info">
                      <p className="col-grid-card-title" title={e.title}>
                        {e.title}
                      </p>
                      <div className="col-grid-meta-row">
                        <span className="col-grid-card-year">
                          {(e.year ?? 0) > 0 ? e.year : '—'}
                        </span>
                        {e.status && (
                          <span className={`col-grid-status-badge col-grid-status-badge--${e.status}`}>
                            {STATUS_LABELS[e.status] || e.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>

                  {!isSmart && (
                    <button
                      className="col-remove-item-btn"
                      onClick={(evt) => {
                        evt.stopPropagation()
                        onRemoveItem(e.titleKey)
                      }}
                      aria-label={`Remove ${e.title} from collection`}
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </PosterGrid>
        ) : (
          <div className="col-list-view">
            {filteredEntries.map((e) => {
              const poster = getImageUrl(e.posterPath, 'w185')
              return (
                <article
                  key={e.titleKey}
                  className="col-list-row"
                  onClick={() => navigate(`/title/${e.titleKey}`)}
                >
                  <div className="col-list-poster-wrap">
                    {poster ? (
                      <img src={poster} alt={e.title} className="col-list-poster-img" loading="lazy" />
                    ) : (
                      <Film size={18} />
                    )}
                  </div>
                  <div className="col-list-info">
                    <span className="col-list-title">{e.title}</span>
                    <span className="col-list-sub">
                      {(e.year ?? 0) > 0 ? e.year : '—'} · {e.type === 'movie' ? 'Movie' : 'TV Show'}
                    </span>
                  </div>
                  {e.status && (
                    <span className={`col-grid-status-badge col-grid-status-badge--${e.status}`}>
                      {STATUS_LABELS[e.status] || e.status}
                    </span>
                  )}
                  {e.rating && <span className="col-grid-rating-pill">⭐ {e.rating}</span>}
                  {!isSmart && (
                    <button
                      className="col-list-remove-btn"
                      onClick={(evt) => {
                        evt.stopPropagation()
                        onRemoveItem(e.titleKey)
                      }}
                      aria-label={`Remove ${e.title} from collection`}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )
      ) : (
        <Card variant="default">
          <div className="col-empty-card-inner">
            <div style={{ fontSize: 44, marginBottom: 'var(--space-2)' }}>🎬</div>
            <h3 style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700, margin: '0 0 var(--space-2) 0' }}>
              No titles in this list
            </h3>
            <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-muted)', margin: '0 0 var(--space-4) 0', maxWidth: 440 }}>
              {isSmart
                ? 'Titles will automatically appear here once you log or rate them in your library.'
                : 'Add movies and TV shows from your library to start building your custom list.'}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {!isSmart && (
                <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onOpenAddTitles}>
                  Add titles
                </Button>
              )}
              <Button
                variant={isSmart ? 'primary' : 'secondary'}
                onClick={() => navigate('/discover')}
              >
                Browse titles
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Collection Modal (Custom Lists) */}
      {!isSmart && (
        <BottomSheet isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} label="Edit collection">
          <form onSubmit={handleSaveEdit} className="dp-add-sheet">
            <h3 style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700, margin: '0 0 var(--space-3) 0' }}>
              Edit Collection
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--card-gap)' }}>
              <div>
                <label
                  style={{
                    fontSize: 'var(--fs-small)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: 6,
                    display: 'block',
                  }}
                >
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-control)',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: 'var(--fs-body)',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 'var(--fs-small)',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: 6,
                    display: 'block',
                  }}
                >
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{
                    width: '100%',
                    height: 80,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-control)',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: 'var(--fs-body)',
                    resize: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button type="submit" variant="primary" style={{ flex: 1 }}>
                  Save Changes
                </Button>
                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </BottomSheet>
      )}
    </div>
  )
}
