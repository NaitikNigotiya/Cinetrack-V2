# CineTrack v2 — Codebase Cleanup Report

> Generated: 2026-10-20  
> Branch: `chore/cleanup`  
> Git Baseline: `5b10cf6e3557e84988716f9f3ea35235bf66e3eb`  
> Purpose: Audit and plan for removing dead files, unused exports, dead code, unused dependencies, and feature leftovers while preserving 100% of existing behavior.

---

## Executive Summary & Metrics

| Category | Count Identified | Proposed Action |
| :--- | :---: | :--- |
| **Unused Files (Dead Components & Modules)** | 32 TS/TSX + 22 Module CSS | 30 Delete (Low Risk), 2 Ask / Keep (Data Tools) |
| **Unused Dependencies (Runtime & Dev)** | 4 packages | 3 Delete (`date-fns`, `framer-motion`, `@testing-library/user-event`), 1 Ask (`@firebase/rules-unit-testing`) |
| **Unused Exports & Dead Functions** | 13 functions/constants | 12 Delete / Prune `export`, 1 Keep (`ConfirmDialog` UI primitive) |
| **Unused CSS Selectors** | 2 selectors + 22 dead module CSS files | Delete dead selectors and orphaned module CSS |
| **Feature Leftovers (Push Notifications)** | 1 card + 3 dummy settings toggles | Delete notification card and unused state |
| **Circular Dependencies (`madge`)** | 0 | Verified: Clean (`√ No circular dependency found!`) |
| **TypeScript / Lint / Test Baseline** | 0 errors | All 23 test suites (166 tests) pass; build clean |

---

## Baseline Verification Snapshot

Recorded in `docs/cleanup/baseline.txt`:
- **`npm run typecheck`**: 0 errors.
- **`npm run lint`** (`oxlint`): 0 errors, 28 warnings across 271 files.
- **`npm test`** (`vitest run`): 23 test files passed, 166 tests passed.
- **`npm run build`**:
  - `dist/index.html`: 2.07 kB (gzip: 0.95 kB)
  - `dist/assets/index-CUNboW3_.css`: 181.26 kB (gzip: 30.01 kB)
  - `dist/assets/index-CheibKoF.js`: 1,861.72 kB (gzip: 539.73 kB)
  - PWA precache: 12 entries (2026.85 KiB)
- **`npm run check:ui-guardrails`**: 0 dashed borders, 0 unauthorized container max-widths.
- **Playwright smoke test** (`scripts/verify_ui_fixes.cjs`): All 4 test phases + mobile viewport passed.

---

## 1. Unused Files

### 1.1 Dead Components, Helpers & Modals (Low Risk — Safe to Delete)

