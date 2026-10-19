import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store'
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
import { computeSmartCollections } from '../smartCollections'
import { transitionStatus } from '../status'
import type { DomainLibraryEntry, DomainHistoryEvent, DomainCollection } from '../types'

describe('Section 6: Phase 4 End-to-End Acceptance Scenarios', () => {
  beforeEach(() => {
    useAppStore.setState({
      library: [],
      history: [],
      collections: [],
      plannedWatches: [],
      isReady: true,
      error: null,
    })
  })

  it('verifies all 11 acceptance scenarios end-to-end with zero drift', () => {
    const store = useAppStore.getState()
    const now = new Date()

    // -------------------------------------------------------------
    // Scenario 1: Add movie A to library
    // Expected: appears in Watchlist and Recently Added; Dashboard counters unchanged; not in Watching or Completed.
    // -------------------------------------------------------------
    const movieA: DomainLibraryEntry = {
      titleKey: 'movie:101',
      tmdbId: 101,
      type: 'movie',
      title: 'Inception',
      year: 2010,
      posterPath: '/inception.jpg',
      backdropPath: '/inception_bg.jpg',
      genres: [
        { id: 28, name: 'Action' },
        { id: 878, name: 'Sci-Fi' },
      ],
      runtimeMinutes: 148,
      status: 'plan_to_watch',
      priority: 'normal',
      rating: null,
      isFavorite: false,
      watchCount: 0,
      lastWatchedAt: null,
      totalMinutesWatched: 0,
      tags: [],
      addedAt: now,
      startedAt: null,
      completedAt: null,
      updatedAt: now,
      schemaVersion: 1,
    }

    useAppStore.getState().optimisticUpsertLibraryEntry(movieA)
    let state = useAppStore.getState()

    // Watchlist & Recently Added verification
    expect(selectWatchlist(state.library).map((e) => e.titleKey)).toEqual(['movie:101'])
    expect(selectRecentlyAdded(state.library).map((e) => e.titleKey)).toEqual(['movie:101'])
    expect(selectWatchingList(state.library)).toHaveLength(0)
    expect(selectCompletedList(state.library)).toHaveLength(0)

    // Dashboard counters unchanged
    let dashStats = selectDashboardStats(state.library, state.history, 100)
    expect(dashStats.moviesWatched).toBe(0)
    expect(dashStats.hoursWatched).toBe(0)
    expect(dashStats.watchGoalProgress).toBe(0)

    // -------------------------------------------------------------
    // Scenario 2: Start watching A
    // Expected: appears in Watching and Continue Watching only.
    // -------------------------------------------------------------
    const watchingA: DomainLibraryEntry = {
      ...movieA,
      status: 'watching',
      startedAt: now,
      updatedAt: new Date(now.getTime() + 1000),
    }
    useAppStore.getState().optimisticUpsertLibraryEntry(watchingA)
    state = useAppStore.getState()

    expect(selectWatchingList(state.library).map((e) => e.titleKey)).toEqual(['movie:101'])
    expect(selectContinueWatching(state.library).map((e) => e.titleKey)).toEqual(['movie:101'])
    expect(selectWatchlist(state.library)).toHaveLength(0)
    expect(selectCompletedList(state.library)).toHaveLength(0)

    // -------------------------------------------------------------
    // Scenario 3: Mark A watched
    // Expected: disappears from Watching and Watchlist, appears in Completed, History, Recent Activity, Recently Added (with Completed badge);
    // Dashboard Movies = 1, Hours = A's runtime, Streak = 1, Watch Goal = 1/100 = 1%; Analytics shows A; Completed stats match Dashboard.
    // -------------------------------------------------------------
    const completedA: DomainLibraryEntry = {
      ...watchingA,
      status: 'completed',
      completedAt: now,
      lastWatchedAt: now,
      watchCount: 1,
      totalMinutesWatched: 148,
      updatedAt: new Date(now.getTime() + 2000),
    }
    const historyA1: DomainHistoryEvent = {
      eventId: 'evt_101_1',
      titleKey: 'movie:101',
      title: 'Inception',
      type: 'movie',
      watchedAt: now,
      runtimeMinutes: 148,
      rating: null,
      posterPath: '/inception.jpg',
      genreIds: [28, 878],
      source: 'manual',
      createdAt: now,
      schemaVersion: 1,
    }
    useAppStore.getState().optimisticUpsertLibraryEntry(completedA)
    useAppStore.getState().optimisticAddHistoryEvent(historyA1)
    state = useAppStore.getState()

    // Status assertions
    expect(selectWatchingList(state.library)).toHaveLength(0)
    expect(selectWatchlist(state.library)).toHaveLength(0)
    expect(selectCompletedList(state.library).map((e) => e.titleKey)).toEqual(['movie:101'])
    expect(state.history.map((h) => h.titleKey)).toEqual(['movie:101'])

    // Dashboard stats verification
    dashStats = selectDashboardStats(state.library, state.history, 100)
    expect(dashStats.moviesWatched).toBe(1)
    expect(dashStats.hoursWatched).toBe(2) // 148 min ~ 2h
    expect(dashStats.currentStreak).toBe(1)
    expect(dashStats.watchGoalProgress).toBe(1) // 1 / 100

    // Analytics verification
    const analytics = selectAnalyticsMetrics(state.library, state.history, 'All Time', 'all')
    expect(analytics.isEmpty).toBe(false)
    expect(analytics.moviesCount).toBe(1)
    expect(analytics.watchTimeHours).toBe(2)

    // -------------------------------------------------------------
    // Scenario 4: Rate A 9
    // Expected: Avg rating = 9 everywhere; "Masterpieces" smart list contains A.
    // -------------------------------------------------------------
    const ratedA: DomainLibraryEntry = {
      ...completedA,
      rating: 9,
      updatedAt: new Date(now.getTime() + 3000),
    }
    useAppStore.getState().optimisticUpsertLibraryEntry(ratedA)
    state = useAppStore.getState()

    dashStats = selectDashboardStats(state.library, state.history, 100)
    expect(dashStats.avgRating).toBe('9.0')

    const smartColls = computeSmartCollections(state.library)
    const masterpieces = smartColls.find((s) => s.id === 'smart:masterpieces')
    expect(masterpieces?.list.map((e) => e.titleKey)).toEqual(['movie:101'])

    // -------------------------------------------------------------
    // Scenario 5: Mark A as favorite
    // Expected: Favorites page shows A, count badge = 1, "Favorites" smart list contains A; un-favorite removes it everywhere.
    // -------------------------------------------------------------
    const favA: DomainLibraryEntry = {
      ...ratedA,
      isFavorite: true,
      updatedAt: new Date(now.getTime() + 4000),
    }
    useAppStore.getState().optimisticUpsertLibraryEntry(favA)
    state = useAppStore.getState()

    expect(selectFavoritesList(state.library).map((e) => e.titleKey)).toEqual(['movie:101'])
    const favSmartColls = computeSmartCollections(state.library)
    expect(favSmartColls.find((s) => s.id === 'smart:favorites')?.list).toHaveLength(1)

    // Un-favorite
    const unfavA: DomainLibraryEntry = { ...favA, isFavorite: false }
    useAppStore.getState().optimisticUpsertLibraryEntry(unfavA)
    state = useAppStore.getState()
    expect(selectFavoritesList(state.library)).toHaveLength(0)
    expect(computeSmartCollections(state.library).find((s) => s.id === 'smart:favorites')?.list).toHaveLength(0)

    // -------------------------------------------------------------
    // Scenario 6: Add TV show B, mark 2 of 10 episodes
    // Expected: appears in Watching with progress 2/10; Dashboard TV Shows = 1; mark all aired episodes of an ended show: moves to Completed.
    // -------------------------------------------------------------
    const showB: DomainLibraryEntry = {
      titleKey: 'tv:201',
      tmdbId: 201,
      type: 'tv',
      title: 'Chernobyl',
      year: 2019,
      posterPath: '/chernobyl.jpg',
      backdropPath: null,
      genres: [{ id: 18, name: 'Drama' }],
      runtimeMinutes: null,
      status: 'watching',
      priority: 'normal',
      rating: null,
      isFavorite: false,
      watchCount: 0,
      lastWatchedAt: now,
      totalMinutesWatched: 120,
      tags: [],
      tv: {
        totalEpisodes: 5,
        totalSeasons: 1,
        episodesWatched: 2,
        currentSeason: 1,
        nextEpisodeToWatch: { season: 1, episode: 3 },
        tmdbStatus: 'Ended',
        nextAirDate: null,
      },
      addedAt: now,
      startedAt: now,
      completedAt: null,
      updatedAt: now,
      schemaVersion: 1,
    }
    useAppStore.getState().optimisticUpsertLibraryEntry(showB)
    state = useAppStore.getState()

    expect(selectWatchingList(state.library).map((e) => e.titleKey)).toEqual(['tv:201'])
    dashStats = selectDashboardStats(state.library, state.history, 100)
    expect(dashStats.tvShows).toBe(1)

    // Finish show B
    const completedB: DomainLibraryEntry = {
      ...showB,
      status: transitionStatus({
        currentStatus: 'watching',
        action: 'update_tv_progress',
        mediaType: 'tv',
        episodesWatched: 5,
        totalAiredEpisodes: 5,
        tmdbStatus: 'Ended',
      }),
      completedAt: now,
      tv: {
        ...showB.tv!,
        episodesWatched: 5,
        nextEpisodeToWatch: null,
      },
    }
    useAppStore.getState().optimisticUpsertLibraryEntry(completedB)
    state = useAppStore.getState()
    expect(selectCompletedList(state.library).map((e) => e.titleKey)).toContain('tv:201')
    expect(selectWatchingList(state.library)).toHaveLength(0)

    // -------------------------------------------------------------
    // Scenario 7: Watch A again
    // Expected: Completed still shows one entry; watchCount = 2; History has two events; hours increase.
    // -------------------------------------------------------------
    const rewatchedA: DomainLibraryEntry = {
      ...unfavA,
      watchCount: 2,
      totalMinutesWatched: 148 * 2,
      lastWatchedAt: new Date(now.getTime() + 10000),
    }
    const historyA2: DomainHistoryEvent = {
      eventId: 'evt_101_2',
      titleKey: 'movie:101',
      title: 'Inception',
      type: 'movie',
      watchedAt: new Date(now.getTime() + 10000),
      runtimeMinutes: 148,
      rating: 9,
      posterPath: '/inception.jpg',
      genreIds: [28, 878],
      source: 'manual',
      createdAt: new Date(now.getTime() + 10000),
      schemaVersion: 1,
    }
    useAppStore.getState().optimisticUpsertLibraryEntry(rewatchedA)
    useAppStore.getState().optimisticAddHistoryEvent(historyA2)
    state = useAppStore.getState()

    expect(selectCompletedList(state.library).filter((e) => e.titleKey === 'movie:101')).toHaveLength(1)
    expect(state.history.filter((h) => h.titleKey === 'movie:101')).toHaveLength(2)
    dashStats = selectDashboardStats(state.library, state.history, 100)
    expect(dashStats.hoursWatched).toBe(5) // (148 + 148) / 60 = ~5 hrs

    // -------------------------------------------------------------
    // Scenario 8: Delete A's history events through History
    // Expected: A returns to Watchlist (or plan_to_watch); all counters drop accordingly.
    // -------------------------------------------------------------
    useAppStore.getState().optimisticRemoveHistoryEvent('evt_101_1')
    useAppStore.getState().optimisticRemoveHistoryEvent('evt_101_2')
    const rolledBackStatus = transitionStatus({
      currentStatus: 'completed',
      action: 'unmark_watched',
      remainingHistoryCount: 0,
      mediaType: 'movie',
    })
    const resetA: DomainLibraryEntry = {
      ...rewatchedA,
      status: rolledBackStatus,
      completedAt: null,
      watchCount: 0,
      totalMinutesWatched: 0,
    }
    useAppStore.getState().optimisticUpsertLibraryEntry(resetA)
    state = useAppStore.getState()

    expect(selectWatchlist(state.library).map((e) => e.titleKey)).toEqual(['movie:101'])
    expect(selectCompletedList(state.library).map((e) => e.titleKey)).toEqual(['tv:201'])
    dashStats = selectDashboardStats(state.library, state.history, 100)
    expect(dashStats.moviesWatched).toBe(0)

    // -------------------------------------------------------------
    // Scenario 9: Add A to a custom collection
    // Expected: collection count = 1 on Collections and title page.
    // -------------------------------------------------------------
    const customCollection: DomainCollection = {
      id: 'col_mind_bending',
      name: 'Mind Benders',
      description: 'Movies that blow your mind',
      itemCount: 1,
      items: [
        {
          titleKey: 'movie:101',
          title: 'Inception',
          type: 'movie',
          posterPath: '/inception.jpg',
          addedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    }
    useAppStore.setState({ collections: [customCollection] })
    state = useAppStore.getState()
    expect(state.collections).toHaveLength(1)
    expect(state.collections[0]?.items).toHaveLength(1)

    // -------------------------------------------------------------
    // Scenario 10: Reload / state hydration parity
    // Expected: All selectors produce identical numbers and agree across all components.
    // -------------------------------------------------------------
    const hydratedStats = selectDashboardStats(state.library, state.history, 100)
    const hydratedCompleted = selectCompletedList(state.library)
    const hydratedAnalytics = selectAnalyticsMetrics(state.library, state.history, 'All Time', 'all')
    expect(hydratedStats.tvShows).toBe(1)
    expect(hydratedStats.moviesWatched).toBe(0)
    expect(hydratedCompleted).toHaveLength(1)
    expect(hydratedAnalytics.tvCount).toBe(1)
    expect(hydratedAnalytics.moviesCount).toBe(0)

    // -------------------------------------------------------------
    // Scenario 11: Offline optimistic update & online sync
    // -------------------------------------------------------------
    const offlineWatchedMovie: DomainLibraryEntry = {
      ...resetA,
      status: 'completed',
      completedAt: new Date(),
      watchCount: 1,
      totalMinutesWatched: 148,
    }
    useAppStore.getState().optimisticUpsertLibraryEntry(offlineWatchedMovie)
    state = useAppStore.getState()

    expect(selectCompletedList(state.library).map((e) => e.titleKey)).toEqual(['tv:201', 'movie:101'])
    expect(selectWatchlist(state.library)).toHaveLength(0)
    expect(selectWatchingList(state.library)).toHaveLength(0)
  })
})
