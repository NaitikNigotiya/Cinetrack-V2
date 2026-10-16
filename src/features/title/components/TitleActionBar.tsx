import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Play, Share2, Check, Tv, Calendar, MessageSquare, ListPlus, Plus, ChevronDown } from 'lucide-react'
import { Button, IconButton, RatingControl, toast } from '@/shared/ui'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibraryEntry } from '../hooks/useLibraryEntry'
import { addToLibrary, setStatus, toggleFavorite, setRating, removeFromLibraryWithUndo } from '@/features/library/api/libraryApi'
import { QuickAddToCollectionDialog } from '@/features/collections/components/QuickAddToCollectionDialog'
import { AddPlannedWatchDialog } from '@/features/calendar/components/AddPlannedWatchDialog'
import { ReviewDialog } from '@/features/reviews/components/ReviewDialog'
import type { LibraryStatus } from '@/shared/schemas'
import type { TitleDetails } from '@/shared/schemas/title'
import styles from './TitleActionBar.module.css'

interface TitleActionBarProps {
  details: TitleDetails
  onOpenTrailer: () => void
}

const STATUS_LABELS: Record<LibraryStatus | 'not_in_library', string> = {
  not_in_library: '+ Add to Library',
  plan_to_watch: 'Plan to Watch',
  watching: 'Watching',
  completed: 'Completed',
  on_hold: 'On Hold',
  dropped: 'Dropped',
}

