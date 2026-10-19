import { describe, it, expect } from 'vitest'
import {
  selectWatchingList,
  selectWatchlist,
  selectCompletedList,
  selectFavoritesList,
  selectRecentlyAdded,
  selectContinueWatching,
  selectDashboardStats,
  selectAnalyticsMetrics,
} from '../selectors'
import type { LibraryEntry, HistoryEvent } from '../types'

describe('Domain Selectors (Section 4.3)', () => {
  const baseEntry = (id: string, overrides: Partial<LibraryEntry> = {}): LibraryEntry => ({
    titleKey: `movie:${id}`,
    tmdbId: Number(id),
    type: 'movie',
    title: `Movie ${id}`,
    year: 2024,
    posterPath: `/poster${id}.jpg`,
    backdropPath: `/backdrop${id}.jpg`,
    genres: [{ id: 28, name: 'Action' }],
    runtimeMinutes: 120,
    status: 'plan_to_watch',
    priority: 'normal',
    rating: null,
    isFavorite: false,
    watchCount: 0,
    lastWatchedAt: null,
    totalMinutesWatched: 0,
    tags: [],
    addedAt: '2026-01-01T00:00:00Z',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-01-01T00:00:00Z',
    schemaVersion: 1,
    ...overrides,
  })

  const baseHistoryEvent = (id: string, overrides: Partial<HistoryEvent> = {}): HistoryEvent => ({
    eventId: `evt_${id}`,
    titleKey: `movie:${id}`,
    title: `Movie ${id}`,
    type: 'movie',
    watchedAt: new Date('2026-10-19T10:00:00Z'),
    runtimeMinutes: 120,
    rating: 8,
    posterPath: null,
    genreIds: [28],
    source: 'manual',
    createdAt: new Date('2026-10-19T10:00:00Z'),
    schemaVersion: 1,
    ...overrides,
  })

  describe('List Selectors', () => {
    const library: LibraryEntry[] = [
      baseEntry('1', { status: 'plan_to_watch', isFavorite: true, title: 'B Title', rating: 7 }),
      baseEntry('2', { status: 'watching', isFavorite: false, title: 'A Title', rating: 9 }),
      baseEntry('3', { status: 'completed', isFavorite: true, title: 'C Title', rating: 8 }),
      baseEntry('4', { status: 'on_hold', isFavorite: false }),
      baseEntry('5', { status: 'dropped', isFavorite: false }),
    ]

    it('selectWatchingList returns only watching status', () => {
      const list = selectWatchingList(library)
      expect(list.map((e) => e.titleKey)).toEqual(['movie:2'])
    })

    it('selectWatchlist returns only plan_to_watch status', () => {
      const list = selectWatchlist(library)
      expect(list.map((e) => e.titleKey)).toEqual(['movie:1'])
    })

    it('selectCompletedList returns only completed status', () => {
      const list = selectCompletedList(library)
      expect(list.map((e) => e.titleKey)).toEqual(['movie:3'])
    })

    it('selectFavoritesList returns isFavorite === true titles across any status', () => {
      const list = selectFavoritesList(library)
      expect(list.map((e) => e.titleKey)).toEqual(expect.arrayContaining(['movie:1', 'movie:3']))
      expect(list.length).toBe(2)
    })

    it('selectFavoritesList sorts correctly by rating, title, and year', () => {
      const byRating = selectFavoritesList(library, 'rating')
      expect(byRating[0]!.rating).toBe(8)
      expect(byRating[1]!.rating).toBe(7)

      const byTitle = selectFavoritesList(library, 'title')
      expect(byTitle[0]!.title).toBe('B Title')
      expect(byTitle[1]!.title).toBe('C Title')
    })

    it('selectRecentlyAdded returns newest addedAt first up to limit n', () => {
      const items: LibraryEntry[] = [
        baseEntry('old', { addedAt: '2026-01-01T00:00:00Z' }),
        baseEntry('new', { addedAt: '2026-10-01T00:00:00Z' }),
      ]
      const recent = selectRecentlyAdded(items, 1)
      expect(recent.length).toBe(1)
      expect(recent[0]!.titleKey).toBe('movie:new')
    })

    it('selectContinueWatching returns watching items sorted by activity', () => {
      const continueList = selectContinueWatching(library)
      expect(continueList.length).toBe(1)
      expect(continueList[0]!.titleKey).toBe('movie:2')
    })
  })

  describe('selectDashboardStats', () => {
    it('computes stats with empty history and fallback to library minutes', () => {
      const library: LibraryEntry[] = [
        baseEntry('1', { status: 'completed', totalMinutesWatched: 120, rating: 8 }),
      ]
      const stats = selectDashboardStats(library, [])
      expect(stats.moviesWatched).toBe(1)
      expect(stats.hoursWatched).toBe(2)
      expect(stats.avgRating).toBe('8.0')
      expect(stats.currentStreak).toBe(0)
    })

    it('computes stats with history events and computes streaks', () => {
      const today = new Date()
      const yesterday = new Date(Date.now() - 86400000)

      const library: LibraryEntry[] = [
        baseEntry('1', { status: 'completed', rating: 10 }),
        baseEntry('2', {
          type: 'tv',
          status: 'watching',
          tv: {
            totalEpisodes: 10,
            totalSeasons: 1,
            episodesWatched: 3,
            currentSeason: 1,
            nextEpisodeToWatch: null,
            tmdbStatus: 'Ended',
            nextAirDate: null,
          },
          rating: 6,
        }),
      ]
      const history: HistoryEvent[] = [
        baseHistoryEvent('1', { watchedAt: today, runtimeMinutes: 120 }),
        baseHistoryEvent('2', { watchedAt: yesterday, runtimeMinutes: 60 }),
      ]

      const stats = selectDashboardStats(library, history, 100)
      expect(stats.moviesWatched).toBe(1)
      expect(stats.tvShows).toBe(1)
      expect(stats.hoursWatched).toBe(3) // (120 + 60) / 60
      expect(stats.avgRating).toBe('8.0') // (10 + 6) / 2
      expect(stats.currentStreak).toBeGreaterThanOrEqual(2)
      expect(stats.watchGoalProgress).toBe(1) // 1 / 100
    })

    it('returns "—" for avgRating when there are no rated titles', () => {
      const library: LibraryEntry[] = [baseEntry('1', { rating: null })]
      const stats = selectDashboardStats(library, [])
      expect(stats.avgRating).toBe('—')
    })
  })

  describe('selectAnalyticsMetrics', () => {
    it('marks isEmpty as true only when completed and history are both empty', () => {
      const emptyMetrics = selectAnalyticsMetrics([], [])
      expect(emptyMetrics.isEmpty).toBe(true)

      const withCompleted = selectAnalyticsMetrics([baseEntry('1', { status: 'completed' })], [])
      expect(withCompleted.isEmpty).toBe(false)

      const withHistory = selectAnalyticsMetrics([], [baseHistoryEvent('1')])
      expect(withHistory.isEmpty).toBe(false)
    })

    it('generates correct distribution and monthly metrics', () => {
      const library: LibraryEntry[] = [
        baseEntry('1', {
          status: 'completed',
          type: 'movie',
          rating: 9,
          runtimeMinutes: 130,
          genres: [{ id: 28, name: 'Action' }],
          completedAt: new Date('2026-05-15T12:00:00Z'),
        }),
        baseEntry('2', {
          status: 'completed',
          type: 'tv',
          rating: 8,
          runtimeMinutes: 45,
          genres: [{ id: 18, name: 'Drama' }],
          completedAt: new Date('2026-05-20T12:00:00Z'),
        }),
      ]

      const metrics = selectAnalyticsMetrics(library, [], 'All Time', 'all')
      expect(metrics.moviesCount).toBe(1)
      expect(metrics.tvCount).toBe(1)
      expect(['50% Action', '50% Drama']).toContain(metrics.dominantGenreLabel)
      expect(metrics.ratingsDistributionData.find((b) => b.star === 9)?.count).toBe(1)
    })
  })
})
