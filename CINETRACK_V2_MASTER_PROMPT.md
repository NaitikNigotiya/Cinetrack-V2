# CineTrack v2: Master Build Prompt

> Paste this entire file into Antigravity as the first message of a new workspace. It is written for an autonomous coding agent. It is long on purpose: every section either states a requirement, a decision that has already been made, or a defect from v1 that must not be repeated.

---

## 0. Role and working agreement

You are a senior full-stack engineer and product designer. You are rebuilding **CineTrack**, a personal movie and TV tracking Progressive Web App, from scratch. A previous version (v1) exists and is analysed in section 2. You are **not** porting v1 code. You are re-implementing the product with a cleaner architecture, tighter security and a better UX.

**Rules of engagement**

1. **Work in phases** (section 16). At the end of each phase: run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`. All must pass before starting the next phase. Summarise what was done and what is next in 5 lines or fewer.
2. **Never delete, overwrite or migrate anything outside this new repository.** v1's repository, Vercel project, Firebase project and user data are off-limits. Do not run `firebase delete`, `vercel remove`, `rm -rf` outside the project directory, or anything destructive against a remote service.
3. **Never commit secrets.** Only `.env.example` with empty values is committed. Server-only keys never get a `VITE_` prefix.
4. **No `any`.** `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. Use `unknown` plus Zod parsing at every I/O boundary (Firestore reads, TMDB responses, IndexedDB, `localStorage`, `JSON.parse`).
5. **No file over 300 lines.** If a component or hook grows past that, split it. (v1 had pages of 900 to 1,600 lines. That is the main maintainability failure to fix.)
6. **Ask before guessing** only when a decision is irreversible or changes the data model after Phase 2. Otherwise choose the default stated here, note the choice in `docs/DECISIONS.md`, and move on.
7. Write small, conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`) at the end of each logical unit.
8. Keep a running `docs/PROGRESS.md` (checklist mirroring section 16) and `docs/DECISIONS.md` (one entry per non-obvious decision, with the reason).

---

## 1. Product definition

**One-liner:** *Track. Rate. Remember.* A fast, installable, offline-capable personal log of everything you watch.

**Who it is for:** a person who watches a lot of movies and TV and wants one place to (a) find things, (b) keep a library with statuses, (c) log what they watched and when, (d) track TV episode by episode, (e) see stats about their viewing, and (f) get nudged about new releases they would like.

**Core loop:** *Search or discover → add to library → watch → log (mark watched, rate, review) → see it reflected in history and analytics.*

**Key decision: multi-user.** v1 was effectively single-user: its documented Firestore rules locked access to one hard-coded email. v2 is a real multi-user platform. Any authenticated user can use it, and data isolation is enforced purely by `request.auth.uid == userId`. No hard-coded emails anywhere.

**Non-goals for v2.0:** social feeds, following users, comments, payments, native mobile apps, user-uploaded images.

---

## 2. What v1 was, and what to fix (reference only)

### 2.1 v1 summary
- React 19, TypeScript, Vite, React Router 7, TanStack Query 5, Zustand 5, Framer Motion, Recharts, lucide-react, Firebase (Auth, Firestore, FCM, unused Storage import), `vite-plugin-pwa` with Workbox, deployed on Vercel with one cron function.
- About 13,500 lines in `src/pages/*.tsx` plus feature hooks. Plain per-page CSS files and a CSS-variable token file.
- 22 route paths, including duplicates (`/title/:id` and `/watchlist/:id`; `/title/:id/episodes` and `/watchlist/:id/episodes`).
- Sidebar navigation in four groups: MAIN (Dashboard, Search, Discover), MY LIBRARY (Watchlist, Watching, Completed, Favorites, Collections), TRACK (Calendar, Notifications, Reviews, Notes, Analytics), OTHER (Settings).
- Design: light theme "IMDb-inspired" (bg `#F5F5F1`, brand `#F5C518`), dark theme "Netflix-inspired" (bg `#141414`, brand `#E50914`), Inter font, 4/8/12/16 px radii, 11 to 36 px type scale.
- Firestore layout (all under `users/{uid}/`): `watchlist/{titleId}` (with an `episodes/{episodeKey}` subcollection), `watchHistory/{autoId}`, `reviews`, `notes`, `collections`, `plannedWatches`, `settings/push`.
- `titleId` is a composite string such as `movie:550` or `tv:1396`, used as the document id.

### 2.2 Defects and smells in v1 (each must be fixed in v2)

| # | v1 problem | v2 requirement |
|---|---|---|
| D1 | TMDB read token shipped to the browser as `VITE_TMDB_READ_ACCESS_TOKEN`; anyone can extract it from the bundle | All TMDB calls go through a server-side proxy (`/api/tmdb`). The token exists only as a server env var. |
| D2 | Firestore rules existed only as a code comment and in the console, locked to one email | Rules are a checked-in file (`firestore.rules`), uid-based, with schema validation, tested with the emulator |
| D3 | History logging was **not atomic**: `addDoc` to history, *then* `updateDoc` on the title. A failure between them leaves counters wrong | Every multi-document change uses a `writeBatch` or `runTransaction` |
| D4 | Counters (`episodesWatched`, `totalRuntime`) maintained with `increment()` in several places; they drift when anything fails or is retried | Counters are only changed inside the same atomic write as the event that justifies them. Provide a "recompute counters" repair function. |
| D5 | The whole watchlist was loaded with a single `onSnapshot` and copied into a Zustand store, which every page then re-filtered | Use per-view TanStack Query or scoped listeners with pagination; Zustand only for UI state |
| D6 | Analytics computed client-side by downloading all of `watchHistory` | Maintain small pre-aggregated stats docs (section 8.9) updated in the same batch, with a client fallback recompute |
| D7 | Hand-rolled IndexedDB offline queue with `any` payloads, random 7-character ids, and a loop that `break`s on the first failure, so one bad operation blocks the queue forever. It also duplicated Firestore's own offline persistence | Rely on Firestore's persistent local cache for writes. Only queue what Firestore cannot (e.g. push-token registration) and, if a queue is kept, make it typed, idempotent, with dead-letter handling |
| D8 | Cron function: picks only `movies[0]`, English-only, movies-only, one push per user per day regardless of relevance; sequential loop; TMDB key in the query string; never removes dead FCM tokens | See section 11 |
| D9 | Giant pages (TitleDetail 1,638 lines, Calendar 1,301, Home 924, Settings 876, Analytics 746) | Feature-sliced components, max 300 lines per file |
| D10 | Near-duplicate pages: Watchlist, Watching, Completed, Favorites | One **Library** page with status tabs and saved filters (section 7.4) |
| D11 | Duplicate routes for the same screen | One canonical route per screen |
| D12 | Per-page CSS files with ad-hoc values | Single design-token layer; components consume tokens only |
| D13 | README did not match the real app (described a movie-only app) | Accurate README, generated from the real feature list |
| D14 | Rating stored as 0.5 to 10 but display scale switchable; conversion logic scattered | One `rating` module owns storage scale (0.5 to 10, step 0.5) and conversion to and from `ten`, `five`, `fivehalf` |
| D15 | Unused imports/dependencies (Storage), a `scratch/` folder committed | Clean repo; no dead code; CI fails on unused exports (use `knip`) |

---

## 3. Tech stack (decided)

| Concern | Choice |
|---|---|
| Language | TypeScript 5.x, strict |
| Build | Vite (latest stable) |
| UI | React 19 |
| Routing | React Router (data router, lazy routes, route-level error elements) |
| Server state | TanStack Query v5 with `persistQueryClient` (IndexedDB) |
| Client state | Zustand, UI-only (sidebar open, modals, filters) |
| Backend | Firebase: Authentication, Firestore, Cloud Messaging |
| Server code | Vercel Serverless Functions (Node 20+), in `/api` |
| Validation | Zod (shared schemas in `src/shared/schemas`, imported by both client and `/api`) |
| Styling | Tailwind CSS v4 **or** CSS Modules; pick one in Phase 0, record in DECISIONS.md, use it everywhere. Tokens live in one CSS file. |
| Animation | Motion (Framer Motion), respecting `prefers-reduced-motion` |
| Charts | Recharts |
| Icons | lucide-react |
| Dates | `date-fns` |
| PWA | `vite-plugin-pwa` (Workbox) |
| Lint / format | oxlint or ESLint (with `eslint-plugin-jsx-a11y`) plus Prettier; `knip` for dead code |
| Tests | Vitest + Testing Library (unit/component), Firebase Emulator + `@firebase/rules-unit-testing` (rules), Playwright (a handful of e2e flows) |
| CI | GitHub Actions: install, typecheck, lint, test, build |

If a library version has a breaking change from what you know, check its docs rather than guessing.

---

## 4. Repository layout

```
cinetrack-v2/
├─ api/                       # Vercel functions (server only)
│  ├─ tmdb/[...path].ts       # authenticated TMDB proxy + cache headers
│  ├─ cron/new-releases.ts    # daily/hourly push job
│  └─ _lib/                   # admin SDK init, auth verify, zod env, rate limit
├─ src/
│  ├─ app/                    # providers, router, shell, error boundary
│  ├─ shared/
│  │  ├─ schemas/             # Zod schemas + inferred types (client AND api)
│  │  ├─ ui/                  # design-system primitives (Button, Sheet, Toast…)
│  │  ├─ lib/                 # rating.ts, dates.ts, ids.ts, tmdbImage.ts
│  │  └─ styles/              # tokens.css, base.css, motion.css
│  ├─ services/
│  │  ├─ firebase/            # app, auth, db init, converters
│  │  ├─ tmdb/                # typed client for /api/tmdb, query keys
│  │  └─ push/                # FCM registration
│  └─ features/
│     ├─ auth/  search/  discover/  library/  title/  episodes/
│     ├─ history/  reviews/  notes/  collections/  calendar/
│     ├─ analytics/  notifications/  settings/  home/
│     └─ (each) { api/, hooks/, components/, routes/, index.ts }
├─ public/                    # icons, manifest assets, firebase-messaging-sw.js
├─ firestore.rules
├─ firestore.indexes.json
├─ firebase.json              # emulators + rules/indexes config
├─ vercel.json
├─ tests/ e2e/
├─ docs/  (PROGRESS.md, DECISIONS.md, ARCHITECTURE.md, DATA_MODEL.md)
├─ .env.example
└─ README.md
```

Rules: features import from `shared` and `services`, never from each other's internals (only from the other feature's `index.ts`). No Firestore call outside `features/*/api` or `services/firebase`.

---

## 5. Environment variables

**Client (`VITE_` prefix, safe to expose):**
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_VAPID_KEY`, `VITE_USE_EMULATORS` (`true` in dev).

