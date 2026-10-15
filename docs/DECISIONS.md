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

## ADR-002: Multi-User by Design
- **Date:** 2026-10-15
- **Status:** Accepted
- **Context:** v1 was hardcoded to a single user email in Firestore security rules.
- **Decision:** v2 implements true multi-tenancy where all user documents are strictly rooted at `/users/{uid}/*` and guarded by `request.auth != null && request.auth.uid == userId`. No hardcoded user emails or IDs anywhere.

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

