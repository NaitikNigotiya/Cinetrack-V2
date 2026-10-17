import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Film,
  MoreVertical,
  ChevronLeft,
  Search,
  X,
  Check,
  Edit2,
  ArrowUpDown,
} from 'lucide-react'

import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import {
  fetchCollections,
  saveCollection,
  deleteCollection,
  addItemToCollection,
  removeItemFromCollection,
} from '../api/collectionsApi'
import { getImageUrl } from '@/services/tmdb/images'
import { BottomSheet } from '@/shared/ui/BottomSheet/BottomSheet'
import { toast } from '@/shared/ui'
import type { LibraryEntry } from '@/shared/schemas'
import type { Collection } from '@/shared/schemas'

import './CollectionsPage.css'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface SmartCollection {
  id: string
  name: string
  description: string
  list: LibraryEntry[]
}

export default function CollectionsPage() {
  const { user } = useAuthStore()
  const uid = user?.uid
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const queryClient = useQueryClient()

  const { entries } = useLibrary('all')

  // Queries
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections', uid],
    queryFn: () => (uid ? fetchCollections(uid) : []),
    enabled: Boolean(uid),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      if (!uid) throw new Error('Not authenticated')
      return saveCollection(uid, { name, description })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', uid] })
      toast.success('Collection created!')
    },
    onError: () => toast.error('Failed to create collection.'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!uid) throw new Error('Not authenticated')
      return saveCollection(uid, { id, name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', uid] })
      toast.success('Collection renamed!')
    },
    onError: () => toast.error('Failed to update collection.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!uid) throw new Error('Not authenticated')
      return deleteCollection(uid, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', uid] })
      toast.success('Collection deleted.')
    },
    onError: () => toast.error('Failed to delete collection.'),
  })

  const addItemMutation = useMutation({
    mutationFn: async ({
      collectionId,
      item,
    }: {
      collectionId: string
      item: { titleKey: string; title: string; posterPath: string | null; type: 'movie' | 'tv' }
    }) => {
      if (!uid) throw new Error('Not authenticated')
      return addItemToCollection(uid, collectionId, item)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', uid] })
      toast.success('Added to collection!')
    },
    onError: () => toast.error('Failed to add title.'),
  })

  const removeItemMutation = useMutation({
    mutationFn: async ({ collectionId, titleKey }: { collectionId: string; titleKey: string }) => {
      if (!uid) throw new Error('Not authenticated')
      return removeItemFromCollection(uid, collectionId, titleKey)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', uid] })
      toast.success('Removed from collection.')
    },
    onError: () => toast.error('Failed to remove title.'),
  })

  // Navigation State
  const activeCollectionId = params.id || null
  const setActiveCollectionId = (id: string | null) => {
    if (id) {
      navigate(`/collections/${id}`)
    } else {
      navigate('/collections')
    }
  }

  // Dialog / Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAddTitlesOpen, setIsAddTitlesOpen] = useState(false)

  // Creation Forms
  const [newColName, setNewColName] = useState('')
  const [newColDesc, setNewColDesc] = useState('')

  // Inline renaming states
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')

  // Context Menu state
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  // Add titles search
  const [searchQuery, setSearchQuery] = useState('')

  // Detail Sort Options
  const [detailSort, setDetailSort] = useState<'title' | 'year' | 'rating'>('title')

  // ── Smart Collections Logic (Auto-Generated) ──
  const smartCollections: SmartCollection[] = useMemo(() => {
    const nolanTitles = [
      'inception',
      'interstellar',
      'dark knight',
      'oppenheimer',
      'tenet',
      'memento',
      'prestige',
      'dunkirk',
      'batman begins',
    ]
    const mcuTitles = [
      'iron man',
      'thor',
      'captain america',
      'avengers',
      'guardians of the galaxy',
      'black panther',
      'doctor strange',
      'spider-man',
      'captain marvel',
      'ant-man',
    ]
    const ghibliTitles = [
      'spirited away',
      'totoro',
      "howl's moving castle",
      'princess mononoke',
      'grave of the fireflies',
      'ponyo',
      "kiki's delivery",
    ]

    return [
      {
        id: 'smart:nolan',
        name: 'Christopher Nolan',
        description: 'Masterpieces directed by Christopher Nolan',
        list: entries.filter((e) =>
          nolanTitles.some((t) => e.title.toLowerCase().includes(t))
        ),
      },
      {
        id: 'smart:mcu',
        name: 'Marvel Cinematic Universe',
        description: 'Blockbusters from the Marvel Cinematic Universe',
        list: entries.filter((e) =>
          mcuTitles.some((t) => e.title.toLowerCase().includes(t))
        ),
      },
      {
        id: 'smart:ghibli',
        name: 'Studio Ghibli',
        description: 'Immersive Ghibli animated features',
        list: entries.filter((e) =>
          ghibliTitles.some((t) => e.title.toLowerCase().includes(t))
        ),
      },
      {
        id: 'smart:classics',
        name: '90s Classics',
        description: 'Timeless cinematic gems from 1990-1999',
        list: entries.filter((e) => (e.year ?? 0) >= 1990 && (e.year ?? 0) <= 1999),
      },
      {
        id: 'smart:mindblowing',
        name: 'Mind-blowing Movies',
        description: 'Highly rated titles rated 9+ by you',
        list: entries.filter((e) => e.rating !== null && (e.rating ?? 0) >= 9),
      },
      {
        id: 'smart:comfort',
        name: 'Comfort Movies',
        description: 'Your favorite comfort titles rated 8+',
        list: entries.filter((e) => e.isFavorite && (e.rating ?? 0) >= 8),
      },
      {
        id: 'smart:horror',
        name: 'Weekend Horror',
        description: 'Spooky horror titles for the weekend',
        list: entries.filter((e) =>
          e.genres?.some((g) => g.name.toLowerCase().includes('horror'))
        ),
      },
    ].filter((c) => c.list.length > 0)
  }, [entries])

  // ── Active Collection Resolving ──
  const activeCollection = useMemo(() => {
    if (!activeCollectionId) return null
    if (activeCollectionId.startsWith('smart:')) {
      return smartCollections.find((c) => c.id === activeCollectionId) || null
    }
    return collections.find((c) => c.id === activeCollectionId) || null
  }, [activeCollectionId, collections, smartCollections])

  // Resolved list of entries in active collection
  const activeCollectionEntries = useMemo(() => {
    if (!activeCollection) return []
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

    // Apply sorting
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

  // ── Multi-select candidate list to add ──
  const candidateTitles = useMemo(() => {
    if (!activeCollection || 'list' in activeCollection) return []
    const alreadyIn = new Set(((activeCollection as Collection).items ?? []).map((i) => i.titleKey))
    return entries.filter(
      (e) => !alreadyIn.has(e.titleKey) && e.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [activeCollection, entries, searchQuery])

  // ── Handlers ──

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColName.trim()) return
    await createMutation.mutateAsync({
      name: newColName.trim(),
      description: newColDesc.trim(),
    })
    setNewColName('')
    setNewColDesc('')
    setIsCreateOpen(false)
  }

  const handleNameSave = async () => {
    if (!activeCollection || activeCollectionId?.startsWith('smart:') || !activeCollectionId) return
    if (editedName.trim() && editedName.trim() !== activeCollection.name) {
      await updateMutation.mutateAsync({
        id: activeCollectionId,
        name: editedName.trim(),
      })
    }
    setIsEditingName(false)
  }

  const handleStartRename = () => {
    if (!activeCollection || activeCollectionId?.startsWith('smart:')) return
    setEditedName(activeCollection.name)
    setIsEditingName(true)
  }

  const handleDelete = async (colId: string) => {
    if (window.confirm('Delete this collection forever?')) {
      await deleteMutation.mutateAsync(colId)
      if (activeCollectionId === colId) {
        setActiveCollectionId(null)
      }
    }
  }

  // Cover composite rendering function
  const renderCover = (items: Array<{ posterPath: string | null }>) => {
    const list = items.slice(0, 4)
    return (
      <div className="col-cover-composite">
        {Array.from({ length: 4 }).map((_, i) => {
          const item = list[i]
          const poster = item?.posterPath ? getImageUrl(item.posterPath, 'w200') : null
          return (
            <div key={i} className="col-cover-quadrant">
              {poster ? (
                <img src={poster} alt="Poster quadrant" className="col-cover-img" />
              ) : (
                <div className="col-cover-quadrant-ph">
                  <Film size={14} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Smart cover composite
  const renderSmartCover = (items: LibraryEntry[]) => {
    const list = items.slice(0, 4)
    return (
      <div className="col-cover-composite col-cover-composite--smart">
        {Array.from({ length: 4 }).map((_, i) => {
          const item = list[i]
          const poster = item?.posterPath ? getImageUrl(item.posterPath, 'w200') : null
          return (
            <div key={i} className="col-cover-quadrant">
              {poster ? (
                <img src={poster} alt="Poster quadrant" className="col-cover-img" />
              ) : (
                <div className="col-cover-quadrant-ph">
                  <Film size={14} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="unified-page-container collections-page">
        <div className="skeleton" style={{ height: 40, width: '30%', marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ aspectRatio: '1.4', borderRadius: 'var(--radius-xl, 16px)' }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="unified-page-container collections-page">
      {/* ── DETAIL VIEW OVERLAY ── */}
      {activeCollection ? (
        <div className="col-detail-pane animate-fade-in">
          {/* Header */}
          <header className="unified-page-header col-detail-header">
            <button
              className="col-back-btn"
              onClick={() => setActiveCollectionId(null)}
              type="button"
            >
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
                  {!activeCollectionId?.startsWith('smart:') && (
                    <button className="col-rename-trigger" onClick={handleStartRename} type="button">
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>
              )}

              <p className="col-detail-desc page-subtitle">{activeCollection.description}</p>
              <div className="col-detail-sub-meta">
                <span>{activeCollectionEntries.length} titles</span>
                {activeCollectionId?.startsWith('smart:') && (
                  <span className="smart-badge-inline">⚡ Smart Auto-generated</span>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="col-detail-actions">
              {!activeCollectionId?.startsWith('smart:') && (
                <button
                  className="page-header-btn"
                  onClick={() => setIsAddTitlesOpen(true)}
                  type="button"
                >
                  <Plus size={15} /> Add Titles
                </button>
              )}

              {/* Sort Switcher */}
              <div className="col-detail-sort-select">
                <ArrowUpDown size={13} style={{ color: 'var(--text-muted)' }} />
                <select
                  value={detailSort}
                  onChange={(e) => setDetailSort(e.target.value as any)}
                  className="col-sort-select"
                >
                  <option value="title">Title A-Z</option>
                  <option value="year">Release Year</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>
          </header>

          {/* Cards Grid */}
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

                    {/* Remove Action */}
                    {!activeCollectionId?.startsWith('smart:') && (
                      <button
                        className="col-remove-item-btn"
                        onClick={() =>
                          removeItemMutation.mutate({
                            collectionId: activeCollectionId!,
                            titleKey: e.titleKey,
                          })
                        }
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
      ) : (
        /* ── CENTRAL COLLECTIONS MAIN VIEW ── */
        <div className="col-main-pane animate-fade-in">
          {/* Header */}
          <header className="unified-page-header">
            <div>
              <h1 className="page-title">Collections</h1>
              <p className="page-subtitle">Organize your movies and shows into custom lists</p>
            </div>
            <button className="page-header-btn" onClick={() => setIsCreateOpen(true)} type="button">
              + New Collection
            </button>
          </header>

          {/* ⚡ SMART COLLECTIONS SECTION */}
          {smartCollections.length > 0 && (
            <section className="col-section">
              <h3 className="col-section-title">⚡ Smart Collections</h3>
              <div className="col-cards-grid">
                {smartCollections.map((col) => (
                  <article
                    key={col.id}
                    className="col-card"
                    onClick={() => setActiveCollectionId(col.id)}
                  >
                    <div className="col-card-cover-wrap">
                      {renderSmartCover(col.list)}
                      <div className="col-card-overlay-gradient" />
                      <span className="col-card-smart-badge">⚡ AUTO</span>
                      <div className="col-card-text">
                        <h4 className="col-card-name">{col.name}</h4>
                        <span className="col-card-count">{col.list.length} titles</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* 📂 CUSTOM USER COLLECTIONS SECTION */}
          <section className="col-section" style={{ marginTop: 32 }}>
            <h3 className="col-section-title">📂 Custom Collections</h3>
            {collections.length > 0 ? (
              <div className="col-cards-grid">
                {collections.map((col) => (
                  <article
                    key={col.id}
                    className="col-card"
                    onClick={() => col.id && setActiveCollectionId(col.id)}
                  >
                    <div className="col-card-cover-wrap">
                      {renderCover(col.items ?? [])}
                      <div className="col-card-overlay-gradient" />

                      {/* Three-dot context menu */}
                      <div className="col-menu-container" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="col-menu-trigger"
                          onClick={() => setMenuOpenId(menuOpenId === col.id ? null : col.id ?? null)}
                          aria-label="Collection options"
                          type="button"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuOpenId === col.id && (
                          <div className="col-menu-dropdown animate-fade-in">
                            <button
                              onClick={() => {
                                setMenuOpenId(null)
                                if (col.id) setActiveCollectionId(col.id)
                                setEditedName(col.name)
                                setIsEditingName(true)
                              }}
                              type="button"
                            >
                              Rename
                            </button>
                            <button
                              className="col-menu-delete"
                              onClick={() => {
                                setMenuOpenId(null)
                                if (col.id) handleDelete(col.id)
                              }}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="col-card-text">
                        <h4 className="col-card-name">{col.name}</h4>
                        <span className="col-card-count">{col.items?.length ?? 0} titles</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="col-empty-placeholder">
                <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>No collections yet</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                  Create lists like "Sci-Fi Favorites", "Oscar Marathons", or "Date Night Picks".
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── CREATE COLLECTION MODAL SHEET ── */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        label="Create collection"
      >
        <form onSubmit={handleCreate} className="dp-add-sheet">
          <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>New Collection</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary, #b3b6cb)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Collection Name (required)
              </label>
              <input
                type="text"
                required
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g. Favorite Sci-Fi, Award Winners, Comfort Shows"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  background: 'var(--bg-elevated, #1a1c28)',
                  border: '1.5px solid var(--border-default, #2a2c3d)',
                  color: 'var(--text-primary, #ffffff)',
                  fontFamily: 'inherit',
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary, #b3b6cb)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Description (optional)
              </label>
              <textarea
                value={newColDesc}
                onChange={(e) => setNewColDesc(e.target.value)}
                placeholder="What is this collection about?"
                style={{
                  width: '100%',
                  height: 80,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  background: 'var(--bg-elevated, #1a1c28)',
                  border: '1.5px solid var(--border-default, #2a2c3d)',
                  color: 'var(--text-primary, #ffffff)',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  resize: 'none',
                }}
              />
            </div>
            <button
              className="dp-confirm-btn"
              type="submit"
              disabled={createMutation.isPending}
              style={{ marginTop: 8 }}
            >
              {createMutation.isPending ? 'Creating…' : 'Create Collection'}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* ── ADD TITLES MODAL SHEET ── */}
      <BottomSheet
        isOpen={isAddTitlesOpen}
        onClose={() => {
          setIsAddTitlesOpen(false)
          setSearchQuery('')
        }}
        label="Add titles to collection"
      >
        <div className="dp-add-sheet">
          <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>Add Titles</p>
          <div
            className="sp-input-wrap"
            style={{
              margin: '0 0 16px 0',
              border: '1.5px solid var(--border-default, #2a2c3d)',
              borderRadius: 'var(--radius-md, 8px)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              background: 'var(--bg-elevated, #1a1c28)',
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your library..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary, #ffffff)',
                padding: '10px 10px',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div className="col-search-results-list">
            {candidateTitles.length > 0 ? (
              candidateTitles.map((item) => {
                const poster = getImageUrl(item.posterPath, 'w200')
                return (
                  <div key={item.titleKey} className="col-search-row">
                    {poster ? (
                      <img src={poster} alt={item.title} className="col-search-thumb" />
                    ) : (
                      <div className="col-search-thumb-ph">
                        <Film size={12} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{item.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                        {item.type === 'movie' ? 'Movie' : 'TV Show'} · {item.year ?? '—'}
                      </p>
                    </div>
                    <button
                      className="col-add-candidate-btn"
                      onClick={() =>
                        addItemMutation.mutate({
                          collectionId: activeCollectionId!,
                          item: {
                            titleKey: item.titleKey,
                            title: item.title,
                            posterPath: item.posterPath,
                            type: item.type,
                          },
                        })
                      }
                      type="button"
                    >
                      + Add
                    </button>
                  </div>
                )
              })
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '24px 0',
                }}
              >
                {searchQuery ? 'No matching titles found in library.' : 'Search your library to add titles.'}
              </p>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
