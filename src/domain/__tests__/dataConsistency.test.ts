import { describe, it, expect } from 'vitest'
import {
  selectWatchingList,
  selectCompletedList,
  selectFavoritesList,
  selectDashboardStats,
  selectAnalyticsMetrics,
} from '../selectors'
import { computeSmartCollections } from '../smartCollections'
import { transitionStatus } from '../status'
import type { LibraryEntry, HistoryEvent } from '@/shared/schemas'

describe('Data Consistency - Phase 1 Failing Verification Tests', () => {
  const sampleMovie: LibraryEntry = {
    titleKey: 'movie:11423',
    tmdbId: 11423,
    type: 'movie',
    title: 'Memories of Murder',
    year: 2003,
    posterPath: '/jcgUjx1QcupGzjntTVlnQ15lHqy.jpg',
    backdropPath: '/6Kn6qW3an3DkPl3MahWemTzrjCt.jpg',
    genres: [
      { id: 80, name: 'Crime' },
      { id: 18, name: 'Drama' },
      { id: 53, name: 'Thriller' },
    ],
    runtimeMinutes: 132,
    status: 'completed',
    priority: 'normal',
    rating: 9,
    isFavorite: true,
    watchCount: 1,
    lastWatchedAt: new Date(),
    totalMinutesWatched: 132,
    tags: [],
    addedAt: new Date(),
    startedAt: null,
    completedAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
  }

  const sampleHistoryEvent: HistoryEvent = {
    eventId: 'movie:11423_1792408660450',
    titleKey: 'movie:11423',
    title: 'Memories of Murder',
    type: 'movie',
    runtimeMinutes: 132,
    rating: 9,
    posterPath: '/jcgUjx1QcupGzjntTVlnQ15lHqy.jpg',
    genreIds: [80, 18, 53],
    source: 'manual',
    watchedAt: new Date(),
    createdAt: new Date(),
    schemaVersion: 1,
  }

  it('Symptom 1: A completed movie must NEVER appear in the watching list', () => {
    const library = [sampleMovie]
    const watching = selectWatchingList(library)
    const completed = selectCompletedList(library)

    expect(watching).toHaveLength(0)
    expect(completed).toHaveLength(1)
    expect(completed[0]?.titleKey).toBe('movie:11423')
  })

  it('Symptom 2: Dashboard metrics must match library and history, not display 0s', () => {
    const library = [sampleMovie]
    const history = [sampleHistoryEvent]

    const stats = selectDashboardStats(library, history, 100)
    expect(stats.moviesWatched).toBe(1)
    expect(stats.tvShows).toBe(0)
    expect(stats.hoursWatched).toBe(2) // 132 mins = ~2 hrs
    expect(stats.currentStreak).toBe(1)
    expect(stats.avgRating).toBe('9.0')
    expect(stats.watchGoalProgress).toBe(1) // 1/100
  })

  it('Symptom 3: Analytics metrics must reflect the completed title and hours', () => {
    const library = [sampleMovie]
    const history = [sampleHistoryEvent]

    const analytics = selectAnalyticsMetrics(library, history, 'All Time', 'all')
    expect(analytics.moviesCount).toBe(1)
    expect(analytics.watchTimeHours).toBe(2)
    expect(analytics.avgRating).toBe(9)
    expect(analytics.isEmpty).toBe(false)
  })

  it('Symptom 4: Built-in Smart Collections and Favorites must contain the title', () => {
    const library = [sampleMovie]
    const favorites = selectFavoritesList(library)
    expect(favorites).toHaveLength(1)
    expect(favorites[0]?.titleKey).toBe('movie:11423')

    const smartLists = computeSmartCollections(library)
    const masterpieces = smartLists.find((s) => s.id === 'smart:masterpieces')
    const favSmart = smartLists.find((s) => s.id === 'smart:favorites')

    expect(masterpieces?.list).toHaveLength(1)
    expect(favSmart?.list).toHaveLength(1)
  })

  it('Symptom 5: Deleting history event transitions status back to plan_to_watch when watch history is empty', () => {
    const transitioned = transitionStatus({
      currentStatus: 'completed',
      action: 'unmark_watched',
      remainingHistoryCount: 0,
      mediaType: 'movie',
    })

    expect(transitioned).toBe('plan_to_watch')
  })
})