| # | Path | Reason | Evidence | Risk | Decision |
| :- | :--- | :--- | :--- | :-: | :-: |
| 1 | `src/features/analytics/components/analyticsData.ts` | Old ad-hoc statistics calculations | Zero imports; replaced by `src/domain/selectors.ts` | Low | **Delete** |
| 2 | `src/features/analytics/lib/genresHelper.ts` | Old duplicate static genre ID lookup | Zero imports; active normalizer in `src/services/tmdb/normalize/genres.ts` | Low | **Delete** |
| 3 | `src/features/calendar/components/AddPlannedWatchDialog.tsx` & `.module.css` | Superseded dialog | Only imported by dead `TitleActionBar.tsx`; Calendar uses `CalendarAddModal.tsx` | Low | **Delete** |
| 4 | `src/features/collections/components/CollectionCard.tsx` & `.module.css` | Superseded card | Zero imports; Collections uses `CollectionListSections.tsx` | Low | **Delete** |
| 5 | `src/features/collections/components/CollectionDialog.tsx` & `.module.css` | Superseded collection modal | Zero imports; Collections uses `CollectionModals.tsx` | Low | **Delete** |
| 6 | `src/features/collections/components/QuickAddToCollectionDialog.tsx` & `.module.css` | Superseded modal | Only imported by dead `TitleActionBar.tsx` | Low | **Delete** |
| 7 | `src/features/discover/constants/genres.ts` | Unused duplicate genre constant | Zero imports; Discover uses `genresList.ts` | Low | **Delete** |
| 8 | `src/features/home/components/ComingUpSection.tsx` & `.module.css` | Superseded home section | Zero imports; HomePage uses `DashboardRails.tsx` | Low | **Delete** |
| 9 | `src/features/home/components/ContinueWatchingSection.tsx` & `.module.css` | Superseded home section | Zero imports; HomePage uses `DashboardHeroWatching.tsx` | Low | **Delete** |
| 10 | `src/features/home/components/HomeStatsStrip.tsx` & `.module.css` | Superseded stats strip | Zero imports; HomePage uses shared `StatRow` and `StatTile` | Low | **Delete** |
| 11 | `src/features/home/components/PlanShortlistSection.tsx` & `.module.css` | Superseded shortlist section | Zero imports; HomePage uses `DashboardAside.tsx` | Low | **Delete** |
| 12 | `src/features/home/components/SurpriseMeDialog.tsx` & `.module.css` | Superseded dialog | Only imported by dead `PlanShortlistSection.tsx` | Low | **Delete** |
| 13 | `src/features/notes/components/MarkdownLite.tsx` | Superseded markdown renderer | Only imported by dead `NoteCard.tsx` and `NoteDialog.tsx` | Low | **Delete** |
| 14 | `src/features/notes/components/NoteCard.tsx` & `.module.css` | Superseded note card | Zero imports; NotesPage uses `NoteItemCard.tsx` | Low | **Delete** |
| 15 | `src/features/notes/components/NoteDialog.tsx` & `.module.css` | Superseded note editor | Zero imports; NotesPage uses `NoteEditorModal.tsx` | Low | **Delete** |
| 16 | `src/features/reviews/components/ReviewCard.tsx` & `.module.css` | Superseded review card | Zero imports; ReviewsPage uses `ReviewItemCard.tsx` | Low | **Delete** |
| 17 | `src/features/reviews/components/ReviewDialog.tsx` & `.module.css` | Superseded review modal | Only imported by dead `TitleActionBar.tsx`; ReviewsPage uses `ReviewEditorModal.tsx` | Low | **Delete** |
| 18 | `src/features/search/hooks/useSearch.ts` | Unused hook | Zero imports; SearchPage handles state & query directly | Low | **Delete** |
| 19 | `src/features/settings/components/AboutSection.tsx` & `.module.css` | Superseded settings section | Zero imports; SettingsPage uses card primitives | Low | **Delete** |
| 20 | `src/features/settings/components/AccountSection.tsx` & `.module.css` | Superseded settings section | Zero imports; SettingsPage uses `SettingsAccountCard.tsx` | Low | **Delete** |
| 21 | `src/features/settings/components/AppearanceSection.tsx` & `.module.css` | Superseded settings section | Zero imports; SettingsPage uses `SettingsAppearanceCard.tsx` | Low | **Delete** |
| 22 | `src/features/settings/components/LibrarySettingsSection.tsx` & `.module.css` | Superseded settings section | Zero imports; SettingsPage uses `SettingsGeneralCard.tsx` | Low | **Delete** |
| 23 | `src/features/title/components/CastSection.tsx` | Superseded cast component | Zero imports; TitleDetailPage uses `TitleCastTab.tsx` | Low | **Delete** |
| 24 | `src/features/title/components/TitleActionBar.tsx` & `.module.css` | Superseded action bar | Zero imports; TitleDetailPage triggers actions in header | Low | **Delete** |
| 25 | `src/features/title/components/TitleCast.tsx` | Superseded cast component | Zero imports; TitleDetailPage uses `TitleCastTab.tsx` | Low | **Delete** |
| 26 | `src/features/title/components/TitleHero.tsx` & `.module.css` | Superseded hero component | Zero imports; TitleDetailPage uses `TitleHeroBanner.tsx` | Low | **Delete** |
| 27 | `src/features/title/components/TitleTrailerModal.tsx` | Superseded trailer modal | Zero imports; TitleDetailPage uses shared `TrailerModal.tsx` | Low | **Delete** |
| 28 | `src/features/title/components/TitleWatchProviders.tsx` | Superseded provider component | Zero imports; TitleOverviewTab renders providers directly | Low | **Delete** |
| 29 | `src/features/title/components/TvSeasonsAccordion.tsx` & `.module.css` | Superseded season component | Zero imports; episode tracking is on route `/title/:titleKey/episodes` | Low | **Delete** |
| 30 | `src/features/collections/components/smartCollections.ts` | Duplicate of `src/domain/smartCollections.ts` | Compute function unused; point callers' type imports to domain and delete | Low | **Delete** |

