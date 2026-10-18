import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Edit2, Check, Plus, ArrowUpDown, Film, X } from 'lucide-react'
import { getImageUrl } from '@/services/tmdb/images'
import type { Collection, LibraryEntry } from '@/shared/schemas'
import type { SmartCollection } from './smartCollections'

interface CollectionDetailViewProps {
  activeCollection: Collection | SmartCollection
  activeCollectionId: string
  entries: LibraryEntry[]
  onBack: () => void
  onOpenAddTitles: () => void
  onRemoveItem: (titleKey: string) => void
  onUpdateName: (name: string) => void
}

export function CollectionDetailView({
  activeCollection,
  activeCollectionId,
  entries,
  onBack,
  onOpenAddTitles,
  onRemoveItem,
  onUpdateName,
}: CollectionDetailViewProps) {
  const navigate = useNavigate()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(activeCollection.name)
  const [detailSort, setDetailSort] = useState<'title' | 'year' | 'rating'>('title')

  const isSmart = activeCollectionId.startsWith('smart:')

  const handleStartRename = () => {
    if (isSmart) return
    setEditedName(activeCollection.name)
    setIsEditingName(true)
  }

  const handleNameSave = () => {
    if (isSmart) return
    if (editedName.trim() && editedName.trim() !== activeCollection.name) {
      onUpdateName(editedName.trim())
    }
    setIsEditingName(false)
  }

  const activeCollectionEntries = useMemo(() => {
    let list: Array<{
      titleKey: string
      title: string
      posterPath: string | null
      year?: number | null | undefined
      rating?: number | null | undefined
      type: 'movie' | 'tv'
    }> = []

    if ('list' in activeCollection) {
      list = activeCollection.list.map((e) => ({
        titleKey: e.titleKey,
        title: e.title,
        posterPath: e.posterPath,
        year: e.year,
        rating: e.rating,
        type: e.type,
      }))
    } else {
      const items = (activeCollection as Collection).items ?? []
      list = items.map((i) => {
        const libEntry = entries.find((e) => e.titleKey === i.titleKey)
        return {
          titleKey: i.titleKey,
          title: i.title,
          posterPath: i.posterPath,
          year: libEntry?.year,
          rating: libEntry?.rating,
          type: i.type,
        }
      })
    }

    return list.sort((a, b) => {
      if (detailSort === 'year') {
        return (b.year ?? 0) - (a.year ?? 0)
      }
      if (detailSort === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0)
      }
      return a.title.localeCompare(b.title)
    })
  }, [activeCollection, entries, detailSort])

  return (
    <div className="col-detail-pane animate-fade-in">
      <header className="unified-page-header col-detail-header">
        <button className="col-back-btn" onClick={onBack} type="button">
          <ChevronLeft size={16} /> Back to Collections
        </button>
        <div className="col-detail-title-block">
          {isEditingName ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="col-rename-input"
                autoFocus
              />
              <button className="col-rename-save-btn" onClick={handleNameSave} type="button">
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="col-detail-name page-title" onClick={handleStartRename}>
                {activeCollection.name}
              </h2>
              {!isSmart && (
                <button className="col-rename-trigger" onClick={handleStartRename} type="button">
                  <Edit2 size={13} />
                </button>
              )}
            </div>
          )}

          <p className="col-detail-desc page-subtitle">{activeCollection.description}</p>
          <div className="col-detail-sub-meta">
            <span>{activeCollectionEntries.length} titles</span>
            {isSmart && <span className="smart-badge-inline">⚡ Smart Auto-generated</span>}
          </div>
        </div>

        <div className="col-detail-actions">
          {!isSmart && (
            <button className="page-header-btn" onClick={onOpenAddTitles} type="button">
              <Plus size={15} /> Add Titles
            </button>
          )}

          <div className="col-detail-sort-select">
            <ArrowUpDown size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              value={detailSort}
              onChange={(e) => setDetailSort(e.target.value as 'title' | 'year' | 'rating')}
              className="col-sort-select"
            >
              <option value="title">Title A-Z</option>
              <option value="year">Release Year</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>
      </header>

      {activeCollectionEntries.length > 0 ? (
        <div className="col-detail-grid">
          {activeCollectionEntries.map((e) => {
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
                        <Film size={24} />
                      </div>
                    )}
                    <div className="col-grid-overlay" />
                    {e.rating && <span className="col-grid-rating-badge">⭐ {e.rating}</span>}
                  </div>
                  <div className="col-grid-info">
                    <p className="col-grid-card-title">{e.title}</p>
                    <p className="col-grid-card-year">{(e.year ?? 0) > 0 ? e.year : '—'}</p>
                  </div>
                </article>

                {!isSmart && (
                  <button
                    className="col-remove-item-btn"
                    onClick={() => onRemoveItem(e.titleKey)}
                    aria-label={`Remove ${e.title} from collection`}
                    type="button"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="col-empty-placeholder">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>Nothing added yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Click "+ Add Titles" to add movies and shows from your library to this collection.
          </p>
        </div>
      )}
    </div>
  )
}
