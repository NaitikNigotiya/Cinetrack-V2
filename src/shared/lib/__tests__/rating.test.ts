import { describe, it, expect } from 'vitest'
import {
  normalizeCanonicalRating,
  toDisplay,
  fromDisplay,
  formatRating,
  ratingToBucket,
} from '../rating'

describe('rating module', () => {
  it('normalizes ratings within 0.5 to 10 range with 0.5 step', () => {
    expect(normalizeCanonicalRating(null)).toBeNull()
    expect(normalizeCanonicalRating(8.3)).toBe(8.5)
    expect(normalizeCanonicalRating(8.2)).toBe(8.0)
    expect(normalizeCanonicalRating(11)).toBe(10)
    expect(normalizeCanonicalRating(0.1)).toBe(0.5)
  })

  it('converts to display scale correctly', () => {
    // 10-point scale
    expect(toDisplay(8.5, 'ten')).toBe(8.5)
    expect(toDisplay(10, 'ten')).toBe(10)

    // 5-point scale (integer)
    expect(toDisplay(8, 'five')).toBe(4)
    expect(toDisplay(9, 'five')).toBe(5)

    // 5-point half-star scale
    expect(toDisplay(7, 'fivehalf')).toBe(3.5)
    expect(toDisplay(9, 'fivehalf')).toBe(4.5)
  })

  it('converts from display scale back to canonical 0.5..10', () => {
    expect(fromDisplay(8.5, 'ten')).toBe(8.5)
    expect(fromDisplay(4, 'five')).toBe(8)
    expect(fromDisplay(4.5, 'fivehalf')).toBe(9)
  })

  it('round-trips correctly across scales within their respective precision', () => {
    // 10-point scale supports 0.5 steps
    const tenValues = [0.5, 1.0, 1.5, 2.0, 2.5, 5.0, 7.5, 9.0, 10.0]
    for (const val of tenValues) {
      const display = toDisplay(val, 'ten')
      expect(fromDisplay(display, 'ten')).toBe(val)
    }

    // 5-star half scale supports integer canonicals (1 to 5 stars in 0.5 star steps)
    const fiveHalfValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    for (const val of fiveHalfValues) {
      const display = toDisplay(val, 'fivehalf')
      expect(fromDisplay(display, 'fivehalf')).toBe(val)
    }

    // 5-star integer scale supports even canonicals (1 to 5 full stars)
    const fiveValues = [2, 4, 6, 8, 10]
    for (const val of fiveValues) {
      const display = toDisplay(val, 'five')
      expect(fromDisplay(display, 'five')).toBe(val)
    }
  })

  it('formats rating string for UI', () => {
    expect(formatRating(null, 'ten')).toBe('Not rated')
    expect(formatRating(8.5, 'ten')).toBe('8.5 / 10')
    expect(formatRating(9, 'fivehalf')).toBe('4.5 / 5')
    expect(formatRating(8, 'five')).toBe('4 / 5')
  })

  it('maps ratings to distribution buckets', () => {
    expect(ratingToBucket(null)).toBe('Unrated')
    expect(ratingToBucket(8.5)).toBe('8 - 9')
    expect(ratingToBucket(10)).toBe('10 - 11')
  })
})