**Server only (never `VITE_`):**
`TMDB_READ_TOKEN`, `CRON_SECRET`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_PROJECT_ID`.

Validate server env with Zod at cold start; fail fast with a clear message. Provide `.env.example` with every key and a one-line comment.

---

## 6. Data model (Firestore)

All user data lives under `users/{uid}`. Timestamps are Firestore `Timestamp`. Every document carries `schemaVersion: 1`, `createdAt`, `updatedAt`. Use typed converters that run Zod `parse` on read, and drop or quarantine malformed docs with a logged warning, never crash the UI.

### 6.1 Identifiers
- `titleKey = "movie:550" | "tv:1396"` (type, colon, TMDB id). Use as the document id for library entries. Provide `parseTitleKey()` and `makeTitleKey()` in `shared/lib/ids.ts` and use them everywhere.
- Episode key: `"s01e03"` zero-padded season and episode.

### 6.2 Collections

**`users/{uid}`** (profile)
```ts
{ displayName: string; email: string; photoURL: string|null;
  region: string;            // ISO 3166-1, default from locale, used for watch-providers
  language: string;          // BCP-47, default "en-US"
  timezone: string;          // IANA, e.g. "Asia/Kolkata", used by cron
  onboarded: boolean; createdAt; updatedAt; schemaVersion: 1 }
