import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fetchCollections, deleteCollection } from '../api/collectionsApi'
import { CollectionCard } from './CollectionCard'
import { CollectionDialog } from './CollectionDialog'
import { Button, Skeleton, EmptyState, ConfirmDialog, toast } from '@/shared/ui'
import { Plus, FolderPlus } from 'lucide-react'
import type { Collection } from '@/shared/schemas'
import styles from './CollectionsPage.module.css'

export default function CollectionsPage() {
  const { user } = useAuthStore()
  const uid = user?.uid

  const [editingCol, setEditingCol] = useState<Collection | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingCol, setDeletingCol] = useState<Collection | null>(null)

  const collectionsQuery = useQuery({
    queryKey: ['collections', uid],
    queryFn: () => (uid ? fetchCollections(uid) : []),
    enabled: Boolean(uid),
  })

  const collections = collectionsQuery.data ?? []

  const handleDeleteConfirm = async () => {
    if (!uid || !deletingCol || !deletingCol.id) return
    try {
      await deleteCollection(uid, deletingCol.id)
      toast.success('Collection deleted.')
      collectionsQuery.refetch()
    } catch {
      toast.error('Failed to delete collection.')
    } finally {
      setDeletingCol(null)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Collections</h1>
          <p className={styles.subtitle}>
            Organize movies and shows into custom lists and marathons
          </p>
        </div>

        <Button
          variant="primary"
          startIcon={<Plus size={16} />}
          onClick={() => {
            setEditingCol(null)
            setIsDialogOpen(true)
          }}
        >
          New Collection
        </Button>
      </header>

      {collectionsQuery.isLoading ? (
        <div className={styles.grid}>
          <Skeleton height={240} />
          <Skeleton height={240} />
          <Skeleton height={240} />
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={<FolderPlus size={48} />}
          title="No collections yet"
          description="Create custom lists like 'Spooky Halloween', 'Oscar Contenders', or 'Weekend Binges'."
          action={
            <Button
              variant="primary"
              startIcon={<Plus size={16} />}
              onClick={() => {
                setEditingCol(null)
                setIsDialogOpen(true)
              }}
            >
              Create First Collection
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              onEdit={(c) => {
                setEditingCol(c)
                setIsDialogOpen(true)
              }}
              onDelete={setDeletingCol}
            />
          ))}
        </div>
      )}

      {isDialogOpen && uid && (
        <CollectionDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setEditingCol(null)
          }}
          uid={uid}
          initialCollection={editingCol}
          onSaved={() => collectionsQuery.refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingCol)}
        title="Delete Collection"
        message={`Are you sure you want to delete "${deletingCol?.name}"? Titles in this collection will remain in your library.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCol(null)}
      />
    </div>
  )
}
