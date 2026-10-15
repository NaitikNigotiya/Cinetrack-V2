import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, Button, Skeleton, toast } from '@/shared/ui'
import {
  fetchCollections,
  addItemToCollection,
  removeItemFromCollection,
} from '../api/collectionsApi'
import { Check, FolderPlus } from 'lucide-react'
import styles from './QuickAddToCollectionDialog.module.css'

interface QuickAddToCollectionDialogProps {
  isOpen: boolean
  onClose: () => void
  uid: string
  titleKey: string
  title: string
  posterPath: string | null
  type: 'movie' | 'tv'
  onChanged?: () => void
}

export function QuickAddToCollectionDialog({
  isOpen,
  onClose,
  uid,
  titleKey,
  title,
  posterPath,
  type,
  onChanged,
}: QuickAddToCollectionDialogProps) {
  const [busyColId, setBusyColId] = useState<string | null>(null)

  const collectionsQuery = useQuery({
    queryKey: ['collections', uid],
    queryFn: () => fetchCollections(uid),
    enabled: isOpen && Boolean(uid),
  })

  const collections = collectionsQuery.data ?? []

  const handleToggle = async (collectionId: string, isInCollection: boolean) => {
    setBusyColId(collectionId)
    try {
      if (isInCollection) {
        await removeItemFromCollection(uid, collectionId, titleKey)
        toast.success(`Removed from collection`)
      } else {
        await addItemToCollection(uid, collectionId, {
          titleKey,
          title,
          posterPath,
          type,
        })
        toast.success(`Added to collection`)
      }
      collectionsQuery.refetch()
      onChanged?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update collection'
      toast.error(msg)
    } finally {
      setBusyColId(null)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Add "${title}" to Collection`}>
      <div className={styles.container}>
        {collectionsQuery.isLoading ? (
          <div className={styles.loadingList}>
            <Skeleton height={48} />
            <Skeleton height={48} />
          </div>
        ) : collections.length === 0 ? (
          <div className={styles.emptyState}>
            <FolderPlus size={36} className={styles.emptyIcon} />
            <p>You haven't created any collections yet.</p>
            <p className={styles.emptySub}>Go to Collections to create your first list.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {collections.map((col) => {
              const isIn = col.items.some((i) => i.titleKey === titleKey)
              const isBusy = busyColId === col.id

              return (
                <button
                  key={col.id}
                  type="button"
                  className={`${styles.row} ${isIn ? styles.rowActive : ''}`}
                  onClick={() => col.id && handleToggle(col.id, isIn)}
                  disabled={isBusy}
                >
                  <div className={styles.rowLeft}>
                    <span className={styles.emoji}>{col.emoji || '🎬'}</span>
                    <div className={styles.colInfo}>
                      <span className={styles.colName}>{col.name}</span>
                      <span className={styles.colCount}>{col.items.length} titles</span>
                    </div>
                  </div>

                  <div className={`${styles.checkCircle} ${isIn ? styles.checkActive : ''}`}>
                    {isIn && <Check size={16} />}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
