export type RatingScale = 'ten' | 'five' | 'fivehalf'

/**
 * Validates and snaps a raw rating to the canonical 0.5..10 (step 0.5) scale.
 */
export function normalizeCanonicalRating(value: number | null): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null
  }
  const clamped = Math.max(0.5, Math.min(10, value))
  return Math.round(clamped * 2) / 2
}

/**
 * Converts a canonical rating (0.5..10) into the user's active display scale.
 */
export function toDisplay(value: number | null, scale: RatingScale): number | null {
  const norm = normalizeCanonicalRating(value)
  if (norm === null) return null

  if (scale === 'ten') {
    return norm
  }

  // 5-point scale (with or without half-stars)
  const fivePoint = norm / 2
  return scale === 'five' ? Math.round(fivePoint) : Math.round(fivePoint * 2) / 2
}

/**
 * Converts a rating from the user's active display scale back to canonical 0.5..10.
 */
export function fromDisplay(displayValue: number | null, scale: RatingScale): number | null {
  if (displayValue === null || displayValue === undefined || Number.isNaN(displayValue)) {
    return null
  }

  if (scale === 'ten') {
    return normalizeCanonicalRating(displayValue)
  }

  // 5-point scale input converted to 10-point canonical
  return normalizeCanonicalRating(displayValue * 2)
}

/**
 * Formats a rating for display, e.g. "8.5 / 10" or "4.5 / 5".
 */
export function formatRating(value: number | null, scale: RatingScale): string {
  const display = toDisplay(value, scale)
  if (display === null) return 'Not rated'

  const max = scale === 'ten' ? 10 : 5
  return `${display} / ${max}`
}

/**
 * Maps a canonical rating to a distribution bucket for analytics.
 */
export function ratingToBucket(value: number | null): string {
  const norm = normalizeCanonicalRating(value)
  if (norm === null) return 'Unrated'

  const floor = Math.floor(norm)
  return `${floor} - ${floor + 1}`
}
