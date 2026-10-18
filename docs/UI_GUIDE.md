# CineTrack v2: UI Architecture & Design System Guide

> Visual Reference: **The History Page** (`src/features/history/components/HistoryPage.tsx`)  
> Canonical Container Width: **`--page-max: 1140px`**  
> Rule: **Every page in CineTrack v2 must use `<PageShell>` and `<PageHeader>`.**

---

## 1. Architectural Principles

1. **One Page Shell**: Every route wraps its primary content in `<PageShell>`. No page may define its own outer margin, custom gutters, or independent max-widths.
2. **One Header Pattern**: Every route begins with `<PageHeader>`, the glowing hero card modeled directly after History. Every route contains exactly one `<h1>`.
3. **No Dashed Borders**: All containers, dropzones, action cards, and empty states use solid borders (`var(--border-card)` or `var(--border-subtle)`).
4. **Token-Only Styling**: No raw `px` values for typography scale or container margins. All font sizes, line heights, radii, and surfaces are defined in `src/shared/styles/tokens.css`.
5. **Component Limits**: Keep all code files <= 300 lines, strictly typed, with both dark and light theme tokens supported.

---

## 2. Design Tokens (`src/shared/styles/tokens.css`)

### 2.1 Layout & Containers
```css
--page-max: 1140px;            /* Single canonical content width for all pages */
--page-gutter: 24px;           /* Mobile left/right gutter */
--page-gutter-md: 32px;        /* Tablet gutter (>= 768px) */
--page-gutter-lg: 40px;        /* Desktop gutter (>= 1200px) */
--page-pad-top: 32px;          /* Top offset under navbar */
--page-pad-bottom: 64px;       /* Bottom offset above mobile tab bar */
--section-gap: 32px;           /* Vertical gap between page sections */
--card-gap: 16px;              /* Gap between cards in grids and rows */
```

### 2.2 Typography Scale
```css
--fs-eyebrow: 11px;            /* Uppercase, accent color, letter-spacing: 0.14em, weight 800 */
--fs-page-title: clamp(28px, 3.5vw, 40px); /* Hero title, weight 900, tight line-height */
--fs-page-sub: 15px;           /* Hero subtitle, muted text */
--fs-section-title: 20px;       /* Section headings ("Recently Added", "Format & Genres") */
--fs-card-title: 16px;          /* Title inside cards and list rows */
--fs-body: 15px;               /* Main body copy */
--fs-small: 13px;              /* Secondary labels, metadata */
--fs-stat: 28px;               /* Big numeric values in StatTile */
--fs-stat-label: 11px;         /* Uppercase muted label in StatTile */
--lh-tight: 1.15;
--lh-body: 1.5;
```

### 2.3 Shapes & Radii
```css
--radius-hero: 24px;           /* Glowing hero card */
--radius-card: 16px;           /* Cards, dialogs, poster wrappers */
--radius-tile: 12px;           /* Stat tiles, inputs, popovers */
--radius-control: 10px;        /* Buttons, selects, action items */
--radius-pill: 9999px;         /* Filter pills, status badges, chips */
```

### 2.4 Surfaces & Glows
```css
--surface-page: #141414;       /* App background */
--surface-card: #1A1A1A;       /* Standard card background */
--surface-card-hover: #222222; /* Card hover lift state */
--border-card: 1px solid rgba(255, 255, 255, 0.08); /* SOLID border */
--shadow-hero-glow: 0 8px 32px -8px rgba(0, 0, 0, 0.5); /* Hero soft shadow */
```

---

## 3. Shared Layout Primitives (`src/shared/ui/layout/`)

### 3.1 `<PageShell>`
The outermost layout container for every page. Center-aligned, padded, capped at 1140px.

```tsx
import { PageShell } from '@/shared/ui/layout/PageShell'

export function ExamplePage() {
  return (
    <PageShell>
      {/* Page content */}
    </PageShell>
  )
}
```

*Dashboard Rail Option:*
```tsx
<PageShell aside={<DashboardAside />}>
  {/* Main 2-column layout that collapses gracefully under 1100px */}
</PageShell>
```

---

### 3.2 `<PageHeader>`
The glowing hero card derived from History. Renders the page's single `<h1>`.

```tsx
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button/Button'
import { Plus } from 'lucide-react'

<PageHeader
  eyebrow="WATCH JOURNAL"
  title="Viewing History"
  subtitle="Timeline of everything you've watched, rated, and logged."
  actions={
    <Button variant="primary" icon={<Plus size={16} />} onClick={handleLog}>
      Log Past Watch
    </Button>
  }
  meta={<span>142 titles logged</span>}
>
  {/* Optional in-card search field or controls */}
  <SearchField value={search} onChange={setSearch} placeholder="Search journal..." />
</PageHeader>
```

---

### 3.3 `<StatRow>` & `<StatTile>`
Uniform statistics tiles. 4 columns on desktop, 2 on tablet, 2 on mobile.

