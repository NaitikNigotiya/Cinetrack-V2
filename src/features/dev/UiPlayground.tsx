import { useState } from 'react'
import {
  Button,
  ToastContainer,
  toast,
  PageShell,
  PageHeader,
  StatRow,
  StatTile,
  Section,
  Card,
  FilterBar,
  EmptyStateCard,
  SearchField,
  Pill,
  PosterGrid,
  PosterCard,
} from '@/shared/ui'
import { Sun, Moon, Film, Tv, Clock, Star, Plus, Grid, List } from 'lucide-react'

export default function UiPlayground() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all')
  const [sortVal, setSortVal] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('cinetrack_theme', next)
  }

  return (
    <PageShell>
      <ToastContainer />
      <PageHeader
        eyebrow="DESIGN SYSTEM & PRIMITIVES"
        title="UI Component Playground"
        subtitle="Visual verification for shared tokens, layout primitives, and typography scale"
        actions={
          <Button
            variant="secondary"
            onClick={toggleTheme}
            leftIcon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          >
            Theme: {theme}
          </Button>
        }
      >
        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Test in-card search field with keyboard shortcut hint (/)..."
        />
      </PageHeader>

      {/* KPI Stats */}
      <StatRow>
        <StatTile
          icon={<Film size={22} />}
          value="42"
          label="Movies Watched"
          sublabel="8 this month"
        />
        <StatTile
          icon={<Tv size={22} />}
          value="18"
          label="TV Series"
          sublabel="142 episodes"
        />
        <StatTile
          icon={<Clock size={22} />}
          value="156h"
          label="Total Watch Time"
          sublabel="6.5 days"
        />
        <StatTile
          icon={<Star size={22} />}
          value="8.4"
          label="Avg Rating"
          sublabel="Based on 50 ratings"
        />
      </StatRow>

      {/* FilterBar */}
      <FilterBar
        tabs={[
          { id: 'all', label: 'All', count: 60 },
          { id: 'movies', label: 'Movies', count: 42 },
          { id: 'tv', label: 'TV Shows', count: 18 },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        sortOptions={[
          { value: 'recent', label: 'Recently Watched' },
          { value: 'rating', label: 'Highest Rated' },
          { value: 'title', label: 'Title (A-Z)' },
        ]}
        sortValue={sortVal}
        onSortChange={setSortVal}
        viewMode={viewMode}
        onViewModeChange={(m) => setViewMode(m)}
        viewModeOptions={[
          { mode: 'grid', icon: <Grid size={16} />, label: 'Grid View' },
          { mode: 'list', icon: <List size={16} />, label: 'List View' },
        ]}
      />

      {/* Cards */}
      <Section title="Card Variants">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--card-gap)' }}>
          <Card variant="default">
            <h3>Default Card</h3>
            <p style={{ color: 'var(--text-2)', marginTop: '8px' }}>
              Standard surface card with subtle shadow and border.
            </p>
          </Card>
          <Card variant="interactive" onClick={() => toast.success('Interactive card clicked!')}>
            <h3>Interactive Card</h3>
            <p style={{ color: 'var(--text-2)', marginTop: '8px' }}>
              Hover lift effect, border accent on hover, and accessible focus ring.
            </p>
          </Card>
          <Card variant="flat">
            <h3>Flat Card</h3>
            <p style={{ color: 'var(--text-2)', marginTop: '8px' }}>
              Flat variant without elevation shadow.
            </p>
          </Card>
        </div>
      </Section>

      {/* Buttons & Pills */}
      <Section title="Buttons & Pills">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Button variant="primary" leftIcon={<Plus size={16} />}>Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button size="sm" variant="primary">Small (32px)</Button>
          <Button size="md" variant="primary">Medium (40px)</Button>
          <Button size="lg" variant="primary">Large (48px)</Button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
          <Pill variant="default">Default Pill</Pill>
          <Pill variant="brand">Brand Subtle</Pill>
          <Pill variant="filledBrand">Filled Brand</Pill>
          <Pill variant="success">Completed</Pill>
          <Pill variant="outline">Outline</Pill>
          <Pill variant="outline" interactive active>Active Filter Chip</Pill>
        </div>
      </Section>

      {/* Empty State Card */}
      <Section title="Empty State Primitive">
        <EmptyStateCard
          icon="🍿"
          title="Nothing in progress"
          description="You don't have any titles currently being watched. Search for movies and TV shows to track."
          action={<Button variant="primary">Browse Titles</Button>}
        />
      </Section>

      {/* Poster Grid */}
      <Section title="Poster Grid Primitive">
        <PosterGrid>
          <PosterCard
            title="Dune: Part Two"
            year={2024}
            type="movie"
            rating={8.6}
            posterPath="/5zE6GZ66wzV9sK8YnL8W3C5u.jpg"
            titleKey="movie:693134"
          />
          <PosterCard
            title="Oppenheimer"
            year={2023}
            type="movie"
            rating={8.9}
            posterPath="/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"
            titleKey="movie:872585"
          />
          <PosterCard
            title="Shogun"
            year={2024}
            type="tv"
            rating={8.7}
            progress={{ watched: 6, total: 10 }}
            titleKey="tv:126308"
          />
        </PosterGrid>
      </Section>
    </PageShell>
  )
}
