# CineTrack v2: Data Consistency Bug Report & Diagnosis

**Date:** 2026-10-19  
**Target:** Title status synchronization, Dashboard metrics, Analytics charts, Favorites, Collections  
**Document State:** Phase 1 Diagnosis (No behavior changes yet)

## One-Sentence Root Cause per Symptom

- **Symptom 1:** Missing Firestore composite index `(status, updatedAt)` caused `useLibrary` to fall back to an un-filtered `limit(40)` query that returned completed movies on the Watching page.
- **Symptom 2:** Dashboard counters read from stale, un-updated `stats/summary` documents while Recent Activity read directly from live history events.
- **Symptom 3:** Analytics derived metrics from an isolated, stale per-page query cache while completed documents lacked populated `runtimeMinutes` and `completedAt` timestamps.
- **Symptom 4:** Built-in smart collections were replaced with dummy director lists that hid when empty, and Favorites queries failed index constraints while lacking interactive card toggles.
- **Symptom 5:** Splitting state across `stats/*`, un-synced per-page queries, and live history without unified domain selectors and atomic writes caused platform-wide drift.

---

## 1. Symptoms Investigation & Root Cause Analysis

### Symptom 1: A marked watched movie still appears on Watching page while also appearing on Completed
- **Rendering Component & Hook:**
  - `src/features/library/components/WatchingPage.tsx` renders the Watching list.
  - It invokes `useLibrary('watching')` (`src/features/library/hooks/useLibrary.ts`).
- **Data Source & Firestore Query:**
  - `useLibrary` executes `query(colRef, where('status', '==', 'watching'), orderBy('updatedAt', 'desc'), limit(40))`.
  - In Firestore, querying `where('status', '==', ...)` with `orderBy('updatedAt', ...)` requires a composite index: `(status ASC, updatedAt DESC)`.
  - When this index is absent or building, Firestore throws: `The query requires an index: ...`.
  - `useLibrary.ts` (lines 79–85) catches this error and falls back to:
    ```ts
    const fallbackQ = query(colRef, limit(40))
    const snap = await getDocs(fallbackQ)
    return snap.docs.map((d) => d.data())
    ```
    This fallback returns library documents **without any status filter**!
  - `WatchingPage.tsx` only filters by media type (`e.type === 'movie'`), trusting the query. Thus, a title marked `status: 'completed'` is returned by the fallback query and rendered on the Watching page.
  - Additionally, `WatchingPage` and `TitleDetailPage` communicate through decoupled, one-off TanStack Query caches (`['library', uid, filters]`) rather than a single unified real-time store.

### Symptom 2: Dashboard counters show 0s, "Nothing in progress" and "No titles added to your library yet", while Recent Activity shows "You watched Memories of Murder 5m ago"
- **Rendering Component & Hook:**
  - `src/features/home/components/HomePage.tsx` and `src/features/home/components/DashboardRails.tsx`.
  - `src/features/home/hooks/useDashboardData.ts`.
- **Data Source & Firestore Query:**
  - `Recent Activity` listens directly to `users/{uid}/history` via a real-time `onSnapshot` subscription (`useDashboardData.ts:76-84`). When a watch event is logged, `historyList` updates immediately and renders "You watched Memories of Murder 5m ago".
  - In contrast, the stat tiles read from `users/{uid}/stats/summary` (`useQuery(['stats', 'summary', uid])`). In `stats/summary`, `minutesWatched` is 0, `currentStreak` is 0, and `statusCounts` is an un-aggregated or empty map.
  - Furthermore, `entries` is passed into `useDashboardData` from `HomePage.tsx` via a one-off `useLibrary('all')` query with `staleTime: 5 * 60 * 1000`. If this query fails or runs before updates, `entries` is empty (`[]`).
  - Because `entries` is empty:
    - `recentlyAdded.length === 0` renders `<div className="hp-rail-empty">No titles added to your library yet.</div>`.
    - `completedMoviesCount` is `0`.
    - `avgRating` is `'—'`.
    - `activeWatching` is `null`, triggering "Nothing in progress".