```tsx
import { StatRow } from '@/shared/ui/layout/StatRow'
import { StatTile } from '@/shared/ui/layout/StatTile'
import { Film, Clock, Star, Flame } from 'lucide-react'

<StatRow columns={4}>
  <StatTile icon={<Film size={20} />} value="142" label="Titles Watched" />
  <StatTile icon={<Clock size={20} />} value="284h" label="Hours Streamed" />
  <StatTile icon={<Star size={20} />} value="8.4" label="Avg Rating" />
  <StatTile icon={<Flame size={20} />} value="12" label="Day Streak" />
</StatRow>
```

---

### 3.4 `<Section>`
Standard section block with title and optional action link.

```tsx
import { Section } from '@/shared/ui/layout/Section'

<Section title="Continue Watching" action={{ label: 'View all →', onClick: () => navigate('/watching') }}>
  {/* Carousel or grid */}
</Section>
```

---

### 3.5 `<Card>`
Solid border, rounded corners, subtle glass surface. Never dashed.

```tsx
import { Card } from '@/shared/ui/layout/Card'

<Card variant="default">
  <p>Standard card content</p>
</Card>

<Card variant="interactive" onClick={handleClick}>
  <p>Interactive card with hover lift and focus ring</p>
</Card>
```

---

### 3.6 `<FilterBar>`
Pill tabs with counts on the left; sort dropdown and view toggle on the right.

```tsx
import { FilterBar } from '@/shared/ui/layout/FilterBar'

<FilterBar
  tabs={[
    { key: 'all', label: 'All', count: 120 },
    { key: 'movies', label: 'Movies', count: 80 },
    { key: 'tv', label: 'TV Shows', count: 40 },
  ]}
  activeTab={tab}
  onTabChange={setTab}
  sortOptions={[
    { key: 'newest', label: 'Recently Added' },
    { key: 'rating', label: 'Highest Rated' },
  ]}
  activeSort={sort}
  onSortChange={setSort}
/>
```

---

### 3.7 `<EmptyStateCard>`
Centered, generous empty card that spans the full container width.

```tsx
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'
import { Button } from '@/shared/ui/Button/Button'

<EmptyStateCard
  icon="🍿"
  title="Your watchlist is empty"
  description="Explore trending films and add titles you want to watch next."
  action={<Button variant="primary" onClick={() => navigate('/discover')}>Discover Titles</Button>}
/>
```

---

### 3.8 `<PosterGrid>` & `<PosterCard>`
Responsive 2:3 poster grid (`repeat(auto-fill, minmax(150px, 1fr))`).

```tsx
import { PosterGrid } from '@/shared/ui/layout/PosterGrid'
import { PosterCard } from '@/shared/ui/PosterCard/PosterCard'

<PosterGrid>
  {titles.map((t) => (
    <PosterCard
      key={t.id}
      title={t.title}
      year={t.year}
      posterPath={t.posterPath}
      rating={t.rating}
      onClick={() => navigate(`/title/${t.key}`)}
    />
  ))}
</PosterGrid>
```

---

## 4. Visual Anatomy of the Reference Page (History)

```
┌────────────────────────────────────────────────────────────────────────┐  ▲
│ <PageShell> (--page-max: 1140px, centered, padding: 32px 40px 64px)    │  │
│                                                                        │  │
│ ┌────────────────────────────────────────────────────────────────────┐ │  │
│ │ <PageHeader> (--radius-hero: 24px, solid border, soft red glow)   │ │  │
│ │                                                                    │ │  │
│ │ WATCH JOURNAL (eyebrow, --fs-eyebrow: 11px, accent red, 800)       │ │  │
│ │ Viewing History (h1, --fs-page-title: 40px, 900)       [+ Log Past]│ │  │
│ │ Timeline of everything you've watched, rated, and logged.          │ │  │
│ │                                                                    │ │  │
│ │ [ 🔍 Search journal...                                           ] │ │  │
│ └────────────────────────────────────────────────────────────────────┘ │  │
│                                                                        │  │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │  │
│ │ <StatTile>   │ │ <StatTile>   │ │ <StatTile>   │ │ <StatTile>   │    │  │
│ │ 142 Watched  │ │ 284h Streamed│ │ 8.4 Avg Star │ │ 12 Day Streak│    │  │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │  │
│                                                                        │  │
│ ┌────────────────────────────────────────────────────────────────────┐ │  │
│ │ <FilterBar>                                                        │ │  │
│ │ (All 142)  (Movies 98)  (Episodes 44)         [Sort: Newest ▾] [☷ ☰]│ │  │
│ └────────────────────────────────────────────────────────────────────┘ │  │
│                                                                        │  │
│ <Section title="October 2026">                                         │  │
│   <Card> or Timeline View List                                         │  │
│ </Section>                                                             │  │
│                                                                        │  ▼
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Automated CI Guardrail Verification

To ensure regression-free consistency across future changes:

```bash
# Run layout and token guardrail
npm run check:ui-guardrails

# Run full project verification
npm run typecheck && npm run lint && npm run test && npm run build
```

Guardrail Rules:
1. `no-dashed-borders`: Prohibits dashed borders anywhere in project stylesheets.
2. `no-page-max-width`: Prohibits hard-coded page max-width values (1140px, 1200px, 1280px) outside `PageShell.module.css`.
3. Canonical layout standard: All 18 routes conform to `<PageShell>` + `<PageHeader>`.
