# UI Consistency Audit: CineTrack v2

This document provides a comprehensive audit of all routes across CineTrack v2 before the UI consistency refactor.
Reference design: **History Page** (`max-width: 1140px`, hero card header with red eyebrow and glow, standardized KPI stat tiles, filter bar with pill tabs, unified cards, and accessible typography).

---

## 1. Route Layout & Component Audit

| Route | Gutter (Left/Right) | Max-Width | Page Title Style | Subtitle Style | Card Style (Bg / Border / Radius / Pad) | Stat Tile Style | Button (Radius / Height) | Filter Control Type | Empty-State Component |
|---|---|---|---|---|---|---|---|---|---|
| **Dashboard** | 16px / 24px (desktop) | None (full width grid, two columns, left + 320px rail) | ~20px bold (var(--font-size-lg)), -0.01em, "Welcome back, {name}" | 13px / var(--font-size-sm), var(--text-2) | #1F1F1F / #1A1A1F, 1px solid var(--border-subtle), 16px radius, 16px/24px pad | Ad-hoc .hp-stat-card (4 columns, 12px radius, icon in 36px circle) | 10px/12px radius, 36px/40px height | Pill tabs / button toggles | Inline .hp-hero-empty with 🍿 emoji |
| **Search** | Centered column, ~24px gutters | 1200px / 1150px (centered column) | NO PAGE TITLE AT ALL (Starts directly with sticky search input) | None | #1F1F1F / #24242C, 12px/16px radius, solid border | None | 9999px radius (pills), 10px radius (category cards) | Dropdown / BottomSheet filter dialogs | Inline search empty container with 🔍 icon |
| **Discover** | 24px from sidebar (padding: var(--space-6) var(--space-4)) | 1400px (full-bleed feel) | ~28px bold, plain text | 14px muted | #1F1F1F, 12px radius, solid border | None | Pills & standard 8px/10px radius buttons | Today / This Week tabs (pill segmented control) | Inline fallback message |
| **Watchlist** | 48px title offset / 24px toolbar band offset | Full width | 24px bold (var(--text-2xl)), -0.5px letter-spacing | 14px muted count label | Dashed border empty boxes & 12px radius card tiles | None | 8px radius (var(--radius-md)), 36px height | Segmented control (Smart View / All by Status) | Dashed outline box with centered text |
| **Watching** | 48px / 24px (padding: 32px 24px !important) | 1400px !important (content ends early) | 24px bold (var(--text-2xl)), -0.5px letter-spacing | 14px muted | Solid 12px radius card tiles | None | 8px radius, native <select> sort dropdown | Movies / TV pill tabs + native <select> sort dropdown floating at ~1640px | Small narrow card with huge wrapping text ("Nothing currently in progress.") |
| **Completed** | 48px title / 24px divider band | Full width | 24px bold (var(--text-2xl)), -0.5px letter-spacing | 14px muted | Solid border cards | Custom right-aligned stats box (3-item row in header) | Pills (9999px) & 8px radius buttons | Timeline / Calendar / List view toggle tabs | Plain centered text |
| **Favorites** | 48px left edge | Full width | 24px bold with red count badge | None | Solid border cards | None | 9999px pill buttons, native <select> sort dropdown | All / Movies / TV pill buttons + native select at far right edge | Plain centered text |
| **Collections** | Centered column, 24px padding | 1140px | Hero card: ~40px bold title, red uppercase eyebrow "CURATED LISTS" | 15px muted | Hero card: 24px radius, blur backdrop, red glow; collection cards: 16px radius | KPI tiles: 16px radius, icon box + bold value | Pill button (9999px radius), 40px height | Pill search and sort controls | Card with icon, title, description, and primary CTA |
| **History (reference)** | Centered column (padding: var(--space-4) var(--space-4) var(--space-12)) | 1140px (margin: 0 auto) | Hero card: 11px uppercase red eyebrow "WATCH JOURNAL", clamp(1.75rem, 3.5vw, 2.5rem) bold title, 13px subtitle | 13px (var(--font-size-sm)), color: var(--text-2) | Hero: 24px radius, soft red glow, border: 1px solid var(--border-subtle); Cards: 16px radius | KPI tiles: 16px radius, 44px icon box, 24px bold stat value, uppercase 11px label | Pill & 10px/12px radius, 36px-44px height, in-card search (44px, 16px radius) | Segmented control (pill tabs with count badges) + pill select + view mode buttons | Card with icon, title, description, and primary CTA |
| **Calendar** | 24px padding (padding: var(--space-6) var(--space-4)) | 1100px (module) / full width (css) | ~30px bold (var(--font-size-2xl)) | 13px / var(--font-size-sm) muted | Solid cards, calendar grid table | None | 8px/10px radius buttons, month/week switcher | Month / Week view toggle + navigation chevron buttons | Empty day agenda text |
| **Reviews** | Centered column, 24px padding | 1140px | Hero card: red uppercase eyebrow "PERSONAL LOG", clamp(1.75rem, 3.5vw, 2.5rem) title | 15px muted | Hero card: 24px radius, soft red glow; review cards: 16px radius | KPI tiles: 16px radius, icon box + bold value | Pill button (9999px radius), 40px height | FilterBar with pill tabs & sort select | Card with icon, title, description, and primary CTA |
| **Notes** | Centered column, 24px padding | 1140px | Hero card: red uppercase eyebrow "THOUGHTS", clamp(1.75rem, 3.5vw, 2.5rem) title | 15px muted | Hero card: 24px radius, soft red glow; note cards: 16px radius | KPI tiles: 16px radius, icon box + bold value | Pill button (9999px radius), 40px height | FilterBar with pill tabs & category select | Card with icon, title, description, and primary CTA |
| **Analytics** | Centered column, 24px padding | 1140px | Hero card: red uppercase eyebrow "INSIGHTS", clamp(1.75rem, 3.5vw, 2.5rem) title | 15px muted | Hero card: 24px radius, soft red glow; chart cards: 16px radius | KPI tiles: 16px radius, icon box + bold value | Pill buttons, time range switcher | Time range pill buttons (All Time, This Year, etc.) | Card with icon, title, description, and primary CTA |
| **Settings** | Centered column (padding: var(--space-6) var(--space-4)) | 900px | 24px bold (var(--font-size-2xl)) | 13px / var(--font-size-sm) muted | Card sections with 16px radius, border: 1px solid var(--border-subtle) | None | 10px radius buttons, danger button variants | Tabs for sections (Account, Appearance, Data, About) | None |
| **Title detail** | 0 padding (edge-to-edge backdrop hero), content container 1100px | 1100px (below backdrop hero) | Backdrop hero title: 32px-48px bold | Tagline & release info | Section cards: 12px/16px radius | Rating / Runtime / Status badges | Action buttons: 10px radius | Seasons accordion tabs | Fallback posters and empty review prompt |
| **Episode tracker** | Centered column (padding: var(--space-6) var(--space-4)) | 1000px | 24px bold (var(--font-size-2xl)) | Progress stats | 16px radius card header & episode cards | Progress bar card | 8px radius check buttons | Season selector tabs | No episodes listed |
| **Login** | Centered auth modal (padding: var(--space-4)) | 440px | 36px bold gradient title (var(--font-size-3xl)) | Muted description | 16px radius (var(--radius-xl)), surface-raised, shadow-3 | None | 12px radius, 44px height primary brand button | None | None |
| **Not found** | Fallback redirect to / (or 404 state) | var(--page-max) | 404 Title (if rendered) | Muted message | Standard card | None | Primary button | None | 404 Not Found card |

