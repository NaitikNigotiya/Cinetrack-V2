import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  getCollection,
  updateCollectionItems,
  removeItemFromCollection,
} from '../api/collectionsApi'
import { CollectionDialog } from './CollectionDialog'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { Button, IconButton, Skeleton, EmptyState, ConfirmDialog, toast } from '@/shared/ui'
import {
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Film,
} from 'lucide-react'
import type { CollectionItem } from '@/shared/schemas'
import styles from './CollectionDetailPage.module.css'

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<CollectionItem | null>(null)

  const collectionQuery = useQuery({
    queryKey: ['collection', uid, id],
    queryFn: () => (uid && id ? getCollection(uid, id) : null),
    enabled: Boolean(uid && id),
  })

  const col = collectionQuery.data

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!uid || !id || !col) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= col.items.length) return

    const newItems = [...col.items]
    const current = newItems[index]
    const target = newItems[targetIndex]
    if (!current || !target) return

    newItems[index] = target
    newItems[targetIndex] = current

    try {
      await updateCollectionItems(uid, id, newItems)
      collectionQuery.refetch()
    } catch {
      toast.error('Failed to reorder items.')
    }
  }

  const handleRemoveConfirm = async () => {
    if (!uid || !id || !itemToRemove) return
    try {
      await removeItemFromCollection(uid, id, itemToRemove.titleKey)
      toast.success(`Removed ${itemToRemove.title} from collection.`)
      collectionQuery.refetch()
    } catch {
      toast.error('Failed to remove item.')
    } finally {
      setItemToRemove(null)
    }
  }

  if (collectionQuery.isLoading) {
    return (
      <div className={styles.container}>
        <Skeleton height={200} />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </div>
    )
  }

  if (!col) {
    return (
      <div className={styles.container}>
        <EmptyState
          title="Collection not found"
          description="This collection may have been removed or does not exist."
          action={
            <Button variant="secondary" onClick={() => navigate('/collections')}>
              Back to Collections
            </Button>
          }
        />
      </div>
    )
  }

  const posters = col.items.slice(0, 6).map((item) => item.posterPath).filter(Boolean)

  return (
    <div className={styles.container}>
      <div className={styles.navBar}>
        <Link to="/collections" className={styles.backLink}>
          <ChevronLeft size={20} />
          <span>Collections</span>
        </Link>
      </div>

      <header className={styles.hero}>
        {posters.length > 0 && (
          <div className={styles.mosaicBackdrop}>
            {posters.map((p, idx) => (
              <img
                key={idx}
                src={getPosterUrl(p, 'w185') ?? ''}
                alt=""
                className={styles.backdropPoster}
              />
            ))}
            <div className={styles.backdropOverlay} />
          </div>
        )}

        <div className={styles.heroContent}>
          <span className={styles.emoji}>{col.emoji || '🎬'}</span>
          <div className={styles.heroInfo}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{col.name}</h1>
              <IconButton
                icon={<Edit2 size={18} />}
                aria-label="Edit collection details"
                onClick={() => setIsEditDialogOpen(true)}
              />
            </div>
            {col.description && <p className={styles.description}>{col.description}</p>}
            <p className={styles.meta}>
              {col.items.length} {col.items.length === 1 ? 'title' : 'titles'}
            </p>
          </div>
        </div>
      </header>

      <section className={styles.itemsSection}>
        {col.items.length === 0 ? (
          <EmptyState
            icon={<Film size={48} />}
            title="Collection is empty"
            description="Add titles to this collection from any movie or show detail page."
            action={
              <Button variant="primary" onClick={() => navigate('/search')}>
                Find Titles to Add
              </Button>
            }
          />
        ) : (
          <div className={styles.itemList}>
            {col.items.map((item, index) => (
              <div key={item.titleKey} className={styles.itemRow}>
                <div className={styles.reorderBtns}>
                  <IconButton
                    icon={<ArrowUp size={16} />}
                    aria-label={`Move ${item.title} up`}
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                  />
                  <IconButton
                    icon={<ArrowDown size={16} />}
                    aria-label={`Move ${item.title} down`}
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === col.items.length - 1}
                  />
                </div>

                <div className={styles.itemPoster}>
                  {item.posterPath ? (
                    <img
                      src={getPosterUrl(item.posterPath, 'w92') ?? ''}
                      alt={item.title}
                      className={styles.itemPosterImg}
                    />
                  ) : (
                    <div className={styles.itemPosterEmpty} />
                  )}
                </div>

                <div className={styles.itemDetails}>
                  <Link to={`/title/${item.titleKey}`} className={styles.itemTitle}>
                    {item.title}
                  </Link>
                  <span className={styles.itemType}>{item.type.toUpperCase()}</span>
                </div>

                <div className={styles.itemActions}>
                  <IconButton
                    icon={<Trash2 size={16} />}
                    aria-label={`Remove ${item.title} from collection`}
                    onClick={() => setItemToRemove(item)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isEditDialogOpen && uid && (
        <CollectionDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          uid={uid}
          initialCollection={col}
          onSaved={() => collectionQuery.refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(itemToRemove)}
        title="Remove Title"
        message={`Remove "${itemToRemove?.title}" from this collection?`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setItemToRemove(null)}
      />
    </div>
  )
}
