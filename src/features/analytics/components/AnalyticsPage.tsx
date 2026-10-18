import { useState, useMemo, useEffect } from 'react'
import { Star, Flame, Clock, Film, Layers, Play } from 'lucide-react'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatRow } from '@/shared/ui/layout/StatRow'
import { StatTile } from '@/shared/ui/layout/StatTile'
import { Button } from '@/shared/ui/Button/Button'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'
import { AnalyticsCharts } from './AnalyticsCharts'
import {
  getWatchDate,
  calculateMetrics,
  calculateGenresData,
  calculateMonthlyData,
  calculateRatingsDistribution,
  calculateRuntimeDistribution,
  calculatePlatformsData,
} from './analyticsData'

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
  const { entries, isLoading } = useLibrary('all')

  const [selectedYear, setSelectedYear] = useState<string>('All Time')
  const [contentType, setContentType] = useState<'all' | 'movie' | 'tv'>('all')

  const completedEntries = useMemo(() => {
    return entries.filter((e) => e.status === 'completed')
  }, [entries])

  const filteredCompletions = useMemo(() => {
    let list = completedEntries
    if (contentType === 'movie') {
      list = list.filter((e) => e.type === 'movie')
    } else if (contentType === 'tv') {
      list = list.filter((e) => e.type === 'tv')
    }
    if (selectedYear !== 'All Time') {
      const yearInt = parseInt(selectedYear, 10)
      list = list.filter((e) => getWatchDate(e).getFullYear() === yearInt)
    }
    return list
  }, [completedEntries, contentType, selectedYear])

  const metrics = useMemo(() => calculateMetrics(filteredCompletions), [filteredCompletions])

  const moviesShowsData = useMemo(() => {
    const total = metrics.moviesCount + metrics.tvCount
    if (total === 0) return []
    return [
      { name: 'Movies', value: metrics.moviesCount, percentage: Math.round((metrics.moviesCount / total) * 100) },
      { name: 'TV Shows', value: metrics.tvCount, percentage: Math.round((metrics.tvCount / total) * 100) },
    ]
  }, [metrics])

  const dominantTypeLabel = useMemo(() => {
    if (moviesShowsData.length === 0) return 'No data'
    const sorted = [...moviesShowsData].sort((a, b) => b.value - a.value)
    return `${sorted[0]?.percentage ?? 0}% ${sorted[0]?.name ?? ''}`
  }, [moviesShowsData])

  const genresData = useMemo(() => calculateGenresData(filteredCompletions), [filteredCompletions])
  const dominantGenreLabel = useMemo(() => {
    if (genresData.length === 0) return 'No data'
    return `${genresData[0]?.percentage ?? 0}% ${genresData[0]?.name ?? ''}`
  }, [genresData])

  const monthlyData = useMemo(() => calculateMonthlyData(filteredCompletions), [filteredCompletions])
  const ratingsDistributionData = useMemo(() => calculateRatingsDistribution(filteredCompletions), [filteredCompletions])
  const runtimeDistributionData = useMemo(() => calculateRuntimeDistribution(filteredCompletions), [filteredCompletions])
  const platformsData = useMemo(() => calculatePlatformsData(filteredCompletions), [filteredCompletions])

  const dominantPlatformLabel = useMemo(() => {
    if (platformsData.length === 0) return 'No data'
    const sorted = [...platformsData].sort((a, b) => b.value - a.value)
    return `${sorted[0]?.percentage ?? 0}% ${sorted[0]?.name ?? ''}`
  }, [platformsData])

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    completedEntries.forEach((e) => {
      const d = getWatchDate(e)
      years.add(d.getFullYear())
    })
    return ['All Time', ...Array.from(years).sort((a, b) => b - a).map(String)]
  }, [completedEntries])

  return (
    <PageShell>
      <PageHeader
        eyebrow="INSIGHTS"
        title="Viewing Analytics"
        subtitle="Deep dive into your viewing habits, genres, ratings, and time spent across movies and TV."
        meta={<span>{metrics.moviesCount + metrics.tvCount} watched</span>}
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

      {isLoading ? (
        <div className="analytics-loading-grid">
          <div className="analytics-skeleton-card" />
          <div className="analytics-skeleton-card" />
        </div>
      ) : filteredCompletions.length === 0 ? (
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
              value={<AnimatedNumber value={metrics.moviesCount} />}
              label="Movies Watched"
            />
            <StatTile
              icon={<Layers size={20} />}
              value={<AnimatedNumber value={metrics.tvCount} />}
              label="TV Shows Watched"
            />
            <StatTile
              icon={<Clock size={20} />}
              value={<AnimatedNumber value={metrics.watchTimeHours} />}
              label="Hours Streamed"
            />
            <StatTile
              icon={<Flame size={20} />}
              value={<AnimatedNumber value={metrics.streak} />}
              label="Day Streak"
            />
            <StatTile
              icon={<Star size={20} />}
              value={<AnimatedNumber value={metrics.avgRating} decimals={1} />}
              label="Avg Rating"
            />
            <StatTile
              icon={<Play size={20} />}
              value={<AnimatedNumber value={metrics.rewatchedCount} />}
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
