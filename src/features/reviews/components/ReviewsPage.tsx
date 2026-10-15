import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fetchReviews, deleteReview } from '../api/reviewsApi'
import { ReviewCard } from './ReviewCard'
import { ReviewDialog } from './ReviewDialog'
import { EmptyState, Skeleton, ConfirmDialog, toast } from '@/shared/ui'
import { MessageSquare } from 'lucide-react'
import type { Review } from '@/shared/schemas'
import styles from './ReviewsPage.module.css'

export default function ReviewsPage() {
  const { user } = useAuthStore()
  const uid = user?.uid

  const [filterSpoilers, setFilterSpoilers] = useState<'all' | 'spoilers_only' | 'no_spoilers'>('all')
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingReview, setDeletingReview] = useState<Review | null>(null)

  const reviewsQuery = useQuery({
    queryKey: ['reviews', uid],
    queryFn: () => (uid ? fetchReviews(uid) : []),
    enabled: Boolean(uid),
  })

  const rawReviews = reviewsQuery.data

  const reviews = useMemo(() => {
    if (!rawReviews) return []
    return rawReviews.filter((r) => {
      if (filterSpoilers === 'spoilers_only') return r.containsSpoilers
      if (filterSpoilers === 'no_spoilers') return !r.containsSpoilers
      return true
    })
  }, [rawReviews, filterSpoilers])

  const handleEdit = (rev: Review) => {
    setEditingReview(rev)
    setIsDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!uid || !deletingReview) return
    try {
      await deleteReview(uid, deletingReview.titleKey)
      toast.success('Review deleted.')
      reviewsQuery.refetch()
    } catch {
      toast.error('Failed to delete review.')
    } finally {
      setDeletingReview(null)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>My Reviews</h1>
          <p className={styles.subtitle}>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} written
          </p>
        </div>

        <div className={styles.filters}>
          <select
            className={styles.select}
            value={filterSpoilers}
            onChange={(e) => setFilterSpoilers(e.target.value as any)}
            aria-label="Filter spoilers"
          >
            <option value="all">All Reviews</option>
            <option value="no_spoilers">No Spoilers</option>
            <option value="spoilers_only">With Spoilers</option>
          </select>
        </div>
      </header>

      {reviewsQuery.isLoading ? (
        <div className={styles.list}>
          <Skeleton height={140} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={48} />}
          title="No reviews yet"
          description="Write reviews for movies and TV shows from their detail pages to see them here."
        />
      ) : (
        <div className={styles.list}>
          {reviews.map((rev) => (
            <ReviewCard
              key={rev.titleKey}
              review={rev}
              onEdit={handleEdit}
              onDelete={setDeletingReview}
            />
          ))}
        </div>
      )}

      {editingReview && uid && (
        <ReviewDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setEditingReview(null)
          }}
          uid={uid}
          initialReview={editingReview}
          titleKey={editingReview.titleKey}
          title={editingReview.title}
          posterPath={editingReview.posterPath}
          onSaved={() => reviewsQuery.refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingReview)}
        title="Delete Review"
        message={`Are you sure you want to delete your review for "${deletingReview?.title}"?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingReview(null)}
      />
    </div>
  )
}