### 1.2 Data Tools & Import/Export Code (High Risk — Under Rule 4)

| Path | Reason | Evidence | Risk | Decision |
| :--- | :--- | :--- | :-: | :-: |
| `src/features/dataTools/export/exportApi.ts` | Multi-collection export utilities (`exportCinetrackJson`, CSV exports) | Only imported by `DataToolsSection.tsx` (currently unmounted in SettingsPage) | High | **Ask** (Keep or wire into Settings) |
| `src/features/dataTools/import/components/ImportWizardDialog.tsx` & `.module.css` | Import wizard dialog | Only imported by `DataToolsSection.tsx` | High | **Ask** (Keep or wire into Settings) |
| `src/features/settings/components/DataToolsSection.tsx` & `.module.css` | Data tools section wrapper | Unmounted in SettingsPage; contains export & import wizard buttons | High | **Ask** (Keep or wire into Settings) |

---

## 2. Unused Dependencies

| Package | Type | Why It Looks Unused | Real Status / Evidence | Risk | Decision |
| :--- | :-: | :--- | :--- | :-: | :-: |
| `date-fns` | `dependency` | Never imported in any `.ts`, `.tsx`, or `.cjs` file | Completely unreferenced across all application code. Dates are formatted with native `Intl` and domain helpers. | Low | **Delete** |
| `framer-motion` | `dependency` | Never imported in any `.ts`, `.tsx`, or `.cjs` file | Completely unreferenced. Dead package in `package.json`. | Low | **Delete** |
| `@testing-library/user-event` | `devDependency` | Never imported in any test file | All 23 tests use `@testing-library/react` directly. | Low | **Delete** |
| `@firebase/rules-unit-testing` | `devDependency` | `firestoreRules.test.ts` uses raw string evaluation & vitest | Emulator test runs without importing this package. | Medium | **Ask** (Keep or delete) |

### Confirmed Kept Dependencies (Essential at Runtime / Verification)
- **`firebase-admin`**: KEPT. Actively used in `api/_lib/admin.ts` to verify ID tokens for single-owner security in the TMDB proxy.
- **`playwright`**: KEPT. Actively used in `scripts/verify_ui_fixes.cjs` for smoke testing.
- **`vite-plugin-pwa`**: KEPT. Generates service worker and PWA manifest.
- **`canvas-confetti`, `clsx`, `lucide-react`, `recharts`, `zod`, `zustand`**: KEPT. Core runtime dependencies.

---

## 3. Unused Exports & Dead Code

| Export | File | Reason | Risk | Decision |
| :--- | :--- | :--- | :-: | :-: |
| `getCurrentYear` | `src/domain/date.ts` | Unused helper function | Low | **Delete export** |
| `setPriority` | `src/domain/operations.ts` | Unused library operation | Low | **Delete export** |
| `CANONICAL_STATUSES`, `isValidCanonicalStatus` | `src/domain/status.ts` | Unused status helpers | Low | **Delete exports** |
| `export default AnalyticsPage` | `src/features/analytics/components/AnalyticsPage.tsx` | Duplicate export (`router.tsx` uses named export `{ AnalyticsPage }`) | Low | **Delete default export** |
| `formatWatchDate`, `formatMinutes` | `src/features/history/components/historyData.ts` | Unused legacy formatters | Low | **Delete exports** |
| `MOVIE_QUOTES`, `MOOD_GENRES` | `src/features/home/hooks/useDashboardData.ts` | Exported constants only used inside this hook file | Low | **Remove `export` keyword** |
| `COLOR_PALETTE` | `src/features/notes/components/NoteEditorModal.tsx` | Exported constant only used inside this modal | Low | **Remove `export` keyword** |
| `resolveImdbId` | `src/features/search/lib/searchResolver.ts` | Unused resolver helper | Low | **Delete export** |
| `ConfirmDialog` | `src/shared/ui/Dialog/ConfirmDialog.tsx` | Shared UI primitive | Medium | **Keep** (Design system primitive) |