---

## 2. Inconsistencies Identified vs History Source of Truth

1. **Layout Systems & Margins:**
   - 3+ different container widths currently exist: Dashboard (~1400px with 320px rail), Discover (1400px), Search (1150px/1200px), Watchlist/Completed/Favorites (full-bleed 100vw), Calendar (1100px), Settings (900px), and History (1140px).
   - Switching pages causes disruptive horizontal layout jumps.
2. **Page Titles & Headers:**
   - Search has **no page title at all** (jumps right into an input).
   - Dashboard has a small greeting `~20px` with tight letter spacing.
   - Watchlist, Watching, Completed, Favorites use plain `24px` bold headings with inconsistent subtext placements.
   - History, Collections, Reviews, Notes, Analytics use the premium History-style glowing hero card.
3. **Empty States:**
   - Watching shows a tiny narrow card with wrapping text.
   - Completed and Favorites use plain unstyled centered text.
   - Watchlist uses dashed-border empty boxes.
   - History uses a proper container card with icon, title, description, and primary CTA.
4. **Controls & Filters:**
   - Watching and Favorites use native unstyled `<select>` dropdowns.
   - Watchlist uses an ad-hoc segmented control.
   - Search shows `⌘K` keyboard shortcut hint instead of `/` (the shortcut that actually works).
   - History uses a unified Pill Segmented Control + Pill Select + View Mode toggle.

