import { describe, it, expect } from 'vitest'
import {
  LibraryEntrySchema,
  ReviewSchema,
  CollectionSchema,
  PlannedWatchSchema,
  UserPreferencesSchema,
  StatsSummarySchema,
} from '../index'

describe('Zod Firestore Schemas', () => {
  it('validates correct library entries', () => {
    const valid = {
      titleKey: 'movie:550',
      tmdbId: 550,
      type: 'movie',
      title: 'Fight Club',
      genres: [{ id: 18, name: 'Drama' }],
      status: 'watching',
      rating: 9.5,
      isFavorite: true,
      addedAt: new Date(),
      updatedAt: new Date(),
      tags: ['favorite', 'cult'],
    }
    const result = LibraryEntrySchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects invalid title keys and ratings in library entries', () => {
    const badKey = {
      titleKey: 'book:123',
      tmdbId: 123,
      type: 'movie',
      title: 'Invalid',
      addedAt: new Date(),
      updatedAt: new Date(),
    }
    expect(LibraryEntrySchema.safeParse(badKey).success).toBe(false)

    const badRating = {
      titleKey: 'movie:100',
      tmdbId: 100,
      type: 'movie',
      title: 'Invalid',
      rating: 11, // > 10
      addedAt: new Date(),
      updatedAt: new Date(),
    }
    expect(LibraryEntrySchema.safeParse(badRating).success).toBe(false)
  })

  it('enforces character limits on reviews and collections', () => {
    const hugeBody = 'a'.repeat(5001)
    const reviewResult = ReviewSchema.safeParse({
      titleKey: 'movie:550',
      title: 'Fight Club',
      body: hugeBody,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(reviewResult.success).toBe(false)

    const longName = 'x'.repeat(81)
    const collectionResult = CollectionSchema.safeParse({
      name: longName,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(collectionResult.success).toBe(false)
  })

  it('validates planned watches with ISO dates', () => {
    const validPlan = {
      titleKey: 'tv:1396',
      title: 'Breaking Bad',
      type: 'tv',
      plannedFor: '2026-10-31',
      plannedTime: '20:00',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(PlannedWatchSchema.safeParse(validPlan).success).toBe(true)

    const badDate = {
      ...validPlan,
      plannedFor: '31-10-2026', // wrong format
    }
    expect(PlannedWatchSchema.safeParse(badDate).success).toBe(false)
  })

  it('defaults preferences correctly', () => {
    const parsed = UserPreferencesSchema.parse({ updatedAt: new Date() })
    expect(parsed.theme).toBe('dark')
    expect(parsed.ratingScale).toBe('ten')
    expect(parsed.defaultStatus).toBe('plan_to_watch')
  })

  it('initializes stats summary with zero defaults', () => {
    const parsed = StatsSummarySchema.parse({ updatedAt: new Date() })
    expect(parsed.moviesWatched).toBe(0)
    expect(parsed.episodesWatched).toBe(0)
    expect(parsed.currentStreak).toBe(0)
  })
})