### Symptom 3: Analytics says "No completed titles yet" and "0 watched" even though Completed shows 1 title
- **Rendering Component & Hook:**
  - `src/features/analytics/components/AnalyticsPage.tsx` and `src/features/analytics/components/analyticsData.ts`.
- **Data Source & Firestore Query:**
  - `AnalyticsPage` calls `useLibrary('all')`.
  - Because each page maintains its own independent TanStack query cache key (`['library', uid, { tab: 'all', ... }]`), mutations made from the title detail page or completed page do not invalidate this separate cache.
  - If `entries` contains an entry where `completedAt` is missing or where `runtimeMinutes` is null (as observed on the actual test document `movie:11423`), date parsing in `getWatchDate(e)` defaults to `new Date()`, causing year filtering (`getWatchDate(e).getFullYear() === yearInt`) or calculation to disagree with Completed page.
  - When `filteredCompletions.length === 0`, `AnalyticsPage` displays `<EmptyStateCard title="No completed titles yet" />`.

### Symptom 4: Collections Smart Collections count 0 & Favorites does not show favorited titles
- **Rendering Component & Hook:**
  - `src/features/collections/components/CollectionsPage.tsx` and `src/features/collections/components/smartCollections.ts`.
  - `src/features/library/components/FavoritesPage.tsx`.
- **Data Source & Firestore Query:**
  - **Smart Collections:** `src/features/collections/components/smartCollections.ts` hardcoded dummy movie director collections (`Christopher Nolan`, `Marvel Cinematic Universe`, `Studio Ghibli`) and filtered out any collection with `c.list.length === 0`. None of the required smart collections (Favorites, Highly Rated >= 8, Masterpieces >= 9, Recently Completed, Currently Watching, Unrated Completed, Short Watches <= 100m, Binge-worthy Shows >= 3 seasons, Top-3 library genres) were implemented.
  - **Favorites:** `FavoritesPage.tsx` calls `useLibrary('favorites')`, which queries `where('isFavorite', '==', true)` with `orderBy('updatedAt', 'desc')`. In Firestore, this query throws missing composite index error and falls back to un-filtered `limit(40)`. Furthermore, toggling favorite on Title Detail page does not invalidate `['library', uid, { tab: 'favorites' }]`. Also, `PosterCard` lacked an interactive heart toggle button.

### Symptom 5: Platform feels unreliable and pages disagree with each other
- **Root Cause Summary:**
  1. **Dual Source of Truth:** Stats and metrics are split across `stats/summary` (stale, un-updated counter documents), `users/{uid}/history` (real-time stream), and `users/{uid}/library` (static queries).
  2. **No Realtime Library Subscription:** Pages make independent one-off Firestore reads with distinct query filters (`['library', uid, tab]`). A change on one page never updates the TanStack Query cache of another page.
  3. **Fallbacks Masking Query Failures:** When Firestore queries require composite indexes (`status + updatedAt`, `isFavorite + updatedAt`), `useLibrary` catches the error and queries `limit(40)` without filters, contaminating status-specific views with completed or un-favorited items.
  4. **Non-Atomic Actions:** Deleting a history event (`deleteHistoryEventWithUndo`) leaves the library document in `completed` status with unadjusted `watchCount`.

---

## 2. Test Title Document Verification (`movie:11423` - Memories of Murder)

Inspected live in Firestore:
- **`users/79VupMY8L0UVHWo7gJATx03zJOR2/library/movie:11423`:**
  - `status`: `"completed"`
  - `isFavorite`: `true`
  - `watchCount`: `1`
  - `rating`: `9`
  - `runtimeMinutes`: `null` (missing duration causing 0 hour calculations)
  - `totalMinutesWatched`: `0`
  - `completedAt`: `{"_seconds": 1792412500, "_nanoseconds": 551000000}`
  - `updatedAt`: `{"_seconds": 1792412500, "_nanoseconds": 719000000}`
