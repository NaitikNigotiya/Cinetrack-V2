# CineTrack v2: Progress Log

Mirroring Section 16 of `CINETRACK_V2_MASTER_PROMPT.md`.

## Phase 0: Foundations
- [x] Tooling, strict TypeScript, lint, knip, Vitest
- [x] CSS token layer (`tokens.css`, `base.css`, `motion.css`) with light & dark theme support
- [x] Theme bootstrap script in `index.html` preventing theme flash
- [x] Shared UI primitives in `src/shared/ui/` (Button, Input, Dialog, Toast, Skeleton, Tabs, PosterCard, RatingControl)
- [x] `/_ui` playground route in development
- [x] Exit criteria: `typecheck`, `lint`, `test`, `build` green; both themes verified; contrast verified

## Phase 1: Backend Skeleton and Auth
- [x] Firebase initialization with offline persistence and emulator support
- [x] Zod schemas and typed Firestore converters for all documents
- [x] `firestore.rules` and `firestore.indexes.json`
- [x] Rules & schema unit tests
- [x] Google & Email auth providers + password reset
- [x] `AuthGate` & onboarding flow
- [x] App shell (desktop responsive sidebar, mobile bottom tab bar, keyboard shortcuts)
- [x] Exit criteria: sign up/in/out working, rules & schemas validated, build green

## Phase 2: TMDB Proxy, Search, Title Detail
- [x] TMDB proxy with auth verification, route allow-list, rate-limiting, short caching (`api/tmdb/[...path].ts`)
- [x] Typed TMDB client in `src/services/tmdb/` with Zod validation
- [x] Search page (debounced multi-search, recent searches, quick add)
- [x] Title detail page (hero backdrop, cast, trailers modal, streaming providers, recommendations)
- [x] Exit criteria: zero TMDB secrets in client bundle (verified: 0 matches in `dist/` and `src/`), search and detail fully functional

## Phase 3: Library & Atomic Write Paths
- [x] Atomic write functions: `addToLibrary`, `setStatus`, favourite, rating, remove with 8s undo (`src/features/library/api/libraryApi.ts`)
- [x] Library page with tabs (All, Watching, Plan, Completed, On hold, Dropped, Favorites)
- [x] Filters, sorting, cursor pagination, query caching
- [x] Optimistic updates and syncing indicator
- [x] Exit criteria: write-path tests pass (26 tests total), library counts verified via `stats/summary`

## Phase 4: TV Tracking & History
- [x] Per-season docs (`seasons/{seasonNumber}`)
- [x] `markEpisode`, `markSeason`, "mark up to here" transactions
- [x] Auto-transition statuses and completion celebration (confetti)
- [x] History timeline with daily grouping and manual backfill
- [x] Exit criteria: transactional tests prove zero counter drift, offline sync verified

## Phase 5: Home, Discover, Reviews, Notes, Collections, Calendar
- [x] Home dashboard (continue watching, plan shortlist, stats strip, surprise me)
- [x] Discover page (trending, carousels, genre browser, because you liked X)
- [x] Reviews page with autosaved drafts and spoiler blur
- [x] Notes page with pinned notes and markdown-lite
- [x] Collections page (custom lists, drag-and-drop, quick add)
- [x] Calendar page (planned watches, air dates, timezone-safe date keys)
- [x] Exit criteria: all routes in §7.1 functional, no file > 300 lines

## Phase 6: Analytics
- [x] Pre-aggregated stats (`stats/summary`, `stats/monthly_YYYY-MM`)
- [x] `recomputeStats()` repair function (fixes D4 counter drift atomically)
- [x] Timezone-safe streak calculation with 100% unit tests
- [x] Recharts data visualizations (WatchTimeChart, TopGenresChart, RatingDistributionChart, DecadeDistributionChart)
- [x] 16-week ActivityHeatmap with color intensity levels
- [x] Year in Review highlight summary selector
- [x] Accessible HTML `<table>` alternatives for every chart with live toggle
- [x] Exit criteria: recompute equals incremental stats on source-of-truth documents

## Phase 7: PWA & Notifications
- [ ] PWA manifest with icons and real screenshots
- [ ] Workbox service worker caching strategy
- [ ] Push notification subscription in Settings (`settings/push.tokens`)
- [ ] Daily Vercel cron handler (`api/cron/new-releases.ts`) with `CRON_SECRET`
- [ ] Offline banner & update reload toast
- [ ] Exit criteria: installable PWA, Lighthouse PWA score >= 90

## Phase 8: Data Tools & Settings
- [ ] Data export (JSON & CSV)
- [ ] Data import (Letterboxd CSV, CineTrack JSON, generic CSV)
- [ ] Settings page (Account, Appearance, Library, Notifications, Data, About)
- [ ] Account deletion (cascading server-side cleanup)
- [ ] v1 migration documentation and dry-run script
- [ ] Exit criteria: round-trip export/import produces identical data

## Phase 9: Hardening & Launch
- [ ] Accessibility audit (WCAG 2.2 AA, keyboard flows, axe check)
- [ ] Performance budget check (LCP < 2.5s, bundle < 180KB initial)
- [ ] Security checklist completed (no bundle secrets, headers in vercel.json)
- [ ] Comprehensive README with architecture diagrams and TMDB attribution
- [ ] Vercel and Firebase production readiness
