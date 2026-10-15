# CineTrack v1 to v2 Migration Guide

This guide details the procedure to migrate user data from CineTrack v1 to CineTrack v2 while strictly protecting v1 data integrity.

## Safety Principles
1. **Zero modifications to v1**: The migration script only requires read permissions on the v1 Firebase project.
2. **Dry run by default**: The script runs in `--dry-run` simulation mode unless explicitly passed `--confirm`.
3. **Deterministic document IDs**: Title keys (e.g. `movie:550` or `tv:1396`) map 1:1, making re-runs idempotent.
4. **Counter drift resolution**: Rather than porting potentially drifted v1 counters, `recomputeStats()` is executed after data transfer to guarantee mathematical correctness.

## Schema Field Mapping Table

| v1 Collection / Field | v2 Destination | Transformation Rule |
| :--- | :--- | :--- |
| `users/{uid}/watchlist/{id}` | `users/{uid}/library/{titleKey}` | Field `totalRuntime` mapped to `totalMinutesWatched`. Status preserved (`watching`, `completed`, `plan_to_watch`, `on_hold`, `dropped`). |
| `watchlist/{id}/episodes/{epKey}` | `library/{titleKey}/seasons/{seasonNum}` | Per-episode individual docs are aggregated into season map documents `{ episodes: { [epNum]: { watched, watchedAt } } }`. |
| `users/{uid}/watchHistory/{id}` | `users/{uid}/history/{eventId}` | Preserves `watchedAt` timestamp. Deterministic event ID `hist_${titleKey}_${timestamp}`. |
| `watchlist/{id}.notes` (inline string) | `users/{uid}/notes/{autoId}` | Extracted to dedicated `notes` document linked to `titleKey`. |
| `watchlist/{id}.review` (inline string) | `users/{uid}/reviews/{titleKey}` | Extracted to dedicated `reviews` document with spoiler flag defaulting to `false`. |
| `users/{uid}/collections/{id}` | `users/{uid}/collections/{id}` | Transferred with array of `items` (`titleKey`). |
| `users/{uid}/plannedWatches/{id}` | `users/{uid}/plannedWatches/{id}` | Transferred with local date string format `YYYY-MM-DD`. |

## How to Run Migration Script

1. Install dependencies:
   ```bash
   npm install firebase-admin
   ```

2. Download service account keys:
   - `v1-service-account.json` (Read-Only access to v1 project)
   - `v2-service-account.json` (Admin access to v2 project)

3. Perform simulation dry run:
   ```bash
   node scripts/migrate-v1.cjs --dry-run
   ```

4. Review output summary, then execute real migration:
   ```bash
   node scripts/migrate-v1.cjs --confirm
   ```
