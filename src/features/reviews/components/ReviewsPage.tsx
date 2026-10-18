import { useState, useMemo } from 'react'
import { Star, MessageSquare, Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fetchReviews, saveReview, deleteReview } from '../api/reviewsApi'
import {
  toast,
  PageShell,
  PageHeader,
  StatRow,
  StatTile,
  FilterBar,
  SearchField,
  Button,
} from '@/shared/ui'
import type { Review } from '@/shared/schemas'
import { ReviewItemCard } from './ReviewItemCard'
import { ReviewEditorModal } from './ReviewEditorModal'

import './ReviewsPage.css'

export default function ReviewsPage() {
  const { user } = useAuthStore()
  const uid = user?.uid
  const queryClient = useQueryClient()

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', uid],
    queryFn: () => (uid ? fetchReviews(uid) : []),
    enabled: Boolean(uid),
  })

  const saveMutation = useMutation({
    mutationFn: async (reviewData: {
      titleKey: string
      title: string
      posterPath: string | null
      rating: number | null
      body: string
      containsSpoilers: boolean
    }) => {
      if (!uid) throw new Error('Not authenticated')
      return saveReview(uid, reviewData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', uid] })
      toast.success('Review saved!')
      setIsModalOpen(false)
    },
    onError: () => toast.error('Failed to save review.'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (titleKey: string) => {
      if (!uid) throw new Error('Not authenticated')
      return deleteReview(uid, titleKey)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', uid] })
      toast.success('Review deleted.')
    },
    onError: () => toast.error('Failed to delete review.'),
  })

  const [reviewSearch, setReviewSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'alphabetical'>('newest')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)

  const stats = useMemo(() => {
    const total = reviews.length
    const withRatings = reviews.filter((r) => r.rating !== null && r.rating !== undefined)
    const avg =
      withRatings.length > 0
        ? (withRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / withRatings.length).toFixed(1)
        : '0.0'
    const wordCountTotal = reviews.reduce((sum, r) => sum + r.body.split(/\s+/).filter(Boolean).length, 0)
    const perfectTens = reviews.filter((r) => r.rating === 10).length

    return { total, avg, wordCountTotal, perfectTens }
  }, [reviews])

  const sortedReviews = useMemo(() => {
    let list = [...reviews]
    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase().trim()
      list = list.filter((r) => r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q))
    }

    return list.sort((a, b) => {
      if (sortBy === 'highest') return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'lowest') return (a.rating || 0) - (b.rating || 0)
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title)

      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0
      return dateB - dateA
    })
  }, [reviews, reviewSearch, sortBy])

  const handleOpenCreate = () => {
    setEditingReview(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (review: Review) => {
    setEditingReview(review)
    setIsModalOpen(true)
  }

  const handleDelete = (titleKey: string, title: string) => {
    if (confirm(`Delete your review for "${title}"?`)) {
      deleteMutation.mutate(titleKey)
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="PERSONAL LOG"
        title="Reviews & Critiques"
        subtitle="Your ratings, detailed writeups, and personal thoughts on titles in your library."
        actions={
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleOpenCreate}>
            Write Review
          </Button>
        }
      >
        <SearchField
          value={reviewSearch}
          onChange={setReviewSearch}
          placeholder="Search reviews by title or keywords..."
        />
      </PageHeader>

      <StatRow>
        <StatTile
          icon={<MessageSquare size={20} />}
          value={stats.total}
          label="Total Reviews"
        />
        <StatTile
          icon={<Star size={20} />}
          value={stats.avg}
          label="Average Score"
        />
        <StatTile
          icon={<Star size={20} />}
          value={stats.perfectTens}
          label="10/10 Masterpieces"
        />
        <StatTile
          icon={<MessageSquare size={20} />}
          value={stats.wordCountTotal}
          label="Total Words Written"
        />
      </StatRow>

      {isLoading ? (
        <div className="skeleton-grid" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 140, borderRadius: 'var(--radius-card)' }}
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="col-empty-placeholder">
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>No reviews yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Write thoughtful critiques and rate your watched movies and shows.
          </p>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleOpenCreate}>
            Write First Review
          </Button>
        </div>
      ) : (
        <>
          <FilterBar
            sortOptions={[
              { value: 'newest', label: 'Newest' },
              { value: 'highest', label: 'Highest Rated' },
              { value: 'lowest', label: 'Lowest Rated' },
              { value: 'alphabetical', label: 'Title A-Z' },
            ]}
            sortValue={sortBy}
            onSortChange={(val) => setSortBy(val as any)}
            rightActions={
              <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>
                Showing {sortedReviews.length} of {reviews.length} reviews
              </span>
            }
          />

          <div className="reviews-list">
            {sortedReviews.map((review) => (
              <ReviewItemCard
                key={review.titleKey}
                review={review}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      <ReviewEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingReview={editingReview}
        onSave={(data) => saveMutation.mutate(data)}
        isPending={saveMutation.isPending}
      />
    </PageShell>
  )
}
