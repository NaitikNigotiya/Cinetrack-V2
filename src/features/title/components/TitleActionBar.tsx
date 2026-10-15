import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Play, Share2, Check, ListPlus, Tv } from 'lucide-react'
import { Button, IconButton, RatingControl, toast } from '@/shared/ui'
import type { LibraryStatus } from '@/shared/schemas'
import styles from './TitleActionBar.module.css'

interface TitleActionBarProps {
  titleKey: string
  title: string
  type: 'movie' | 'tv'
  hasTrailer: boolean
  onOpenTrailer: () => void
}

export function TitleActionBar({
  titleKey,
  title,
  type,
  hasTrailer,
  onOpenTrailer,
}: TitleActionBarProps) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<LibraryStatus | 'not_in_library'>('not_in_library')
  const [isFavorite, setIsFavorite] = useState(false)
  const [rating, setRating] = useState<number | null>(null)

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as LibraryStatus)
    toast.success(`Updated status to ${newStatus.replace('_', ' ')}`)
  }

  const handleToggleFavorite = () => {
    const next = !isFavorite
    setIsFavorite(next)
    toast.success(next ? `Added to favorites` : `Removed from favorites`)
  }

  const handleRatingChange = (val: number | null) => {
    setRating(val)
    toast.success(val ? `Rated ${val} / 10` : 'Rating removed')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CineTrack: ${title}`,
          url: window.location.href,
        })
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.info('Link copied to clipboard')
    }
  }

  return (
    <div className={styles.actionBar}>
      <div className={styles.leftGroup}>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={styles.statusSelect}
          aria-label="Watchlist Status"
        >
          <option value="not_in_library">+ Add to Library</option>
          <option value="plan_to_watch">Plan to Watch</option>
          <option value="watching">Watching</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="dropped">Dropped</option>
        </select>

        <IconButton
          icon={<Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} color={isFavorite ? 'var(--accent)' : 'currentColor'} />}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          variant="ghost"
          onClick={handleToggleFavorite}
        />

        <div className={styles.ratingWrapper}>
          <RatingControl value={rating} onChange={handleRatingChange} scale="ten" />
        </div>
      </div>

      <div className={styles.rightGroup}>
        {type === 'movie' ? (
          <Button
            variant="primary"
            leftIcon={<Check size={16} />}
            onClick={() => handleStatusChange('completed')}
          >
            Mark Watched
          </Button>
        ) : (
          <Button
            variant="primary"
            leftIcon={<Tv size={16} />}
            onClick={() => navigate(`/title/${titleKey}/episodes`)}
          >
            Track Episodes
          </Button>
        )}

        {hasTrailer && (
          <Button
            variant="secondary"
            leftIcon={<Play size={16} />}
            onClick={onOpenTrailer}
          >
            Trailer
          </Button>
        )}

        <IconButton
          icon={<ListPlus size={18} />}
          aria-label="Add to custom collection"
          variant="ghost"
          onClick={() => toast.info('Collections modal (Phase 5)')}
        />

        <IconButton
          icon={<Share2 size={18} />}
          aria-label="Share title"
          variant="ghost"
          onClick={handleShare}
        />
      </div>
    </div>
  )
}