- **`users/79VupMY8L0UVHWo7gJATx03zJOR2/history/movie:11423_1792408660450`:**
  - `eventId`: `"movie:11423_1792408660450"`
  - `title`: `"Memories of Murder"`
  - `runtimeMinutes`: `0` (failed to inherit movie runtime)
  - `rating`: `null`
  - `watchedAt`: `{"_seconds": 1792408660, "_nanoseconds": 458000000}`
- **`users/79VupMY8L0UVHWo7gJATx03zJOR2/stats/summary`:**
  - `moviesWatched`: `1`
  - `minutesWatched`: `0`
  - `currentStreak`: `0`
  - `statusCounts`: `{}` (empty map; dotted increments bypassed nested map)

---

## 3. Inventory of Status Fields & Metric Computations in `src`

### Places writing `status`:
1. `src/features/library/api/libraryApi.ts`: `addToLibrary`, `setStatus`, `updateLibraryEntry`
2. `src/features/library/components/WatchingPage.tsx`: `handleMarkCompleted`
3. `src/features/title/components/TitleDetailPage.tsx`: `handleStatusChange`, `handleAddToWatchlist`
4. `src/features/episodes/api/episodesApi.ts`: `markEpisodeWatched` (sets show to `watching` or `completed`)
5. `src/features/search/components/SearchAddToLibrarySheet.tsx`: `handleConfirmAdd`
6. `src/features/discover/components/DiscoverAddSheet.tsx`: `handleConfirmAdd`

### Canonical Status Values Allowed:
`'plan_to_watch' | 'watching' | 'completed' | 'on_hold' | 'dropped'`

### Places computing metrics (counts, hours, streaks, averages):
1. `src/features/home/hooks/useDashboardData.ts`:
   - `hoursWatched` (from `stats/summary`)
   - `streak` (from `stats/summary`)
   - `completedMoviesCount`, `completedTVCount` (from `entries`)
   - `avgRating` (from `entries.rating`)
   - `recentlyAdded` (from `entries.addedAt`)
2. `src/features/library/components/CompletedPage.tsx`:
   - `totalCount`, `hours`, `avgRating`, `thisMonthCount` (from `entries`)
3. `src/features/history/components/historyData.ts`:
   - `calculateGlobalStats` (from `historyEvents`)
4. `src/features/analytics/components/analyticsData.ts`:
   - `calculateMetrics`, `calculateGenresData`, `calculateMonthlyData` (from `entries`)
5. `src/features/collections/components/smartCollections.ts`:
   - `computeSmartCollections` (from `entries`)

---

## 4. Phase 2 Architecture & Remediation Strategy

1. **Delete `stats/*` Documents:** Completely eliminate `users/{uid}/stats/*`. All statistics are purely derived from `library` and `history` collections via memoized pure selectors.
2. **Single Real-time Store (`src/domain/store.ts`):**
   - A single top-level `onSnapshot` subscription to `users/{uid}/library`, `users/{uid}/history`, `users/{uid}/collections`, and `users/{uid}/plannedWatches`.
   - Shared `isReady` and `error` state.
   - All components subscribe to the exact same store.
3. **Pure Domain Layer (`src/domain/`):**
   - `status.ts`: strict transition state machine with table-driven tests.
   - `selectors.ts`: memoized selectors for `watchingList`, `watchlist`, `completedList`, `favoritesList`, `recentlyAdded`, `continueWatching`, `moviesWatched`, `hoursWatched`, `avgRating`, `streak`, `analytics`.
   - `smartCollections.ts`: live evaluation of built-in smart collections and Watchlist Smart Views.
4. **Atomic Transactions / Batches:**
   - Single atomic write functions (`addToLibrary`, `setStatus`, `markMovieWatched`, `unmarkMovieWatched`, `markEpisode`, `markSeason`, `toggleFavorite`, `setRating`, `removeFromLibrary`).
   - `recomputeLibraryEntry(titleKey)` to reconcile entry state from history and episodes.
