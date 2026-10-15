import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, Button, RatingControl } from '@/shared/ui'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { Shuffle, Film, Eye } from 'lucide-react'
import type { LibraryEntry } from '@/shared/schemas'
import styles from './SurpriseMeDialog.module.css'

interface SurpriseMeDialogProps {
  isOpen: boolean
  onClose: () => void
  candidates: LibraryEntry[]
}

export function SurpriseMeDialog({ isOpen, onClose, candidates }: SurpriseMeDialogProps) {
  const navigate = useNavigate()
  const [pickedIndex, setPickedIndex] = useState(() => {
    return candidates.length > 0 ? Math.floor(Math.random() * candidates.length) : 0
  })

  const pickRandom = () => {
    if (candidates.length <= 1) return
    let nextIndex = pickedIndex
    while (nextIndex === pickedIndex) {
      nextIndex = Math.floor(Math.random() * candidates.length)
    }
    setPickedIndex(nextIndex)
  }

  const current = candidates[pickedIndex]

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="🎲 What should I watch?">
      <div className={styles.container}>
        {candidates.length === 0 || !current ? (
          <div className={styles.empty}>
            <p>Your "Plan to Watch" list is empty!</p>
            <p className={styles.emptySub}>Add titles to your library to use Surprise Me.</p>
          </div>
        ) : (
          <div className={styles.card}>
            <div className={styles.posterArea}>
              {current.posterPath ? (
                <img
                  src={getPosterUrl(current.posterPath, 'w185') ?? ''}
                  alt={current.title}
                  className={styles.posterImg}
                />
              ) : (
                <div className={styles.posterFallback}>
                  <Film size={36} />
                </div>
              )}
            </div>

            <div className={styles.infoArea}>
              <span className={styles.typeBadge}>{current.type.toUpperCase()}</span>
              <h3 className={styles.title}>{current.title}</h3>
              {current.year && (
                <span className={styles.year}>{current.year}</span>
              )}
              {current.rating && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <RatingControl value={current.rating} readonly size="sm" />
                </div>
              )}

              <div className={styles.cardActions}>
                <Button
                  variant="primary"
                  startIcon={<Eye size={16} />}
                  onClick={() => {
                    navigate(`/title/${current.titleKey}`)
                    onClose()
                  }}
                >
                  View Details
                </Button>
                <Button
                  variant="secondary"
                  startIcon={<Shuffle size={16} />}
                  onClick={pickRandom}
                >
                  Roll Again
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
