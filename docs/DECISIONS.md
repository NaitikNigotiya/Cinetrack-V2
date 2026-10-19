# CineTrack v2: Architectural & Product Decisions

Record of non-obvious technical and design choices, reasons, and trade-offs.

## ADR-001: Styling System — CSS Modules + Pure CSS Custom Properties Design Tokens
- **Date:** 2026-10-15
- **Status:** Accepted
- **Context:** Section 3 states: "Tailwind CSS v4 or CSS Modules; pick one in Phase 0, record in DECISIONS.md, use it everywhere. Tokens live in one CSS file."
- **Decision:** We use Vanilla CSS Modules with a unified design-token system in `src/shared/styles/tokens.css` (semantic CSS custom properties for surfaces, text, borders, brand, and status colors across light and dark themes).
- **Reason:**
  1. Complete adherence to our rich web application design guidelines (bespoke cinematic dark/light theme, custom glassmorphism, exact 4.5:1 WCAG AA contrast).
  2. Zero build-time or runtime Tailwind v4/React 19 compatibility quirks.
  3. Strict scoping with scoped `.module.css` for component-specific styles and global design tokens for consistency.
  4. Minimal JS bundle overhead and maximum rendering performance.

## ADR-002: Multi-User by Design (Superseded)
- **Date:** 2026-10-15
- **Status:** Superseded by ADR-006
- **Context:** Initial design explored multi-tenancy.
- **Superseded:** Replaced by private single-owner architecture.

## ADR-006: Single-Owner App Architecture
- **Date:** 2026-10-19
- **Status:** Accepted (Supersedes ADR-002)
- **Decision:** Single-owner app: access restricted to one Google account by Firestore rules + API check; multi-user, sharing and sign-up removed.
- **Architecture & Security Model (Defense in Depth):**
  1. **Firestore Rules (Real Lock):** The helper `isOwner()` strictly requires `request.auth != null && request.auth.token.email_verified == true && request.auth.token.email.lower() == 'nigotiyanaitik@gmail.com'`. User documents require `isOwner() && request.auth.uid == userId`. Public collections rules removed; default deny on all other paths.
  2. **API Proxy Lock:** `/api/tmdb` validates Firebase ID token via Admin SDK and rejects with `403 FORBIDDEN` unless `decoded.email_verified === true` and `decoded.email.toLowerCase() === process.env.OWNER_EMAIL.toLowerCase()`. Never logs tokens or emails.
  3. **Client AuthGate UX:** Compares signed-in email to `VITE_OWNER_EMAIL`. If non-owner, immediately signs out, purges TanStack Query and IndexedDB caches, and presents a clear "This is a private app. Access denied." screen with a "Use a different account" button.
  4. **Sign-In Methods:** Google ONLY. Removed email/password, sign-up, password reset, and multi-step onboarding modals.
  5. **Auto-Initialization:** Owner's profile and default preferences are auto-created in Firestore on first login and proceed directly to dashboard.
  6. **Zero Indexing:** Blocked from search engines via `<meta name="robots" content="noindex, nofollow">` and `public/robots.txt`.


## ADR-003: Canonical Title Keys (`movie:123` / `tv:456`)
- **Date:** 2026-10-15
- **Status:** Accepted
- **Context:** We need unambiguous document IDs and route parameters for media across movies and TV shows.
- **Decision:** All media documents use `${type}:${tmdbId}` as the primary key. Helpers `parseTitleKey` and `makeTitleKey` strictly parse and generate these keys throughout the application.

## ADR-004: Atomic Firestore Writes & Denormalized Counters
- **Date:** 2026-10-15
- **Status:** Accepted
- **Context:** In v1, separate `addDoc` and `updateDoc` calls caused counter drift on partial network failures.
- **Decision:** Every mutation updating related documents (e.g. marking an episode watched + logging history + incrementing stats) runs within a single Firestore `writeBatch` or `runTransaction`. Repair functions (`recomputeTitle`, `recomputeStats`) are provided to ensure self-healing if needed.

## ADR-005: Push notifications and cron removed
- **Date:** 2026-10-15
- **Status:** Accepted
- Push notifications and cron removed: not needed, Vercel Hobby only supports daily crons.

## ADR-007: Single Source of Truth & Pure Derived Stats
- **Date:** 2026-10-19
- **Status:** Accepted (Supersedes denormalized stats counters in ADR-004)
- **Decision:** Stats are derived from library + history with memoized selectors; `stats/*` docs removed; single owner, small data.
- **Context & Architecture:**
  1. **Single Owner, Small Data Scale:** CineTrack v2 is a single-owner personal tracking app with at most a few thousand titles. Pre-aggregating counters into separate `users/{uid}/stats/*` documents introduced state drift, counter mismatch bugs, and inconsistent displays across pages.
  2. **Single Real-time Subscription:** The app shell maintains top-level real-time `onSnapshot` listeners to `users/{uid}/library`, `users/{uid}/history`, `users/{uid}/collections`, and `users/{uid}/plannedWatches`, feeding into a central reactive store. No page executes its own standalone query for the same data.
  3. **Pure Domain Selectors:** All stats, counters, streaks, analytics series, watching/completed lists, and smart collections are calculated through pure, memoized domain selectors in `src/domain/selectors.ts` and `src/domain/smartCollections.ts`.
  4. **Atomic Operations:** Library status transitions, history event logging, and favorite/rating updates are committed together via Firestore `writeBatch` with optimistic store updates and self-healing repair (`recomputeLibraryEntry`).


