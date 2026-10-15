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

## Phase 7: PWA & Offline
- [x] PWA manifest (`manifest.webmanifest`) with 192/512/maskable icons, shortcuts, share target, and real screenshots
- [x] Workbox service worker caching strategy (`CacheFirst` for TMDB images 30d, `StaleWhileRevalidate` for API 24h)
- [x] Offline banner, service worker update prompt (`ReloadPrompt.tsx`), and `/offline` fallback route
- [x] Clean deprecation and complete removal of FCM push notifications and hourly cron jobs per ADR-005 (Hobby-tier compatibility)
- [x] Exit criteria: installable PWA generated in build, verified zero bundle secret leakage

## Phase 8: Data Tools & Settings
- [x] Data export (`exportApi.ts` for full JSON backup, Library CSV, and Watch History CSV)
- [x] Data import wizard (`ImportWizardDialog.tsx`) with auto-format detection (Letterboxd `watched.csv`/`ratings.csv`, CineTrack JSON)
- [x] Chunked atomic Firestore writes and automatic post-import `recomputeStats()`
- [x] Settings page (`SettingsPage.tsx`) with tabs: Account, Appearance, Library, Data, About
- [x] Account deletion with typed confirmation (`DELETE`) and cascading cleanup
- [x] v1 migration documentation and dry-run script (`scripts/migrate-v1.md`, `scripts/migrate-v1.cjs`)
- [x] Exit criteria: round-trip export/import verified, 100% unit tests pass (`importParsers.test.ts`)

## Phase 9: Hardening & Launch
- [x] Accessibility audit (WCAG 2.2 AA compliant, skip-to-content links, visible focus outlines, full keyboard navigation, accessible tables for charts)
- [x] Performance budget check (LCP < 2.5s, code-splitting, sub-second Oxlinting, fast asset precaching)
- [x] Security checklist completed (zero bundle secrets verified via grep audit, strict security headers in `vercel.json`, multi-tenant Firestore security rules)
- [x] Comprehensive documentation (`README.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/DECISIONS.md`) with TMDB attribution
- [x] Vercel serverless deployment and Firebase multi-tab persistence readiness
- [x] Exit criteria: all 10 phases completed, unit tests passing, zero lint warnings, zero type errors
