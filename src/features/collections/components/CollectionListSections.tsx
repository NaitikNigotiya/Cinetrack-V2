import { Plus, MoreVertical, Trash2, Film } from 'lucide-react'
import { getImageUrl } from '@/services/tmdb/images'
import { Button } from '@/shared/ui/Button/Button'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'
import { Section } from '@/shared/ui/layout/Section'
import type { Collection, LibraryEntry } from '@/shared/schemas'
import type { SmartCollection } from './smartCollections'

function renderCover(items: Array<{ posterPath: string | null }>) {
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

function renderSmartCover(items: LibraryEntry[]) {
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

interface CollectionListSectionsProps {
  tabFilter: 'all' | 'custom' | 'smart'
  colSearch: string
  onClearSearch?: () => void
  smartCollections: SmartCollection[]
  collections: Collection[]
  onSelectCollection: (id: string) => void
  onOpenCreate: () => void
  onDeleteCollection: (id: string, e: React.MouseEvent) => void
  menuOpenId: string | null
  setMenuOpenId: (id: string | null) => void
}

export function CollectionListSections({
  tabFilter,
  colSearch,
  onClearSearch,
  smartCollections,
  collections,
  onSelectCollection,
  onOpenCreate,
  onDeleteCollection,
  menuOpenId,
  setMenuOpenId,
}: CollectionListSectionsProps) {
  const filteredSmart = smartCollections.filter((c) =>
    colSearch
      ? c.name.toLowerCase().includes(colSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(colSearch.toLowerCase())
      : true
  )

  const filteredCustom = collections.filter((c) =>
    colSearch
      ? c.name.toLowerCase().includes(colSearch.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(colSearch.toLowerCase())
      : true
  )

  const hasSearch = colSearch.trim().length > 0
  const isSearchEmpty =
    hasSearch &&
    ((tabFilter === 'all' && filteredSmart.length === 0 && filteredCustom.length === 0) ||
      (tabFilter === 'smart' && filteredSmart.length === 0) ||
      (tabFilter === 'custom' && filteredCustom.length === 0))

  if (isSearchEmpty) {
    return (
      <EmptyStateCard
        title={`No collections match "${colSearch}"`}
        description="Try searching with different keywords or check spelling."
        action={
          onClearSearch ? (
            <Button variant="secondary" onClick={onClearSearch}>
              Clear Search
            </Button>
          ) : undefined
        }
      />
    )
  }

  // All lists empty state when library has no collections yet
  if (tabFilter === 'all' && collections.length === 0 && smartCollections.length === 0) {
    return (
      <EmptyStateCard
        title="No collections yet"
        description="Organize your favorite movies and shows into custom lists and smart collections."
        action={
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onOpenCreate}>
            Create First Collection
          </Button>
        }
      />
    )
  }

  // Custom tab empty state
  if (tabFilter === 'custom' && filteredCustom.length === 0) {
    return (
      <EmptyStateCard
        title="No custom collections yet"
        description="Create your first custom collection to curate movies and TV shows."
        action={
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onOpenCreate}>
            Create First Collection
          </Button>
        }
      />
    )
  }

  // Smart tab empty state
  if (tabFilter === 'smart' && filteredSmart.length === 0) {
    return (
      <EmptyStateCard
        title="No smart collections yet"
        description="Smart auto-lists are generated automatically as you add titles to your library (directors, franchises, ratings)."
      />
    )
  }

  const showSmart = (tabFilter === 'all' || tabFilter === 'smart') && filteredSmart.length > 0
  const showCustom = tabFilter === 'all' || tabFilter === 'custom'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {showSmart && (
        <Section title="⚡ Smart Collections">
          <div className="col-cards-grid">
            {filteredSmart.map((col) => (
              <article
                key={col.id}
                className="col-card"
                onClick={() => onSelectCollection(col.id)}
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
        </Section>
      )}

      {showCustom && (
        <Section title="📂 Custom Lists">
          <div className="col-cards-grid">
            <article
              className="col-card col-card--create"
              onClick={onOpenCreate}
            >
              <div className="col-create-action-inner">
                <Plus size={28} />
                <span>Create New Collection</span>
              </div>
            </article>

            {filteredCustom.map((col) => {
              const itemCount = col.items?.length || 0
              const isMenuOpen = menuOpenId === col.id
              return (
                <article
                  key={col.id ?? col.name}
                  className="col-card"
                  onClick={() => col.id && onSelectCollection(col.id)}
                >
                  <div className="col-card-cover-wrap">
                    {renderCover(col.items || [])}
                    <div className="col-card-overlay-gradient" />
                    <div className="col-card-text">
                      <h4 className="col-card-name">{col.name}</h4>
                      <span className="col-card-count">
                        {itemCount} {itemCount === 1 ? 'title' : 'titles'}
                      </span>
                    </div>
                  </div>

                  <div
                    className="col-menu-container"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="col-menu-trigger"
                      onClick={() => setMenuOpenId(isMenuOpen ? null : (col.id ?? null))}
                      type="button"
                      aria-label="Collection options"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {isMenuOpen && (
                      <div className="col-menu-dropdown">
                        <button
                          className="col-menu-delete"
                          onClick={(e) => col.id && onDeleteCollection(col.id, e)}
                          type="button"
                        >
                          <Trash2 size={13} style={{ marginRight: 6 }} /> Delete List
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}
