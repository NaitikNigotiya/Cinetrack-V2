import React, { useState } from 'react'
import clsx from 'clsx'
import {
  type RatingScale,
  toDisplay,
  fromDisplay,
  formatRating,
  normalizeCanonicalRating,
} from '@/shared/lib/rating'
import styles from './RatingControl.module.css'

export interface RatingControlProps {
  value: number | null // Canonical 0.5..10
  onChange?: (val: number | null) => void
  scale?: RatingScale
  readOnly?: boolean
  showLabel?: boolean
  showClear?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RatingControl({
  value,
  onChange,
  scale = 'ten',
  readOnly = false,
  showLabel = true,
  showClear = true,
  className,
}: RatingControlProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const displayVal = toDisplay(value, scale)
  const effectiveDisplay = hoverValue !== null ? hoverValue : displayVal
  const maxStars = 5
  const step = scale === 'five' ? 1 : 0.5

  const handleStarClick = (starIndex: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (readOnly || !onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const isHalf = scale !== 'five' && clickX < rect.width / 2

    const starValue = isHalf ? starIndex + 0.5 : starIndex + 1
    const canonical = fromDisplay(starValue, scale)
    onChange(canonical)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) return
    const current = displayVal ?? 0
    let next = current

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      next = Math.min(5, current + step)
      onChange(fromDisplay(next, scale))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      next = Math.max(step, current - step)
      onChange(fromDisplay(next, scale))
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onChange(null)
    }
  }

  return (
    <div
      className={clsx(styles.container, className)}
      role="slider"
      tabIndex={readOnly ? -1 : 0}
      aria-label="Rating"
      aria-valuemin={0.5}
      aria-valuemax={10}
      aria-valuenow={normalizeCanonicalRating(value) ?? 0}
      aria-valuetext={formatRating(value, scale)}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHoverValue(null)}
    >
      <div className={styles.starsRow}>
        {Array.from({ length: maxStars }).map((_, index) => {
          const starVal = index + 1
          const isFilled = (effectiveDisplay ?? 0) >= starVal
          const isHalf = (effectiveDisplay ?? 0) >= starVal - 0.5 && !isFilled

          return (
            <button
              key={index}
              type="button"
              disabled={readOnly}
              className={clsx(
                styles.starBtn,
                isFilled && styles.starFilled,
                isHalf && styles.starHalfFilled
              )}
              aria-label={`Rate ${starVal} out of 5 stars`}
              onClick={(e) => handleStarClick(index, e)}
              onMouseMove={(e) => {
                if (readOnly) return
                const rect = e.currentTarget.getBoundingClientRect()
                const isHoverHalf = scale !== 'five' && (e.clientX - rect.left) < rect.width / 2
                setHoverValue(isHoverHalf ? index + 0.5 : starVal)
              }}
            >
              {/* Background empty star */}
              <svg
                className={styles.starSvg}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              {/* Half-star overlay */}
              {isHalf && (
                <div className={styles.halfStarOverlay} aria-hidden="true">
                  <svg className={styles.starSvg} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {showLabel && (
        <span className={styles.label}>{formatRating(value, scale)}</span>
      )}

      {showClear && !readOnly && value !== null && onChange && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => onChange(null)}
          aria-label="Clear rating"
        >
          Clear
        </button>
      )}
    </div>
  )
}
