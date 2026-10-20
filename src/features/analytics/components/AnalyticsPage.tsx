import { useState, useMemo, useEffect } from 'react'
import { Star, Flame, Clock, Film, Layers, Play, Info, X } from 'lucide-react'
import { useAppStore } from '@/domain/store'
import { selectAnalyticsMetrics } from '@/domain/selectors'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatRow } from '@/shared/ui/layout/StatRow'
import { StatTile } from '@/shared/ui/layout/StatTile'
import { Button } from '@/shared/ui/Button/Button'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'
import { AnalyticsCharts } from './AnalyticsCharts'
import './AnalyticsPage.css'

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const duration = 800

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const elapsed = timestamp - startTimestamp
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(value * ease)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }, [value])

  return <>{displayValue.toFixed(decimals)}</>
}

export function AnalyticsPage() {
  const library = useAppStore((state) => state.library)
  const history = useAppStore((state) => state.history)
  const isReady = useAppStore((state) => state.isReady)
  const isLoading = !isReady

  const [selectedYear, setSelectedYear] = useState<string>('All Time')
  const [contentType, setContentType] = useState<'all' | 'movie' | 'tv'>('all')

  const metrics = useMemo(() => {
    return selectAnalyticsMetrics(library, history, selectedYear, contentType)
  }, [library, history, selectedYear, contentType])

  const {
    moviesCount,
    tvCount,
    watchTimeHours,
    streak,
    avgRating,
    rewatchedCount,
    moviesShowsData,
    dominantTypeLabel,
    genresData,
    dominantGenreLabel,
    monthlyData,
    ratingsDistributionData,
    runtimeDistributionData,
    platformsData,
    dominantPlatformLabel,
    availableYears,
    isEmpty,
  } = metrics

  const hasImportedData = useMemo(() => {
    return (
      library.some((e) => (e as any).source === 'import-v1' || (e as any).approximate) ||
      history.some((h) => h.source === 'import-v1' || (h as any).approximate)
    )
  }, [library, history])

  const [dismissedNotice, setDismissedNotice] = useState(() => {
    try {
      return localStorage.getItem('cinetrack_imported_analytics_dismissed') === 'true'
    } catch {
      return false
    }
  })

  const handleDismissNotice = () => {
    setDismissedNotice(true)
    try {
      localStorage.setItem('cinetrack_imported_analytics_dismissed', 'true')
    } catch {
      // ignore
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="INSIGHTS"
        title="Viewing Analytics"
        subtitle="Deep dive into your viewing habits, genres, ratings, and time spent across movies and TV."
        meta={<span>{moviesCount + tvCount} watched</span>}
      >
        <div className="analytics-header-controls">
          <div className="analytics-year-pills" role="tablist" aria-label="Filter by year">
            {availableYears.map((y) => (
              <button
                key={y}
                type="button"
                className={`analytics-pill-btn ${selectedYear === y ? 'active' : ''}`}
                onClick={() => setSelectedYear(y)}
              >
                {y}
              </button>
            ))}
          </div>

          <div className="analytics-type-pills" role="tablist" aria-label="Filter by content type">
            {(['all', 'movie', 'tv'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`analytics-pill-btn ${contentType === t ? 'active' : ''}`}
                onClick={() => setContentType(t)}
              >
                {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      {hasImportedData && !dismissedNotice && (
        <div className="analytics-imported-banner" role="status" aria-live="polite">
          <div className="analytics-imported-banner-content">
            <Info size={16} className="analytics-imported-banner-icon" />
            <span>Includes imported data with approximate watch dates</span>
          </div>
          <button
            type="button"
            className="analytics-imported-banner-close"
            onClick={handleDismissNotice}
            aria-label="Dismiss note"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="analytics-loading-grid">
          <div className="analytics-skeleton-card" />
          <div className="analytics-skeleton-card" />
        </div>
      ) : isEmpty ? (
        <EmptyStateCard
          title="No completed titles yet"
          description={
            selectedYear !== 'All Time'
              ? `No watches logged for ${selectedYear}. Try switching back to All Time or marking titles as watched.`
              : 'Start logging completed movies and TV shows to see detailed charts, streaks, and viewing stats.'
          }
          action={
            selectedYear !== 'All Time' ? (
              <Button variant="secondary" onClick={() => setSelectedYear('All Time')}>
                Show All Time
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <StatRow columns={6}>
            <StatTile
              icon={<Film size={20} />}
              value={<AnimatedNumber value={moviesCount} />}
              label="Movies Watched"
            />
            <StatTile
              icon={<Layers size={20} />}
              value={<AnimatedNumber value={tvCount} />}
              label="TV Shows Watched"
            />
            <StatTile
              icon={<Clock size={20} />}
              value={<AnimatedNumber value={watchTimeHours} />}
              label="Hours Streamed"
            />
            <StatTile
              icon={<Flame size={20} />}
              value={<AnimatedNumber value={streak} />}
              label="Day Streak"
            />
            <StatTile
              icon={<Star size={20} />}
              value={<AnimatedNumber value={avgRating} decimals={1} />}
              label="Avg Rating"
            />
            <StatTile
              icon={<Play size={20} />}
              value={<AnimatedNumber value={rewatchedCount} />}
              label="Rewatched"
            />
          </StatRow>

          <AnalyticsCharts
            selectedYear={selectedYear}
            moviesShowsData={moviesShowsData}
            dominantTypeLabel={dominantTypeLabel}
            genresData={genresData}
            dominantGenreLabel={dominantGenreLabel}
            monthlyData={monthlyData}
            ratingsDistributionData={ratingsDistributionData}
            runtimeDistributionData={runtimeDistributionData}
            platformsData={platformsData}
            dominantPlatformLabel={dominantPlatformLabel}
          />
        </>
      )}
    </PageShell>
  )
}

export default AnalyticsPage
