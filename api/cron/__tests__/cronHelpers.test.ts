import { describe, it, expect } from 'vitest'
import {
  isUserDigestTime,
  isAlreadySentToday,
  rankCandidates,
  type CandidateTitle,
} from '../cronHelpers'

describe('cronHelpers', () => {
  describe('isUserDigestTime', () => {
    it('returns true when current hour in user timezone matches digest hour', () => {
      // 2026-10-15T18:00:00Z is 14:00 (2 PM) in America/New_York (EDT, UTC-4)
      const fixedDate = new Date('2026-10-15T18:00:00Z')
      expect(isUserDigestTime('America/New_York', 14, fixedDate)).toBe(true)
      expect(isUserDigestTime('America/New_York', 18, fixedDate)).toBe(false)
    })

    it('returns true for matching hour in Asia/Tokyo', () => {
      // 2026-10-15T09:00:00Z is 18:00 (6 PM) in Asia/Tokyo (UTC+9)
      const fixedDate = new Date('2026-10-15T09:00:00Z')
      expect(isUserDigestTime('Asia/Tokyo', 18, fixedDate)).toBe(true)
      expect(isUserDigestTime('Asia/Tokyo', 9, fixedDate)).toBe(false)
    })

    it('falls back to UTC when timezone string is invalid', () => {
      const fixedDate = new Date('2026-10-15T18:00:00Z')
      expect(isUserDigestTime('Invalid/Timezone_Name', 18, fixedDate)).toBe(true)
      expect(isUserDigestTime('Invalid/Timezone_Name', 12, fixedDate)).toBe(false)
    })
  })

  describe('isAlreadySentToday', () => {
    it('returns true when lastSentAt equals current date in user timezone', () => {
      const fixedDate = new Date('2026-10-15T18:00:00Z')
      expect(isAlreadySentToday('2026-10-15', 'America/New_York', fixedDate)).toBe(true)
      expect(isAlreadySentToday('2026-10-14', 'America/New_York', fixedDate)).toBe(false)
    })

    it('returns false when lastSentAt is null', () => {
      const fixedDate = new Date('2026-10-15T18:00:00Z')
      expect(isAlreadySentToday(null, 'America/New_York', fixedDate)).toBe(false)
    })
  })

  describe('rankCandidates', () => {
    const sampleCandidates: CandidateTitle[] = [
      {
        titleKey: 'movie:101',
        title: 'Action Master',
        type: 'movie',
        voteAverage: 7.5,
        voteCount: 500,
        popularity: 80,
        genreIds: [28, 12], // Action, Adventure
      },
      {
        titleKey: 'movie:102',
        title: 'Romantic Drama',
        type: 'movie',
        voteAverage: 8.0,
        voteCount: 300,
        popularity: 40,
        genreIds: [10749, 18], // Romance, Drama
      },
      {
        titleKey: 'tv:201',
        title: 'Airing Sci-Fi Show',
        type: 'tv',
        voteAverage: 8.5,
        voteCount: 1200,
        popularity: 150,
        genreIds: [878], // Sci-Fi
        airingEpisode: 'S2 E4',
      },
      {
        titleKey: 'movie:103',
        title: 'Old Movie to Exclude',
        type: 'movie',
        voteAverage: 9.0,
        voteCount: 1000,
        popularity: 200,
        genreIds: [28],
      },
    ]

    it('excludes titles in excludedKeys set', () => {
      const excluded = new Set(['movie:103'])
      const ranked = rankCandidates(sampleCandidates, [28], excluded)
      expect(ranked.some((r) => r.titleKey === 'movie:103')).toBe(false)
    })

    it('prioritizes airing episodes first', () => {
      const ranked = rankCandidates(sampleCandidates, [28], new Set())
      expect(ranked[0]?.titleKey).toBe('tv:201')
      expect(ranked[0]?.airingEpisode).toBe('S2 E4')
    })

    it('scores higher for matching user genres', () => {
      // User loves Action (28) and Adventure (12)
      const ranked = rankCandidates(sampleCandidates, [28, 12], new Set(['tv:201', 'movie:103']))
      expect(ranked[0]?.titleKey).toBe('movie:101')
      expect(ranked[0]?.matchedGenreCount).toBe(2)
    })

    it('respects maxCount limit', () => {
      const ranked = rankCandidates(sampleCandidates, [28], new Set(), 2)
      expect(ranked).toHaveLength(2)
    })
  })
})
