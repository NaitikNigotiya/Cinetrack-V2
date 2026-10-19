import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Check,
  Trash2,
  Clock,
  Play,
  Pause,
  Film,
} from 'lucide-react'
import type { LibraryStatus, LibraryEntry } from '@/shared/schemas'
import type { TitleDetails } from '@/shared/schemas/title'
import { getPosterUrl } from '@/services/tmdb/images'
import { BottomSheet } from '@/shared/ui/BottomSheet/BottomSheet'
import { Pill } from '@/shared/ui/layout/Pill'
import { Button } from '@/shared/ui/Button/Button'
import { RatingControl } from '@/shared/ui/RatingControl/RatingControl'
import './UpdateWatchStatusModal.css'

export interface UpdateWatchStatusModalProps {
  isOpen: boolean
  onClose: () => void
  details: TitleDetails
  entry: LibraryEntry | null
  isMovie: boolean
  onSave: (status: LibraryStatus, date?: Date, rating?: number | null) => Promise<void> | void
  onRemove: () => Promise<void> | void
}

interface StatusOptionItem {
  value: LibraryStatus
  label: string
  desc: string
  icon: React.ReactNode
  color: string
  bg: string
}

const STATUS_ITEMS: StatusOptionItem[] = [
  {
    value: 'plan_to_watch',
    label: 'Plan to Watch',
    desc: 'Want to watch in the future',
    icon: <Clock size={20} />,
    color: 'var(--status-plan)',
    bg: 'var(--status-plan-subtle)',
  },
  {
    value: 'watching',
    label: 'Watching',
    desc: 'Actively watching this title',
    icon: <Play size={20} fill="currentColor" />,
    color: 'var(--status-watching)',
    bg: 'var(--status-watching-subtle)',
  },
  {
    value: 'completed',
    label: 'Completed',
    desc: 'Finished watching this title',
    icon: <Check size={20} strokeWidth={2.5} />,
    color: 'var(--status-completed)',
    bg: 'var(--status-completed-subtle)',
  },
  {
    value: 'on_hold',
    label: 'On Hold',
    desc: 'Paused watching for now',
    icon: <Pause size={20} />,
    color: 'var(--status-on-hold)',
    bg: 'var(--status-on-hold-subtle)',
  },
  {
    value: 'dropped',
    label: 'Dropped',
    desc: 'Decided to stop watching',
    icon: <X size={20} strokeWidth={2.5} />,
    color: 'var(--status-dropped)',
    bg: 'var(--status-dropped-subtle)',
  },
]

const STATUS_LABEL_MAP: Record<LibraryStatus, string> = {
  plan_to_watch: 'Plan to Watch',
  watching: 'Watching',
  completed: 'Completed',
  on_hold: 'On Hold',
  dropped: 'Dropped',
}

