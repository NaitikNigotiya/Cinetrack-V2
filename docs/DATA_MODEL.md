# CineTrack v2: Data Model & Schema

All user data in CineTrack v2 is strictly partitioned by user UID under `users/{uid}/` to ensure complete multi-tenant data isolation.

---

## 1. Document Collections Overview

```
users/{uid}/
├── library/{titleKey}                 # Primary watchlist entries (e.g., "movie:550", "tv:1396")
│   └── seasons/{seasonNumber}         # Episode completion maps for TV shows
├── history/{eventId}                  # Immutable watch history log entries
├── reviews/{titleKey}                 # User reviews and ratings
├── notes/{noteId}                     # Personal markdown notes
├── collections/{collectionId}         # Custom user lists (e.g. "Favorites", "Halloween Marathon")
├── plannedWatches/{plannedId}         # Calendar scheduled watch events
├── stats/
│   ├── summary                        # Pre-aggregated headline counts, streaks, and ratings
│   └── monthly_{YYYY-MM}              # Monthly aggregated watch minutes and genre counts
└── settings/
    ├── preferences                    # User preferences (theme, rating scale, default status)
    ├── push                           # Push notification preferences
    └── push/tokens/{tokenHash}        # Registered FCM tokens keyed by SHA-256 hash
```

---

## 2. Key Document Schemas

### 2.1 Library Entry (`library/{titleKey}`)
- **Document ID**: `${type}:${tmdbId}` (e.g. `movie:550`, `tv:1396`).
- **Fields**:
  - `titleKey` (string): Unique composite key.
  - `title` (string): Title name.
  - `type` (`'movie'` | `'tv'`): Media type.
  - `status` (`'watching'` | `'completed'` | `'plan_to_watch'` | `'on_hold'` | `'dropped'`): Watch state.
  - `year` (number | null): Release year.
  - `rating` (number | null): User rating on canonical 0.5–10 scale.
  - `favorite` (boolean): Flag for favorites list.
  - `totalRuntimeMinutes` (number): Runtime.
  - `tv` (object, optional for TV):
    - `totalEpisodes` (number)
    - `episodesWatched` (number)
    - `nextEpisodeToWatch` ({ season: number, episode: number } | null)

### 2.2 Season Tracker (`library/{titleKey}/seasons/{seasonNumber}`)
- **Document ID**: Integer string (e.g. `'1'`, `'2'`).
- **Fields**:
  - `seasonNumber` (number)
  - `episodes` (map): `[episodeNumber] -> { watched: boolean, watchedAt: Timestamp }`
  - `watchedCount` (number)
  - `totalEpisodes` (number)

### 2.3 History Event (`history/{eventId}`)
- **Document ID**: Deterministic `${type}_${tmdbId}_${timestamp}` or Firestore auto-ID.
- **Fields**:
  - `titleKey` (string)
  - `title` (string)
  - `type` (`'movie'` | `'tv_episode'`)
  - `watchedAt` (Timestamp)
  - `seasonNumber` (number | null)
  - `episodeNumber` (number | null)
  - `episodeTitle` (string | null)
  - `runtimeMinutes` (number)
  - `genreIds` (number[])

### 2.4 Pre-Aggregated Stats (`stats/summary`)
- Maintains source-of-truth counts updated atomically during writes:
  - `moviesWatched`, `episodesWatched`, `minutesWatched`, `titlesCompleted`
  - `ratingSum`, `ratingCount`
  - `currentStreak`, `longestStreak`, `lastActiveDay`
  - `genreCounts`: `{ [genreId]: number }`
  - `statusCounts`: `{ [status]: number }`

---

## 3. Atomic Updates & Drift Repair

To solve the counter drift issue (D4 from v1), CineTrack v2 adheres to two safeguards:
1. **Atomic Batch Writes**: Writing to history, incrementing watch counts, and adjusting summary statistics occur in a single `writeBatch` or `runTransaction`.
2. **Recompute Repair**: The `recomputeStats(uid)` repair function recalculates all stats directly from raw `library` and `history` entries.
