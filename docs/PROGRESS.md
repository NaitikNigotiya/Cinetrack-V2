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
- [ ] Atomic write functions: `addToLibrary`, `setStatus`, favourite, rating, remove with 8s undo
- [ ] Library page with tabs (All, Watching, Plan, Completed, On hold, Dropped, Favorites)
- [ ] Filters, sorting, cursor pagination, bulk select
- [ ] Optimistic updates and syncing indicator
- [ ] Exit criteria: write-path tests pass, library counts verified

## Phase 4: TV Tracking & History
- [ ] Per-season docs (`seasons/{seasonNumber}`)
- [ ] `markEpisode`, `markSeason`, "mark up to here" transactions
- [ ] Auto-transition statuses and completion celebration (confetti)
- [ ] History timeline with daily grouping and manual backfill
- [ ] Exit criteria: transactional tests prove zero counter drift, offline sync verified

## Phase 5: Home, Discover, Reviews, Notes, Collections, Calendar
- [ ] Home dashboard (continue watching, plan shortlist, stats strip, surprise me)
- [ ] Discover page (trending, carousels, genre browser, because you liked X)
- [ ] Reviews page with autosaved drafts and spoiler blur
- [ ] Notes page with pinned notes and markdown-lite
- [ ] Collections page (custom lists, drag-and-drop, quick add)
- [ ] Calendar page (planned watches, air dates, timezone-safe date keys)
- [ ] Exit criteria: all routes in §7.1 functional, no file > 300 lines

## Phase 6: Analytics
- [ ] Pre-aggregated stats (`stats/summary`, `stats/monthly_YYYY-MM`)
- [ ] `recomputeStats()` repair function
- [ ] Recharts data visualizations (watch time, top genres, rating distribution, streaks, heatmap)
- [ ] Accessible table alternatives for all charts
- [ ] Exit criteria: recomputed stats match incremental calculations

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