export function UpdateWatchStatusModal({
  isOpen,
  onClose,
  details,
  entry,
  isMovie,
  onSave,
  onRemove,
}: UpdateWatchStatusModalProps) {
  const currentStatus: LibraryStatus = entry?.status ?? 'plan_to_watch'
  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>(currentStatus)
  const [watchedDate, setWatchedDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [rating, setRating] = useState<number | null>(entry?.rating ?? null)
  const [isSaving, setIsSaving] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(() => {
    const idx = STATUS_ITEMS.findIndex((opt) => opt.value === currentStatus)
    return idx >= 0 ? idx : 0
  })

  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(entry?.status ?? 'plan_to_watch')
      setWatchedDate(new Date().toISOString().slice(0, 10))
      setRating(entry?.rating ?? null)
      const idx = STATUS_ITEMS.findIndex((opt) => opt.value === (entry?.status ?? 'plan_to_watch'))
      setFocusedIndex(idx >= 0 ? idx : 0)
    }
  }, [isOpen, entry])

  // Keyboard navigation: numbers 1-5, arrow keys, Esc
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Direct number shortcuts: 1-5
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const num = parseInt(e.key, 10) - 1
        const opt = STATUS_ITEMS[num]
        if (opt) {
          e.preventDefault()
          setSelectedStatus(opt.value)
          setFocusedIndex(num)
          optionRefs.current[num]?.focus()
        }
        return
      }

      // Arrow navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          const next = (prev + 1) % STATUS_ITEMS.length
          const opt = STATUS_ITEMS[next]
          if (opt) {
            setSelectedStatus(opt.value)
            optionRefs.current[next]?.focus()
          }
          return next
        })
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        setFocusedIndex((prev) => {
          const next = (prev - 1 + STATUS_ITEMS.length) % STATUS_ITEMS.length
          const opt = STATUS_ITEMS[next]
          if (opt) {
            setSelectedStatus(opt.value)
            optionRefs.current[next]?.focus()
          }
          return next
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  const poster = details.posterPath ? getPosterUrl(details.posterPath, 'w185') : null
  const isChanged = selectedStatus !== currentStatus

  const handleSave = async () => {
    if (!isChanged && !(selectedStatus === 'completed' && isMovie)) return
    setIsSaving(true)
    try {
      const dateObj = selectedStatus === 'completed' && isMovie ? new Date(`${watchedDate}T12:00:00`) : undefined
      await onSave(selectedStatus, dateObj, rating)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveClick = async () => {
    const confirmed = window.confirm(
      `Remove ${details.title} from your library? Your history for it will be deleted.`
    )
    if (confirmed) {
      onClose()
      await onRemove()
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} label="Update status">
      <div className="status-modal-root">
        {/* Header */}
        <header className="status-modal-header">
          <div className="status-modal-header-left">
            {poster ? (
              <img src={poster} alt={details.title} className="status-modal-thumb" />
            ) : (
              <div className="status-modal-thumb status-modal-thumb--fallback">
                <Film size={20} />
              </div>
            )}
            <div className="status-modal-title-wrap">
              <h3 className="status-modal-title">Update status</h3>
              <p className="status-modal-subtitle" title={details.title}>
                {details.title}
              </p>
            </div>
          </div>

          <div className="status-modal-header-right">
            <Pill variant="default" className="status-modal-current-pill">
              Current: {STATUS_LABEL_MAP[currentStatus] || currentStatus}
            </Pill>
            <button
              type="button"
              className="status-modal-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Options List (Radio Group) */}
        <div
          className="status-modal-options-list"
          role="radiogroup"
          aria-label="Select watch status"
        >
          {STATUS_ITEMS.map((opt, idx) => {
            const isSelected = selectedStatus === opt.value
            return (
              <div
                key={opt.value}
                ref={(el) => { optionRefs.current[idx] = el }}
                role="radio"
                aria-checked={isSelected}
                tabIndex={focusedIndex === idx ? 0 : -1}
                className={`status-modal-card ${isSelected ? 'status-modal-card--selected' : ''}`}
                onClick={() => {
                  setSelectedStatus(opt.value)
                  setFocusedIndex(idx)
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    setSelectedStatus(opt.value)
                  }
                }}
              >
                <div
                  className="status-modal-icon-tile"
                  style={{
                    backgroundColor: opt.bg,
                    color: opt.color,
                  }}
                >
                  {opt.icon}
                </div>

                <div className="status-modal-card-info">
                  <div className="status-modal-card-label">{opt.label}</div>
                  <div className="status-modal-card-desc">{opt.desc}</div>
                </div>

                {isSelected && (
                  <div className="status-modal-check-wrap">
                    <Check size={18} strokeWidth={2.5} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Inline Optional Row: Completed for Movies */}
        {selectedStatus === 'completed' && isMovie && (
          <div className="status-modal-completed-extra">
            <div className="status-modal-extra-field">
              <label htmlFor="status-watched-date" className="status-modal-field-label">
                Watched on
              </label>
              <input
                id="status-watched-date"
                type="date"
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
                className="status-modal-date-input"
              />
            </div>

            <div className="status-modal-extra-field">
              <span className="status-modal-field-label">Your Rating (Optional)</span>
              <div className="status-modal-rating-wrap">
                <RatingControl
                  value={rating}
                  onChange={(val) => setRating(val)}
                  size="md"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons: Save & Cancel */}
        <div className="status-modal-actions-row">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="status-modal-btn-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!isChanged && !(selectedStatus === 'completed' && isMovie)}
            isLoading={isSaving}
            onClick={handleSave}
            className="status-modal-btn-save"
          >
            Save
          </Button>
        </div>

        {/* Bottom Danger Action */}
        {entry && (
          <div className="status-modal-footer">
            <div className="status-modal-divider" />
            <button
              type="button"
              className="status-modal-remove-btn"
              onClick={handleRemoveClick}
            >
              <Trash2 size={14} /> Remove from Library
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