---

## 3. Inventory of Unique CSS Values Across `src/**/*.css`

- **Total CSS Files Scanned:** 90
- **Distinct Font Sizes:** 48 unique definitions
- **Distinct Border Radii:** 27 unique definitions
- **Distinct Colors:** 204 unique definitions

### Distinct Font Sizes (Top 25)
| Font Size Value | Occurrences |
|---|---|
| `var(--font-size-sm)` | 102 |
| `var(--font-size-xs)` | 97 |
| `11px` | 63 |
| `12px` | 49 |
| `13px` | 43 |
| `14px` | 33 |
| `10px` | 27 |
| `var(--font-size-base)` | 20 |
| `var(--font-size-xl)` | 13 |
| `var(--font-size-lg)` | 12 |
| `var(--font-size-sm, 14px)` | 12 |
| `var(--font-size-2xl)` | 11 |
| `var(--font-size-3xl)` | 8 |
| `16px` | 8 |
| `22px` | 7 |
| `20px` | 7 |
| `15px` | 7 |
| `18px` | 6 |
| `9px` | 6 |
| `var(--text-xs)` | 6 |
| `clamp(1.75rem, 3.5vw, 2.5rem)` | 5 |
| `var(--font-size-xs, 12px)` | 5 |
| `var(--text-sm)` | 5 |
| `64px` | 4 |
| `var(--font-size-xl, 24px)` | 3 |

### Distinct Border Radii (Top 20)
| Border Radius Value | Occurrences |
|---|---|
| `var(--radius-md)` | 89 |
| `var(--radius-lg)` | 58 |
| `50%` | 46 |
| `var(--radius-pill)` | 45 |
| `var(--radius-sm)` | 44 |
| `var(--radius-pill, 9999px)` | 24 |
| `var(--radius-md, 8px)` | 22 |
| `var(--radius-xl)` | 19 |
| `var(--radius-xs)` | 14 |
| `var(--radius-2xl, 24px)` | 14 |
| `var(--radius-lg, 12px)` | 13 |
| `var(--radius-full)` | 13 |
| `var(--radius-xl, 16px)` | 11 |
| `var(--radius-sm, 4px)` | 6 |
| `var(--radius-sm, 6px)` | 4 |
| `99px` | 4 |
| `2px` | 3 |
| `6px` | 2 |
| `999px` | 2 |
| `var(--radius-2xl)` | 2 |

### Distinct Colors (Top 25)
| Color Value | Occurrences |
|---|---|
| `#ffffff` | 99 |
| `rgba(255, 255, 255, 0.08)` | 33 |
| `#fff` | 32 |
| `#e50914` | 31 |
| `#24242c` | 26 |
| `#71717a` | 25 |
| `#1a1a1f` | 22 |
| `#a1a1aa` | 21 |
| `#2a2c3d` | 20 |
| `#f59e0b` | 17 |
| `rgba(0, 0, 0, 0.5)` | 16 |
| `rgba(255, 255, 255, 0.18)` | 13 |
| `#7c7e93` | 13 |
| `#ef4444` | 12 |
| `rgba(0, 0, 0, 0.6)` | 10 |
| `rgba(255, 255, 255, 0.1)` | 10 |
| `rgba(255, 255, 255, 0.2)` | 10 |
| `rgba(0, 0, 0, 0.4)` | 10 |
| `#141522` | 9 |
| `#38bdf8` | 8 |
| `rgba(0, 0, 0, 0.25)` | 8 |
| `#1a1c28` | 8 |
| `#2a2a2a` | 8 |
| `rgba(229, 9, 20, 0.4)` | 7 |
| `#f40612` | 7 |

---

## 4. Target Tokens to Unify
All routes will strictly use the standardized tokens in `src/shared/styles/tokens.css` and layout primitives in `src/shared/ui/layout/`:
- `--page-max: 1140px;`
- `--page-gutter`: 16px (mobile), 24px (tablet), 32px (desktop)
- Standardized Type Scale: `--fs-eyebrow`, `--fs-page-title`, `--fs-page-sub`, `--fs-section-title`, `--fs-card-title`, `--fs-body`, `--fs-small`, `--fs-stat`
- Standardized Radii: `--radius-card` (16px), `--radius-tile` (12px), `--radius-control` (10px), `--radius-pill` (9999px)
- Unified Hero Glow & Solid Border Cards (no dashed borders).
