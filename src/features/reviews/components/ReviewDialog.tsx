import { useState, useEffect } from 'react'
import { Dialog, Button, RatingControl } from '@/shared/ui'
import { toast } from '@/shared/ui'
import { saveReview } from '../api/reviewsApi'
import type { Review } from '@/shared/schemas'
import styles from './ReviewDialog.module.css'

interface ReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  uid: string
  initialReview?: Review | null
  titleKey: string
  title: string
  posterPath: string | null
  onSaved?: () => void
}

export function ReviewDialog({
  isOpen,
  onClose,
  uid,
  initialReview,
  titleKey,
  title,
  posterPath,
  onSaved,
}: ReviewDialogProps) {
  const draftKey = `cinetrack_draft_review_${titleKey}`

  const [rating, setRating] = useState<number | null>(() => {
    return initialReview?.rating ?? null
  })

  const [body, setBody] = useState<string>(() => {
    if (initialReview?.body) return initialReview.body
    return localStorage.getItem(draftKey) ?? ''
  })

  const [containsSpoilers, setContainsSpoilers] = useState<boolean>(() => {
    return initialReview?.containsSpoilers ?? false
  })

  const [isSaving, setIsSaving] = useState(false)

  // Auto-save draft on body change
  useEffect(() => {
    if (body.trim()) {
      localStorage.setItem(draftKey, body)
    } else {
      localStorage.removeItem(draftKey)
    }
  }, [body, draftKey])

  const handleSave = async () => {
    if (body.length > 5000) {
      toast.error('Review must be 5000 characters or fewer.')
      return
    }

    setIsSaving(true)
    try {
      await saveReview(uid, {
        titleKey,
        title,
        posterPath,
        rating,
        body: body.trim(),
        containsSpoilers,
      })
      localStorage.removeItem(draftKey)
      toast.success('Review saved!')
      onSaved?.()
      onClose()
    } catch {
      toast.error('Failed to save review.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Review ${title}`}>
      <div className={styles.form}>
        <div className={styles.ratingRow}>
          <label className={styles.label}>Your Rating</label>
          <RatingControl value={rating} onChange={setRating} />
        </div>

        <div className={styles.bodyRow}>
          <div className={styles.labelRow}>
            <label className={styles.label} htmlFor="review-body">
              Your Review
            </label>
            <span className={`${styles.counter} ${body.length > 5000 ? styles.counterLimit : ''}`}>
              {body.length} / 5000
            </span>
          </div>
          <textarea
            id="review-body"
            className={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts on this title..."
            rows={6}
          />
        </div>

        <div className={styles.spoilerRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={containsSpoilers}
              onChange={(e) => setContainsSpoilers(e.target.checked)}
              className={styles.checkbox}
            />
            Contains spoilers
          </label>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Review'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