```

**`users/{uid}/library/{titleKey}`** (replaces v1 `watchlist`)
```ts
{
  titleKey: string; tmdbId: number; type: 'movie'|'tv';
  title: string; originalTitle?: string; year: number|null;
  posterPath: string|null; backdropPath: string|null;
  genres: { id: number; name: string }[];       // keep ids, v1 kept only names
  runtimeMinutes: number|null;                   // movie runtime or avg episode runtime
  status: 'plan_to_watch'|'watching'|'completed'|'dropped'|'on_hold';
  rating: number|null;                           // 0.5..10 step 0.5, canonical
  isFavorite: boolean;
  watchCount: number;                            // completed viewings (movies) / full rewatches (tv)
  lastWatchedAt: Timestamp|null;
  totalMinutesWatched: number;                   // denormalised, see §6.3
  // TV only
  tv?: { totalEpisodes: number|null; totalSeasons: number|null;
         episodesWatched: number; currentSeason: number|null;
         nextEpisodeToWatch: { season: number; episode: number }|null;
         tmdbStatus: string|null; nextAirDate: string|null /* YYYY-MM-DD */ };
  tags: string[];                                // free-form, max 20
  addedAt: Timestamp; startedAt: Timestamp|null; completedAt: Timestamp|null;
  updatedAt: Timestamp; schemaVersion: 1
}
```
Notes: reviews and notes are **separate collections** (they were inline strings plus separate collections in v1, which caused duplication). `status` gains `on_hold`. `completedAt`/`startedAt` set automatically on status transitions.

**`users/{uid}/library/{titleKey}/seasons/{seasonNumber}`** (replaces v1's one-doc-per-episode subcollection; one doc per season, far fewer reads and writes)
```ts
{ season: number; totalEpisodes: number|null;
  watched: { [episodeNumber: string]: Timestamp };  // map: "3": watchedAt
  watchedCount: number; minutesWatched: number; completed: boolean; updatedAt }
```
A map keyed by episode number keeps per-episode timestamps while letting one write mark a whole season.

**`users/{uid}/history/{eventId}`** (replaces `watchHistory`)
```ts
{ eventId: string; titleKey: string; title: string; type: 'movie'|'tv_episode';
  season?: number; episode?: number; episodeLabel?: string; // "S01E03"
  watchedAt: Timestamp; runtimeMinutes: number; rating?: number|null;
  posterPath: string|null; genreIds: number[];               // denormalised for analytics w/o joins
  source: 'manual'|'season_bulk'|'import'; createdAt; schemaVersion: 1 }
```
The `eventId` for episodes is deterministic (`${titleKey}_s01e03`) so re-marking cannot create duplicates; movies use auto ids to allow rewatches.

**`users/{uid}/reviews/{titleKey}`** one review per title: `{ titleKey, title, posterPath, rating: number|null, body: string (<=5000), containsSpoilers: boolean, createdAt, updatedAt }`.

**`users/{uid}/notes/{noteId}`**: `{ titleKey: string|null, title: string|null, body: string (<=5000), pinned: boolean, createdAt, updatedAt }` (notes can exist without a title).

**`users/{uid}/collections/{collectionId}`**: `{ name (<=80), description (<=500), emoji?: string, items: { titleKey; title; posterPath; type; addedAt }[] (max 500), isPublic: boolean, shareSlug?: string, createdAt, updatedAt }`. Cap `items` at 500 and document the 1 MiB limit consequence.

**`users/{uid}/plannedWatches/{id}`**: `{ titleKey, title, posterPath, type, plannedFor: string /* YYYY-MM-DD */, plannedTime?: string /* HH:mm */, note?: string, reminder: boolean, done: boolean, createdAt, updatedAt }`.

**`users/{uid}/settings/preferences`**:
```ts
{ theme: 'light'|'dark'|'system'; ratingScale: 'ten'|'five'|'fivehalf';
  defaultStatus: 'plan_to_watch'|'watching'; compactCards: boolean;
  showSpoilers: boolean; weekStartsOn: 0|1; updatedAt }
```

**`users/{uid}/settings/push`** (server also reads this):
```ts
{ pushEnabled: boolean; tokens: { [tokenHash: string]: { token: string; platform: string; createdAt; lastSeenAt } };
  favoriteGenreIds: number[]; includeTv: boolean; digestHourLocal: number /* 0-23 */;
  lastSentAt: Timestamp|null; recentlyNotifiedKeys: string[] /* last 50 titleKeys */ }