export function TitleActionBar({ details, onOpenTrailer }: TitleActionBarProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid

  const { entry, refetch } = useLibraryEntry(uid, details.titleKey)
  const currentStatus = entry?.status ?? 'not_in_library'
  const currentRating = entry?.rating ?? null
  const currentFav = entry?.isFavorite ?? false

  const [isCollectionOpen, setIsCollectionOpen] = useState(false)
  const [isPlanOpen, setIsPlanOpen] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)

  const requireAuth = () => {
    if (!uid) {
      toast.error('Sign in to manage your library.')
      return false
    }
    return true
  }

  const handleStatusChange = useCallback(async (newStatus: LibraryStatus) => {
    if (!requireAuth()) return
    setIsStatusOpen(false)

    if (!entry) {
      await addToLibrary(uid!, {
        titleKey: details.titleKey,
        tmdbId: details.tmdbId,
        type: details.type,
        title: details.title,
        year: details.year,
        posterPath: details.posterPath,
        backdropPath: details.backdropPath,
        genres: details.genres,
        runtimeMinutes: details.runtimeMinutes,
        status: newStatus,
      })
      toast.success(`Added to library as "${STATUS_LABELS[newStatus]}"`)
    } else {
      await setStatus(uid!, details.titleKey, newStatus, entry)
      toast.success(`Status updated to "${STATUS_LABELS[newStatus]}"`)
    }
    void refetch()
  }, [uid, entry, details, refetch])

  const handleToggleFavorite = useCallback(async () => {
    if (!requireAuth()) return
    if (!entry) {
      await addToLibrary(uid!, {
        titleKey: details.titleKey,
        tmdbId: details.tmdbId,
        type: details.type,
        title: details.title,
        year: details.year,
        posterPath: details.posterPath,
        backdropPath: details.backdropPath,
        genres: details.genres,
        status: 'plan_to_watch',
        isFavorite: true,
      })
    } else {
      await toggleFavorite(uid!, details.titleKey, !currentFav)
    }
    toast.success(currentFav ? 'Removed from favorites' : 'Added to favorites')
    void refetch()
  }, [uid, entry, details, currentFav, refetch])

  const handleRatingChange = useCallback(async (val: number | null) => {
    if (!requireAuth()) return
    if (!entry) {
      await addToLibrary(uid!, {
        titleKey: details.titleKey,
        tmdbId: details.tmdbId,
        type: details.type,
        title: details.title,
        year: details.year,
        posterPath: details.posterPath,
        backdropPath: details.backdropPath,
        genres: details.genres,
        status: 'plan_to_watch',
        rating: val,
      })
    } else {
      await setRating(uid!, details.titleKey, val, currentRating)
    }
    toast.success(val ? `Rated ${val} / 10` : 'Rating cleared')
    void refetch()
  }, [uid, entry, details, currentRating, refetch])

  const handleRemove = useCallback(async () => {
    if (!uid || !entry) return
    await removeFromLibraryWithUndo(uid, details.titleKey, entry)
    void refetch()
  }, [uid, entry, details.titleKey, refetch])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `CineTrack: ${details.title}`, url: window.location.href })
      } catch { /* ignored */ }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.info('Link copied to clipboard')
    }
  }

  const hasTrailer = Boolean(details.trailerKey)

  return (
    <div className={styles.actionBar}>
      <div className={styles.leftGroup}>
        {/* Status dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.statusSelect}
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            aria-haspopup="listbox"
          >
            {entry ? <Check size={14} /> : <Plus size={14} />}
            {STATUS_LABELS[currentStatus]}
            <ChevronDown size={14} style={{ marginLeft: 2 }} />
          </button>
          {isStatusOpen && (
            <>
              <div onClick={() => setIsStatusOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-3)',
                zIndex: 50, minWidth: '180px', overflow: 'hidden',
              }}>
                {(['plan_to_watch', 'watching', 'completed', 'on_hold', 'dropped'] as LibraryStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    style={{
                      display: 'block', width: '100%', padding: '10px 14px',
                      background: currentStatus === s ? 'var(--accent-subtle)' : 'none',
                      color: currentStatus === s ? 'var(--accent-text)' : 'var(--text-1)',
                      border: 'none', borderBottom: '1px solid var(--border-subtle)',
                      fontSize: 'var(--font-size-sm)', fontWeight: currentStatus === s ? 700 : 500,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
                {entry && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    style={{
                      display: 'block', width: '100%', padding: '10px 14px',
                      background: 'none', color: 'var(--color-error)',
                      border: 'none', fontSize: 'var(--font-size-sm)',
                      fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    Remove from Library
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <IconButton
          icon={<Heart size={18} fill={currentFav ? 'currentColor' : 'none'} color={currentFav ? 'var(--color-accent)' : 'currentColor'} />}
          aria-label={currentFav ? 'Remove from favorites' : 'Add to favorites'}
          variant="ghost"
          onClick={handleToggleFavorite}
        />

        <div className={styles.ratingWrapper}>
          <RatingControl value={currentRating} onChange={handleRatingChange} scale="ten" />
        </div>
      </div>

      <div className={styles.rightGroup}>
        {details.type === 'movie' ? (
          <Button variant="primary" startIcon={<Check size={16} />} onClick={() => handleStatusChange('completed')}>
            Mark Watched
          </Button>
        ) : (
          <Button variant="primary" startIcon={<Tv size={16} />} onClick={() => navigate(`/title/${details.titleKey}/episodes`)}>
            Track Episodes
          </Button>
        )}

        {hasTrailer && (
          <Button variant="secondary" startIcon={<Play size={16} />} onClick={onOpenTrailer}>
            Trailer
          </Button>
        )}

        <IconButton icon={<Calendar size={18} />} aria-label="Plan a watch" variant="ghost" onClick={() => { if (requireAuth()) setIsPlanOpen(true) }} />
        <IconButton icon={<MessageSquare size={18} />} aria-label="Write a review" variant="ghost" onClick={() => { if (requireAuth()) setIsReviewOpen(true) }} />
        <IconButton icon={<ListPlus size={18} />} aria-label="Add to collection" variant="ghost" onClick={() => { if (requireAuth()) setIsCollectionOpen(true) }} />
        <IconButton icon={<Share2 size={18} />} aria-label="Share title" variant="ghost" onClick={handleShare} />
      </div>

      {uid && isCollectionOpen && (
        <QuickAddToCollectionDialog
          isOpen={isCollectionOpen}
          onClose={() => setIsCollectionOpen(false)}
          uid={uid}
          titleKey={details.titleKey}
          title={details.title}
          posterPath={details.posterPath}
          type={details.type}
        />
      )}
      {uid && isPlanOpen && (
        <AddPlannedWatchDialog
          isOpen={isPlanOpen}
          onClose={() => setIsPlanOpen(false)}
          uid={uid}
          titleKey={details.titleKey}
          title={details.title}
          posterPath={details.posterPath}
          type={details.type}
        />
      )}
      {uid && isReviewOpen && (
        <ReviewDialog
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          uid={uid}
          titleKey={details.titleKey}
          title={details.title}
          posterPath={details.posterPath}
        />
      )}
    </div>
  )
}