---

## 4. Unused CSS & Assets

| Item / Path | Reason | Evidence | Risk | Decision |
| :--- | :--- | :--- | :-: | :-: |
| `.sp-advanced-toggle`, `.sp-chevron-up` in `src/features/search/components/SearchPage.css` | Leftovers from removed advanced filters section | Zero occurrences in JSX/TSX | Low | **Delete** |
| 22 `.module.css` files paired with dead components (e.g. `TitleHero.module.css`, `NoteCard.module.css`, etc.) | Orphaned CSS modules | Scoped to dead components; zero external imports | Low | **Delete with components** |
| Design system tokens (`src/shared/styles/tokens.css`) | Curated design tokens | Explicitly preserved per ground rules | Low | **Keep** |

---

## 5. Leftover Features (Push Notifications & Cron)

| Feature / Artifact | Location | Evidence | Risk | Decision |
| :--- | :--- | :--- | :-: | :-: |
| Notifications Card UI | `src/features/settings/components/SettingsDataCard.tsx` (lines 74–114) | Renders Push Notifications, Episode Alerts, Weekly Recap toggles | Low | **Delete card** |
| Notification State & Handlers | `src/features/settings/components/SettingsPage.tsx` | `notificationsEnabled`, `episodeAlerts`, `weeklyRecap` state | Low | **Delete state & props** |
| Service Worker Push Handlers | `src/sw.ts` or service worker | Confirmed: Zero push handlers in service worker or client | — | **Already Clean** |
| Cron endpoints | `api/cron/*` and `vercel.json` | Confirmed: Zero cron endpoints or `crons` config in `vercel.json` | — | **Already Clean** |

---

## 6. Junk Files & Artifacts

| Item | Location | Evidence | Risk | Decision |
| :--- | :--- | :--- | :-: | :-: |
| `.gitignore` tightening | `.gitignore` | Prevent accidental commits of OS/backup/lock files | Low | **Update `.gitignore`** with `*.bak`, `*.orig`, `*.zip`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb` |
| `scripts/capture_before*.cjs`, `scripts/capture_after.cjs` | `scripts/` | Ad-hoc screenshot scripts from previous tasks | Medium | **Ask** (Keep or delete) |
| `scripts/fix-statuses.ts` | `scripts/` | Data migration utility from data consistency task | Medium | **Ask** (Keep or delete) |
| `scripts/migrate-v1.*` | `scripts/` | V1 migration script | High | **Keep** (Rule 4: Do not touch v1) |

---

## 7. "Needs My Decision" List (Awaiting User Direction)

1. **Data Tools & Import Wizard (`exportApi.ts`, `ImportWizardDialog.tsx`, `DataToolsSection.tsx`)**:
   - `SettingsPage.tsx` currently has an inline `handleExport` that downloads library JSON.
   - `DataToolsSection.tsx` has the full multi-collection export and the Import Wizard (`ImportWizardDialog.tsx`).
   - *Recommendation:* Keep `exportApi.ts` and `ImportWizardDialog.tsx` intact so data backup and import remains available, or wire `ImportWizardDialog` into `SettingsDataCard`. Do you want them deleted or kept?
2. **`@firebase/rules-unit-testing` devDependency**:
   - `src/tests/firestoreRules.test.ts` executes in Vitest by reading `firestore.rules` and asserting rule semantics without loading the emulator library.
   - *Recommendation:* Keep or remove from `devDependencies`?
3. **Ad-hoc helper scripts in `scripts/`**:
   - `capture_before.cjs`, `capture_after.cjs`, `capture_before_ui.cjs`, and `fix-statuses.ts`.
   - *Recommendation:* Keep in `scripts/` as development utilities, or delete?
4. **`ConfirmDialog` shared primitive**:
   - Reusable dialog in `src/shared/ui/Dialog/ConfirmDialog.tsx`.
   - *Recommendation:* Keep as a shared UI component for future dialogs.