```
Multiple tokens per user (several devices). v1 stored a single `fcmToken`.

**`users/{uid}/stats/summary`**, **`users/{uid}/stats/monthly_{YYYY-MM}`**: pre-aggregated analytics, see §8.9.

**`publicCollections/{shareSlug}`** (optional v2.1 feature, scaffold the rules only): read-only snapshot of a public collection.

### 6.3 Write patterns (atomicity is mandatory, fixes D3 and D4)
Implement these as functions in `features/*/api` that each use **one** `writeBatch` or `runTransaction`:

- `addToLibrary(entry)`: creates the library doc; fails if it exists (use a transaction) so it never silently overwrites.
- `setStatus(titleKey, status)`: sets status and the correct timestamps (`startedAt` when first moving to `watching`; `completedAt` when moving to `completed`; clears `completedAt` when leaving it). For a movie moving to `completed`, also writes one history event and bumps `watchCount`, `totalMinutesWatched` and stats in the same batch.
- `markEpisode(titleKey, season, episode, watched)`: in one transaction, updates the season doc map, `watchedCount`, `minutesWatched`, the title's `tv.episodesWatched`, `totalMinutesWatched`, `tv.nextEpisodeToWatch`, writes or deletes the deterministic history doc, updates stats, and auto-transitions status (`plan_to_watch` to `watching` on first episode; `watching` to `completed` when `episodesWatched === totalEpisodes` and the show is not still airing).
- `markSeason(titleKey, season, watched)`: the same, as one batch (max 500 operations per batch; chunk if needed and keep it idempotent).
- `removeFromLibrary(titleKey)`: deletes the library doc, its `seasons` subcollection, its history events, and decrements stats. Show a confirm dialog and an **Undo** toast that restores from an in-memory snapshot for 8 seconds.
- `recomputeTitle(titleKey)` and `recomputeStats()`: repair functions that rebuild denormalised counters from source-of-truth docs. Expose as "Repair my data" in Settings.

### 6.4 Security rules (`firestore.rules`)
Write real rules, not placeholders. Requirements:
- Default deny.
- `match /users/{userId}/{document=**}`: allow read/write only if `request.auth != null && request.auth.uid == userId`.
- Add per-collection `allow create, update` validation: field types, enum membership for `status`/`type`, `rating` is a number between 0.5 and 10 or null, string length caps (`body <= 5000`, `name <= 80`), `items.size() <= 500`, `tags.size() <= 20`, `titleKey` matches `^(movie|tv):[0-9]+$`, and `request.resource.data.updatedAt == request.time` for server-timestamped writes.
- `stats/*` writable by the owner (computed client-side in batches) but validated as numbers >= 0.
- `publicCollections/{slug}`: public read, write only when `request.auth.uid == request.resource.data.ownerUid`.
- Ship `firestore.indexes.json` with every composite index your queries need (e.g. `library` by `status` + `updatedAt desc`; `history` by `watchedAt desc`; `history` by `titleKey` + `watchedAt desc`).
- Write rules unit tests: owner can CRUD own docs; another user cannot read or write; unauthenticated cannot; invalid `status`, `rating = 11`, `rating = 0.3`, oversize `body`, bad `titleKey` all rejected.

---

## 7. Screens and behaviour

### 7.1 Routes (one canonical path per screen)

| Path | Screen | Auth |
|---|---|---|
| `/login` | Sign in / sign up | public |
| `/` | Home dashboard | yes |
| `/search` | Search (supports `?q=`, `?type=`, `?add=true`, and Web Share Target params) | yes |
| `/discover` | Discover | yes |
| `/library` | Library (tabs via `?status=`; filters in the query string so views are shareable and restorable) | yes |
| `/title/:titleKey` | Title detail (e.g. `/title/movie:550`) | yes |
| `/title/:titleKey/episodes` | TV episode tracker | yes |
| `/history` | Watch history timeline | yes |
| `/reviews` | All reviews | yes |
| `/notes` | Notes | yes |
| `/collections`, `/collections/:id` | Collections list and detail | yes |
| `/calendar` | Planned watches and upcoming releases | yes |
| `/analytics` | Stats | yes |
| `/settings` | Settings (sections: Account, Appearance, Library, Notifications, Data, About) | yes |
| `/c/:shareSlug` | Public collection (optional, v2.1) | public |
| `*` | Not found | n/a |

Legacy redirects are **not** needed (this is a new app); do not add them.

Every route has an `errorElement`, a `Suspense` skeleton fallback that matches its layout (no spinner flash), and is code-split except Login, Home and Search.

### 7.2 Global shell
- **Desktop (>= 1024 px):** left sidebar (240 px, collapsible to a 72 px icon rail) with groups MAIN (Home, Search, Discover), LIBRARY (Library, Collections, History), TRACK (Calendar, Reviews, Notes, Analytics), then Settings pinned at the bottom with the user avatar menu. Top bar contains a global search input (`/` focuses it) and a notifications bell.
- **Mobile (< 1024 px):** bottom tab bar with 5 tabs (Home, Search, Library, Calendar, More). "More" opens a bottom sheet with the rest. Respect `env(safe-area-inset-bottom)`.
- Offline indicator banner, install prompt (once, dismissible, remembered), update-available toast with a "Reload" action.
- Global keyboard shortcuts: `/` focus search, `g h` home, `g l` library, `g s` search, `?` shortcuts help. Must not fire while typing in inputs.
- Skip-to-content link, visible focus rings, landmarks (`header`, `nav`, `main`).

### 7.3 Auth
- Providers: Google and email/password (with email verification and password reset). Show clear errors (popup blocked, wrong password, network).
- `AuthGate` waits for `onAuthStateChanged` before rendering, shows a branded splash, and redirects back to the originally requested route after login.
- On first login create `users/{uid}` and `settings/preferences` with defaults, then show a 3-step onboarding (pick genres, pick default status, optionally enable notifications).
- Sign-out clears the TanStack Query cache and persisted cache so one user's data never shows for the next user on a shared device.

### 7.4 Library (replaces Watchlist, Watching, Completed, Favorites)
- Tabs: **All, Watching, Plan to watch, Completed, On hold, Dropped, Favorites.** Each shows a count.
- Controls: text filter, type (All/Movies/TV), genre multi-select, year range, rating range, tags, sort (recently updated, date added, title, year, my rating, TMDB rating, runtime), grid vs list toggle, density toggle.
- Cards show poster, title, year, status badge, my rating, and for TV a progress bar (`watched/total`).
- Quick actions on each card (long-press or kebab menu): change status, toggle favourite, rate, add to collection, plan a watch, remove.
- Bulk select mode: change status, add tag, add to collection, remove.
- Pagination: cursor-based (`startAfter`), 40 per page, infinite scroll with a "Load more" fallback for keyboard users. Do **not** load the entire library into memory. The tab counts come from `stats/summary`.
- Empty states per tab with a call to action.

### 7.5 Search
- Debounced (300 ms) multi-search across movies and TV via the proxy; filters for type and year; shows recent searches (stored locally, max 10, clearable).
- Each result shows poster, title, year, type, TMDB rating and an **Add** button that adds with the user's default status and shows a toast with an Undo. Results already in the library show their status badge instead, kept in sync live.
- Keyboard navigable (up/down/enter). The empty state shows trending titles.
- Handles Web Share Target (`/search?q=...`) and the `?add=true` shortcut (autofocus).

### 7.6 Discover
Horizontal carousels, each lazy loaded when scrolled into view: Trending today/this week, Popular, Top rated, Now playing / On the air, Upcoming, Because you liked *X* (based on the user's three highest-rated recent titles, via the TMDB recommendations endpoint, de-duplicated against the library), and a Browse by genre grid that opens a paginated genre results view with sort options. Items already in the library are visually marked. Hide titles the user has marked as "not interested" (stored in `settings/preferences.hiddenTmdbKeys`, max 500).

### 7.7 Title detail
- Hero with backdrop, poster, title, year, runtime, genres, TMDB score, tagline, overview.
- **Primary action bar:** status selector, favourite toggle, rating control, "Mark watched" (movies) or "Open episodes" (TV), Add to collection, Plan a watch, Trailer, Share.
- Tabs or sections: Overview, Cast and crew (top 12), **Where to watch** (TMDB watch-providers for the user's `region`, with the required attribution text), Trailers and videos, Recommendations, My activity (history events for this title), My review, My notes.
- Rewatch: if already completed, "Watch again" logs a new event and increments `watchCount`.
- Trailer opens in an accessible modal (focus trap, Esc to close, pauses on close).
- Works with a library entry absent (shows an "Add to library" CTA). Loading uses skeletons; errors show a retry.

### 7.8 TV episode tracker
- Season selector (chips, scrollable) and a list of episodes with still image, number, name, air date, runtime, overview (collapsible), and a watched checkbox (large tap target).
- Actions: mark episode, mark season watched/unwatched, "Mark all up to here" (marks every earlier episode across seasons), and "Next up" jump.
- Unaired episodes are visibly disabled and cannot be marked.
- Overall progress bar and "X of Y episodes, ~Z hours left" estimate.
- All changes are optimistic and use the atomic writes in §6.3.
- Completing the final episode of an ended show triggers the completion celebration (confetti, respecting reduced motion) and offers "Rate it".

### 7.9 History
Reverse-chronological timeline grouped by day (Today, Yesterday, then dates). Filters: type, date range, title search. Each row: poster thumb, title, episode label, time, runtime, and a delete action with Undo. Monthly summary header (count and hours). Cursor-paginated. Add a manual "Log a past watch" with a date/time picker (for backfilling).

### 7.10 Reviews and Notes
- Reviews: list sorted by newest, filter by rating and spoiler flag, spoiler text blurred until tapped. Edit inline; character counter; autosave draft to `localStorage` keyed by `titleKey` so a refresh never loses text.
- Notes: masonry or list, pinned first, search, optional link to a title, markdown-lite (bold, italic, lists, links) rendered safely (sanitise; no raw HTML).

### 7.11 Collections
Create, rename, reorder (drag and drop with a keyboard alternative), delete, and add/remove titles from the title page or a "quick add" sheet. Detail page shows a poster mosaic header. Optional: toggle public to generate a share link (scaffold; implement fully in v2.1).

### 7.12 Calendar
- Month and agenda views. Shows (a) planned watches, (b) upcoming episodes of TV shows in the library whose status is `watching` or `plan_to_watch` (from TMDB `next_episode_to_air`, refreshed at most once per 12 hours per show), (c) release dates of library titles still unreleased.
- Add/edit/delete a planned watch (date, optional time, note, reminder toggle). Drag a planned item to another day (with a keyboard alternative). Mark done, which can also log it to history.
- Week start comes from settings. Dates are handled as local `YYYY-MM-DD` strings plus the user's timezone, so a planned watch never shifts a day because of UTC conversion (v1 style Date math invites that bug).

### 7.13 Analytics
Source: `stats/*` docs (§8.9). Sections: headline cards (titles watched, hours watched, average rating, current streak, longest streak), watch time by month (stacked movie vs TV, last 12 months), top genres (donut or bars with percentages), rating distribution (0.5 to 10 in 10 half-bins or 5 buckets per setting), most-watched decade, top 5 highest rated, "year in review" view selectable by year, and a small calendar heatmap of activity. All charts have accessible text alternatives (a visually hidden table), a colour-blind-safe palette, and an empty state. Use the `dataviz` approach: consistent palette, labelled axes, tooltips.

### 7.14 Settings
Sections: **Account** (profile, change password, delete account with typed confirmation that deletes the user's data via a callable server function and then the auth user), **Appearance** (theme, compact cards), **Library** (rating scale, default status, show spoilers), **Notifications** (§11), **Data** (export JSON/CSV, import Letterboxd/CSV/v1-export, Repair my data), **About** (version, licences, TMDB attribution). Settings changes apply optimistically and save with debounce.

### 7.15 Home dashboard
Greeting, **Continue watching** (TV shows in progress with the next episode and a one-tap "Mark watched"), **Plan to watch** shortlist (with a "Surprise me" button that picks a random title, optionally constrained by max runtime), **Recently added**, **Trending now**, a compact stats strip (hours this month, streak), and "Coming up" (next 7 days from the calendar). Every block has its own skeleton, error state and empty state, and loads independently.

---

## 8. Cross-cutting systems

### 8.1 TMDB proxy (`api/tmdb/[...path].ts`) fixes D1
- Verify a Firebase ID token from the `Authorization: Bearer` header with the Admin SDK; reject unauthenticated calls with 401.
- **Allow-list** the upstream paths and query params (search/multi, trending, discover, movie/tv details with `append_to_response`, season, recommendations, watch/providers, videos, images, genre lists, `person` not needed). Reject anything else with 400. This prevents the proxy becoming an open relay.
- Inject `Authorization: Bearer ${TMDB_READ_TOKEN}` server side; forward `language` and `region`.
- Response headers: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` for stable data (details, season, genres), shorter (`s-maxage=300`) for trending/search. (Authenticated requests are not CDN cached by default, so key the cache by path and query only and **do not** vary by the user: do the auth check, then serve a cacheable body.)
- Basic per-user rate limiting (e.g. 60 req/min using a Firestore or in-memory counter), a 10 s upstream timeout, and a single retry with backoff on 429 or 5xx. Map upstream errors to a typed error body `{ error: { code, message } }`.
- Client wrapper `services/tmdb` exposes typed functions, with Zod parsing each response (trim to the fields the UI needs), consistent query keys, and `staleTime` per resource class (details: 24 h; trending: 15 min; search: 5 min).

### 8.2 TanStack Query
- One `QueryClient`, `persistQueryClient` to IndexedDB (buster tied to app version), `networkMode: 'offlineFirst'`, `retry` with exponential backoff but **not** for 4xx.
- Query key factory per feature (`tmdbKeys.details(titleKey)`, `libraryKeys.list(filters)`).
- Firestore reads: use `onSnapshot` only where live updates matter (library entry on the title page, the episode tracker, Home "Continue watching"). Everywhere else use cached one-shot reads plus targeted invalidation after mutations.

### 8.3 Optimistic updates
Every mutation (status, rating, favourite, episode toggle, add/remove) updates the cache immediately, rolls back on error with a toast ("Couldn't save. Reverted." plus Retry), and never blocks the UI. Firestore's local cache makes writes work offline, so the UI must treat "pending" writes as success but show a subtle "syncing" dot, using `snapshot.metadata.hasPendingWrites`.

### 8.4 Offline and PWA (fixes D7)
- Firestore: `initializeFirestore` with `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`. This already queues writes offline and replays them in order. **Do not build a parallel custom queue for Firestore writes.**
- Workbox: precache the app shell; runtime caching for `image.tmdb.org` (CacheFirst, 30 days, 600 entries, status 0/200); `/api/tmdb/*` GET (StaleWhileRevalidate, 24 h, 300 entries); Google Fonts if used (or self-host the font and skip this). `registerType: 'prompt'`.
- Manifest (`/manifest.webmanifest`): name "CineTrack", `display: standalone`, theme/background colours matching tokens, 192/512/maskable icons, `shortcuts` (Search, Library, Add), `share_target` GET to `/search` with `q` from `title`/`text`, and real **screenshots** (v1 left them empty) for richer install UI.
- Offline UX: banner, disabled network-only actions (search, discover) with explanation, library and history still browsable from cache.
- A friendly `/offline` fallback for uncached navigations.

### 8.5 Rating module (fixes D14)
`shared/lib/rating.ts`: canonical storage is a number 0.5 to 10 step 0.5. Functions `toDisplay(value, scale)`, `fromDisplay(value, scale)`, `formatRating(value, scale)`, `ratingToBucket(value)`. `RatingControl` supports tap on stars (with half-stars), keyboard arrows, and a clear action. 100% unit-tested, including round-trip across all three scales.

### 8.6 Dates and time
- All stored instants are Firestore `Timestamp` (UTC). All calendar day logic uses the user's `timezone` through `date-fns-tz` or `Intl`, with helpers `localDayKey(ts, tz)`. Streaks and "today" grouping use these helpers, never raw `getDate()`.

### 8.7 Error handling and observability
- Route-level `errorElement`, a global `ErrorBoundary`, a typed `AppError`, and a toast system with severity levels. No `console.error` as the only handling.
- Add a lightweight logger abstraction (console in dev; pluggable sink later). Optional: Sentry behind an env flag.

### 8.8 Accessibility (WCAG 2.2 AA is a hard requirement)
Semantic HTML first; all controls reachable and operable by keyboard; visible focus; `aria-live` for toasts and async results; dialogs trap focus and restore it; colour contrast >= 4.5:1 for text in both themes (verify the brand colours on their backgrounds, and darken the accent text variant if needed); touch targets >= 44 px; `prefers-reduced-motion` disables parallax, confetti and large transitions; images have meaningful `alt` (poster = title; decorative = `alt=""`); forms have labels and error association. Run `axe` in e2e on the main routes and fix all serious/critical findings.

### 8.9 Analytics aggregation (fixes D6)
Maintain, in the same batch as each history write or delete:
- `stats/summary`: `{ moviesWatched, episodesWatched, minutesWatched, titlesCompleted, ratingSum, ratingCount, genreCounts: {[genreId]: n}, statusCounts: {...}, currentStreak, longestStreak, lastActiveDay: 'YYYY-MM-DD', updatedAt }`.
- `stats/monthly_YYYY-MM`: `{ movies, episodes, movieMinutes, tvMinutes, genreCounts }`.
- Streak rule: a day is "active" if it has at least one history event in the user's timezone. Current streak counts consecutive active days ending today or yesterday. Implement as a pure function with unit tests (gaps, timezone boundaries, deleting an event that breaks a streak triggers a recompute from history, not an increment).
- `recomputeStats()` rebuilds everything from `history` and `library` and is the source of truth if drift is suspected.

---

## 9. Design system

Keep the identity of v1 (cinematic, content-first) but systematise it.

### 9.1 Tokens (single file `tokens.css`, semantic names, both themes)
Provide light and dark values for each. Start from v1's values, then adjust for contrast:

- **Surfaces:** `--surface-base`, `--surface-raised`, `--surface-overlay`, `--surface-inverse` (v1 dark: `#141414`, `#1F1F1F`, `#2A2A2A`; v1 light: `#F5F5F1`, `#FFFFFF`).
- **Brand/accent:** dark `#E50914`-family, light `#F5C518`-family. Define `--accent`, `--accent-hover`, `--accent-subtle`, `--on-accent`, and `--accent-text` (a variant that passes 4.5:1 on its surface). **Check contrast; do not assume.**
- **Text:** `--text-1` (primary), `--text-2`, `--text-3`, `--text-inverse`.
- **Borders:** `--border-subtle`, `--border-strong`, `--border-focus`.
- **Semantic:** `--success`, `--warning`, `--danger`, `--info`, each with a `-subtle` background variant.
- **Status colours** (one per library status, used for badges and progress): watching (blue/cyan), completed (green), plan (amber), on hold (violet), dropped (red).
- **Rating star:** filled and empty.
- **Elevation:** `--shadow-1/2/3` (use borders more than shadows in dark mode).
- **Radius:** 4, 8, 12, 16, pill. **Spacing:** 4-pt scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64).
- **Type:** Inter (variable, self-hosted, `font-display: swap`), scale 12/13/15/17/20/24/30/36/48, line heights 1.2 for headings and 1.5 for body, tabular numerals for stats and times.
- **Motion:** `--ease-out`, durations 120/200/350 ms; a `reduced-motion` override that sets them to ~0.
- **Z-index scale:** header, sidebar, sheet, modal, toast, as named tokens.
- Theme switching via `data-theme` on `<html>`, set by an inline script in `index.html` **before first paint** to avoid a flash; `system` follows `prefers-color-scheme`.

### 9.2 Components to build in `shared/ui` (documented with a tiny in-repo Storybook-style playground route `/_ui` in dev only)
Button (variants: primary, secondary, ghost, danger; sizes; loading), IconButton, Input, Textarea, Select, Combobox, Checkbox, Switch, Tabs, Chip/Pill, Badge, StatusBadge, RatingControl, Progress, Card, PosterCard (with `blurhash`/colour placeholder, lazy `loading="lazy"`, `srcset` using TMDB sizes w185/w342/w500/w780), Carousel (scroll-snap, arrow buttons, keyboard), Dialog, ConfirmDialog, BottomSheet (drag to dismiss), Popover/Menu, Toast (with action/undo), Skeleton (shimmer, reduced-motion safe), EmptyState, ErrorState, Tooltip, Avatar, DatePicker, SegmentedControl, VirtualList (use `@tanstack/react-virtual` for long lists).

### 9.3 Visual direction
Content-first: posters and backdrops are the hero. Generous spacing, 2:3 poster ratio everywhere, subtle gradient scrims over backdrops for legible text, restrained use of the accent colour (primary actions, active nav, progress, focus). Dark theme is the default for new users (`system` after onboarding if they choose it). Do not use generic AI-looking gradients or purple-on-white defaults. Make the hero and the empty states feel designed rather than templated. Check the result in both themes at 360 px, 768 px and 1440 px widths.

---

## 10. Performance budget
- Initial JS (gzip) <= 180 KB on `/login` and `/`; each lazy route chunk <= 120 KB.
- LCP < 2.5 s and CLS < 0.1 on a mid-range phone with throttled 4G; Lighthouse Performance, Accessibility, Best Practices, SEO, PWA all >= 90.
- Images: responsive `srcset`, explicit width/height to prevent layout shift, `fetchpriority="high"` only on the hero.
- Fonts self-hosted with a subset (Latin) and `preload` of the primary weight.
- Virtualise any list that can exceed ~100 rows.
- No unbounded Firestore reads: every list query has a `limit`.

---

## 11. Notifications and the cron job (fixes D8)

### 11.1 Client
In Settings > Notifications: master toggle (requests browser permission only on a user gesture, explains why), genre multi-select (TMDB genre ids), include TV toggle, preferred local delivery hour, a "Send me a test notification" button, and a list of registered devices with remove. Register the FCM token (`getToken` with the VAPID key and the service worker registration), store it under `settings/push.tokens` keyed by a hash of the token, refresh `lastSeenAt` on each app open, and remove it on sign-out. Handle `permission === 'denied'` with instructions, not an error.

`public/firebase-messaging-sw.js` handles background messages and `notificationclick` (focus an existing tab or open `actionUrl`).

### 11.2 Server: `api/cron/new-releases.ts`
- Schedule hourly (`0 * * * *`) in `vercel.json`; the function only processes users whose **local hour equals `digestHourLocal`** and whose `lastSentAt` is not today, so each user gets at most one digest per day at their chosen time. (Vercel cron expressions are UTC, so the per-user timezone logic must be in code.)
- Authenticate with `Authorization: Bearer ${CRON_SECRET}`; return 401 otherwise.
- Query opted-in users (`collectionGroup('push')`-style query with `pushEnabled == true`; add the needed index) in pages, process with limited concurrency (e.g. 10) using `Promise.allSettled`, and stop gracefully before the function timeout.
- Candidate titles: TMDB discover for released-in-the-last-7-days, `vote_count >= 10`, filtered by the user's favourite genres, movies and (if enabled) TV, language-agnostic (v1 hard-coded English only). Rank by popularity times genre match, exclude anything already in the user's library or in `recentlyNotifiedKeys`, and pick the best 1 to 3.
- Also notify (higher priority) when a **TV show in the user's library has a new episode airing today** (`watching` status).
- Send via `messaging.sendEachForMulticast` to all of the user's tokens; on `messaging/registration-token-not-registered` or `invalid-argument`, delete that token. Update `lastSentAt` and `recentlyNotifiedKeys` (cap 50).
- Cache TMDB discover results per `(genres, includeTv)` signature for the run so users with the same settings do not repeat identical calls.
- Structured logs: counts of processed, sent, skipped (not their hour / nothing relevant), failed, pruned tokens. Return that summary as JSON.
- Provide an `?dryRun=1` mode (still requires the secret) that returns what it *would* send without sending.
- Unit-test the ranking and the timezone-hour selection with fixed dates.

---

## 12. Data import, export and (optional) v1 migration
- **Export:** one JSON file containing profile, library, seasons, history, reviews, notes, collections, planned watches, settings, plus CSV exports for library and history. Round-trippable: importing an export recreates the same data (idempotent via deterministic ids).
- **Import:** wizard with file upload, format auto-detect (CineTrack JSON, Letterboxd CSV `watched.csv`/`ratings.csv`, generic CSV), preview with counts and unmatched rows, title matching via TMDB search with a manual fix step, and a progress bar. Batched writes, resumable, never overwrites a newer existing entry without asking.
- **v1 migration (optional, document-only in this phase):** write `scripts/migrate-v1.md` describing how to export v1 data (`users/{uid}/watchlist`, `watchHistory`, `reviews`, `notes`, `collections`, `plannedWatches`, `settings`) and map fields into the v2 model (`watchlist` to `library`; `watchHistory` to `history`; per-episode docs to season map docs; `status` unchanged; `notes`/`review` inline strings to the `notes`/`reviews` collections; `totalRuntime` to `totalMinutesWatched`; recompute stats afterwards). Provide a Node script using the Admin SDK that reads from a **read-only** v1 service account and writes to the v2 project, with `--dry-run` as the default and a required `--confirm` to write. **The script must never write to or delete from the v1 project.**

---

## 13. Testing strategy
- **Unit (Vitest):** `rating`, `ids`, date/streak helpers, stats aggregation, status-transition logic, import parsers, schema parsing (valid and malformed fixtures), cron ranking and timezone selection.
- **Component:** RatingControl, PosterCard, Library filters, EpisodeList toggle behaviour, Search keyboard navigation.
- **Rules:** Firebase emulator suite (see §6.4).
- **API:** the TMDB proxy (auth required, allow-list enforced, error mapping, cache headers) and the cron handler (secret check, dry run).
- **E2E (Playwright, against emulators and a mocked TMDB):** sign up, onboarding, search and add a movie, mark watched and see it in history and analytics, track a TV season, change theme, go offline and mark an episode then reconnect and confirm it synced, export data.
- **Coverage target:** >= 80% on `shared/lib`, stats and write-path functions. CI blocks merges on failures.

---

## 14. Security checklist (verify before "done")
- [ ] No third-party secret in the client bundle (grep the built `dist/` for the token and the private key).
- [ ] Firestore rules tests pass; no rule uses `if true`.
- [ ] TMDB proxy requires a valid ID token and an allow-listed path.
- [ ] Cron endpoint rejects missing/incorrect `CRON_SECRET`.
- [ ] User-generated text (notes, reviews, collection names) is rendered as text or through a sanitising markdown renderer; no `dangerouslySetInnerHTML` with raw user input.
- [ ] Security headers in `vercel.json`: `Content-Security-Policy` (self, TMDB image host, Firebase/Google auth and FCM endpoints, fonts if any), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` limiting unused features, `frame-ancestors 'none'`.
- [ ] Account deletion removes all user data server-side.
- [ ] Dependencies audited (`npm audit --omit=dev`), versions pinned by lockfile, Dependabot or Renovate configured.
- [ ] Firebase Auth: authorised domains list limited to the real domains; email enumeration protection on.

---

## 15. Deployment
- **Vercel:** SPA rewrite for non-`/api` paths; long-cache headers for hashed assets; `no-cache` for `sw.js`, `firebase-messaging-sw.js` and `manifest.webmanifest`; the cron entry from §11.2; environment variables from §5 set per environment (Preview and Production).
- **Firebase:** a **new** Firebase project (do not reuse v1's); deploy `firestore.rules` and `firestore.indexes.json` via CLI; enable Google and Email providers; add the Vercel domains to authorised domains; create the FCM Web Push certificate (VAPID key).
- **README:** what it is, screenshots, feature list that matches reality, setup (clone, `npm i`, `.env`, emulators, `npm run dev`), scripts, architecture overview with a diagram, deploy steps, contributing notes, TMDB attribution ("This product uses the TMDB API but is not endorsed or certified by TMDB", with the logo).

---

## 16. Phased plan with checkpoints

For each phase: implement, test, update `docs/PROGRESS.md`, commit, then stop and print a 5-line summary.

**Phase 0: Foundations.** Repo, tooling, CI, strict TS, lint, Prettier, knip, Vitest, tokens, theme bootstrap script, shared UI primitives (Button, Input, Dialog, Toast, Skeleton, Tabs), `/ _ui` playground. *Exit:* lint/typecheck/test/build green; both themes render the playground; contrast verified.

**Phase 1: Backend skeleton and auth.** Firebase init (emulators), converters and Zod schemas for every document, `firestore.rules` and rules tests, Google plus email auth, `AuthGate`, onboarding, app shell (sidebar, mobile tabs, theme, shortcuts). *Exit:* can sign up, sign out, rules tests green.

**Phase 2: TMDB proxy, Search, Title detail.** Proxy with auth, allow-list, caching, rate limit, tests; typed client; Search page; Title detail (read-only parts: overview, cast, trailers, providers, recommendations). *Exit:* no TMDB secret in the bundle (proof: grep result in PROGRESS.md).

**Phase 3: Library and atomic write paths.** `addToLibrary`, `setStatus`, favourite, rating, remove-with-undo, Library page with tabs, filters, pagination, bulk actions; optimistic updates; sync indicator. *Exit:* write-path unit tests pass; counts from stats are correct after random operations (property-style test).

**Phase 4: TV tracking and History.** Season docs, `markEpisode`, `markSeason`, "mark up to here", auto status transitions, completion celebration, History page with backfill. *Exit:* transactional tests prove counters never drift (including simulated failures mid-write); offline episode toggle syncs after reconnect (e2e).

**Phase 5: Home, Discover, Reviews, Notes, Collections, Calendar.** Each as its own feature slice, each with skeleton, empty and error states. *Exit:* all routes in §7.1 functional; no file over 300 lines.

**Phase 6: Analytics.** Stats aggregation in the write paths, `recomputeStats`, charts, year-in-review, heatmap, accessible table alternatives. *Exit:* recompute equals incremental stats on a seeded dataset.

**Phase 7: PWA and notifications.** Manifest with screenshots, Workbox config, install/update/offline UX, FCM registration, service worker, cron function with dry run, per-user timezone delivery, token pruning. *Exit:* installable, passes Lighthouse PWA, cron dry-run output verified on a seeded emulator dataset.

**Phase 8: Data tools and settings.** Export, import (Letterboxd/CSV/JSON), repair, account deletion, v1 migration doc and script (dry-run default). *Exit:* export then import into a fresh account reproduces identical data.

**Phase 9: Hardening and launch.** Accessibility audit (axe plus manual keyboard and screen-reader pass), performance budget check, security checklist (§14), security headers, README, final e2e suite, production deploy to Vercel plus new Firebase project. *Exit:* every box in §17 ticked.

---

## 17. Definition of done
- [ ] Every feature in §7 works on a 360 px phone and a 1440 px desktop, in both themes, online and offline where specified.
- [ ] `typecheck`, `lint`, `knip`, `test`, `build` all pass with zero errors and zero warnings. No `any`, no `@ts-ignore`, no file > 300 lines.
- [ ] Firestore rules tests, API tests and the e2e suite pass in CI.
- [ ] Lighthouse (mobile) >= 90 in all five categories on `/`, `/library`, `/title/movie:550`.
- [ ] axe finds no serious or critical issues on the main routes; the full keyboard-only flow works.
- [ ] Security checklist (§14) fully ticked, including the bundle grep for secrets.
- [ ] v1's repository, Vercel project, Firebase project and data are untouched.
- [ ] `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/DECISIONS.md` and the README are accurate and complete.

---

## 18. Start now

1. Read this whole document once.
2. Create the repository skeleton and `docs/PROGRESS.md` as a checklist of §16.
3. Execute **Phase 0** only. When its exit criteria pass, print the 5-line summary and continue to Phase 1 without waiting, **unless** you hit an irreversible decision or a requirement that conflicts with another, in which case stop and ask one precise question.
