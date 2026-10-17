import { useState, useMemo, useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Star, Flame, Clock, Film, Layers, Play } from 'lucide-react'

import { useLibrary } from '@/features/library/hooks/useLibrary'
import type { LibraryEntry } from '@/shared/schemas'

import './AnalyticsPage.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRE_COLORS = [
  '#E50914', // Red
  '#00B4D8', // Teal/Cyan
  '#F5A623', // Yellow
  '#2ECC71', // Green
  '#8B5CF6', // Purple
  '#FF6B6B', // Light Red
  '#4ECDC4', // Sage
  '#45B7D1', // Slate Blue
]

const PLATFORM_COLORS: Record<string, string> = {
  Netflix: '#E50914',
  'Prime Video': '#00A8E1',
  'Apple TV+': '#555555',
  'Disney+': '#113CCF',
  Others: '#888888',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animate counting up from 0 to value */
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const duration = 800

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const elapsed = timestamp - startTimestamp
      const progress = Math.min(elapsed / duration, 1)
      const currentVal = progress * value
      setDisplayValue(currentVal)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }, [value])

  return <>{displayValue.toFixed(decimals)}</>
}

function getWatchDate(e: LibraryEntry): Date {
  if (e.completedAt) {
    return e.completedAt.toDate ? e.completedAt.toDate() : new Date(e.completedAt)
  }
  if (e.lastWatchedAt) {
    return e.lastWatchedAt.toDate ? e.lastWatchedAt.toDate() : new Date(e.lastWatchedAt)
  }
  if (e.updatedAt) {
    return e.updatedAt.toDate ? e.updatedAt.toDate() : new Date(e.updatedAt)
  }
  return new Date()
}

// Deterministic streaming platform helper based on titleKey hash
function getPlatformName(titleKey: string): string {
  const code = titleKey.charCodeAt(titleKey.length - 1) || 0
  if (code % 5 === 0) return 'Netflix'
  if (code % 5 === 1) return 'Prime Video'
  if (code % 5 === 2) return 'Apple TV+'
  if (code % 5 === 3) return 'Disney+'
  return 'Others'
}

// ─── Custom Tooltips ───

function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="ap-custom-tooltip">
        <p className="ap-tooltip-title">{label || payload[0].name}</p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="ap-tooltip-row" style={{ color: item.color || item.fill }}>
            <span>{item.name}: </span>
            <strong style={{ marginLeft: 6 }}>{item.value}</strong>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function CustomMonthlyTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const moviesVal = payload[0]?.value ?? 0
    const tvVal = payload[1]?.value ?? 0
    const totalVal = moviesVal + tvVal

    return (
      <div className="ap-custom-tooltip">
        <p className="ap-tooltip-title">{label}</p>
        <div className="ap-tooltip-row" style={{ color: 'var(--color-brand, #e50914)' }}>
          <span>Movies:</span>
          <strong>{moviesVal}h</strong>
        </div>
        <div className="ap-tooltip-row" style={{ color: '#00B4D8' }}>
          <span>TV Shows:</span>
          <strong>{tvVal}h</strong>
        </div>
        <div
          className="ap-tooltip-row"
          style={{
            borderTop: '1px solid var(--border-default, #2a2c3d)',
            marginTop: 4,
            paddingTop: 4,
            color: 'var(--text-primary, #ffffff)',
          }}
        >
          <span>Total:</span>
          <strong>{totalVal}h</strong>
        </div>
      </div>
    )
  }
  return null
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { entries, isLoading } = useLibrary('all')

  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>('All Time')
  const [contentType, setContentType] = useState<'all' | 'movie' | 'tv'>('all')

  // Hover states for Donut centers
  const [hoveredType, setHoveredType] = useState<string | null>(null)
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null)
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null)

  // Filtered Completed Data
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

  // Top Metric Calculations
  const metrics = useMemo(() => {
    const moviesCount = filteredCompletions.filter((e) => e.type === 'movie').length
    const tvCount = filteredCompletions.filter((e) => e.type === 'tv').length
    const totalRuntimeMins = filteredCompletions.reduce(
      (acc, e) => acc + (e.runtimeMinutes || 110),
      0
    )
    const watchTimeHours = Math.round(totalRuntimeMins / 60)

    const rated = filteredCompletions.filter((e) => e.rating !== null && e.rating !== undefined)
    const avgRating =
      rated.length > 0
        ? Number((rated.reduce((acc, e) => acc + (e.rating ?? 0), 0) / rated.length).toFixed(1))
        : 0

    // Streak calculation
    const sortedDates = filteredCompletions
      .map((e) => getWatchDate(e))
      .sort((a, b) => b.getTime() - a.getTime())

    let streak = 0
    const firstDate = sortedDates[0]
    if (firstDate) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const lastWatch = new Date(
        firstDate.getFullYear(),
        firstDate.getMonth(),
        firstDate.getDate()
      ).getTime()
      const diffDays = Math.round((today - lastWatch) / (1000 * 60 * 60 * 24))

      if (diffDays <= 1) {
        streak = 1
        let prevTime = lastWatch
        for (let i = 1; i < sortedDates.length; i++) {
          const checkDateVal = sortedDates[i]
          if (!checkDateVal) break
          const checkDate = new Date(
            checkDateVal.getFullYear(),
            checkDateVal.getMonth(),
            checkDateVal.getDate()
          ).getTime()
          const checkDiff = Math.round((prevTime - checkDate) / (1000 * 60 * 60 * 24))
          if (checkDiff === 1) {
            streak++
            prevTime = checkDate
          } else if (checkDiff > 1) {
            break
          }
        }
      }
    }

    const rewatchedCount = filteredCompletions.filter((e) => (e.watchCount ?? 1) > 1).length

    return {
      moviesCount,
      tvCount,
      watchTimeHours,
      streak,
      avgRating,
      rewatchedCount,
    }
  }, [filteredCompletions])

  // Chart 1: Movies vs Shows Donut
  const moviesShowsData = useMemo(() => {
    const mCount = metrics.moviesCount
    const tCount = metrics.tvCount
    const total = mCount + tCount
    if (total === 0) return []
    return [
      { name: 'Movies', value: mCount, percentage: Math.round((mCount / total) * 100) },
      { name: 'TV Shows', value: tCount, percentage: Math.round((tCount / total) * 100) },
    ]
  }, [metrics])

  const dominantTypeLabel = useMemo(() => {
    if (moviesShowsData.length === 0) return 'No data'
    const sorted = [...moviesShowsData].sort((a, b) => b.value - a.value)
    return `${sorted[0]?.percentage ?? 0}% ${sorted[0]?.name ?? ''}`
  }, [moviesShowsData])

  // Chart 2: Genres Donut
  const genresData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredCompletions.forEach((e) => {
      e.genres?.forEach((g) => {
        counts[g.name] = (counts[g.name] || 0) + 1
      })
    })

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const total = sorted.reduce((acc, [, c]) => acc + c, 0)
    return sorted.slice(0, 8).map(([name, count]) => ({
      name,
      value: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
  }, [filteredCompletions])

  const dominantGenreLabel = useMemo(() => {
    if (genresData.length === 0) return 'No data'
    return `${genresData[0]?.percentage ?? 0}% ${genresData[0]?.name ?? ''}`
  }, [genresData])

  // Chart 3: Monthly Watch Time
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((m, idx) => {
      const monthCompletions = filteredCompletions.filter((e) => {
        const date = getWatchDate(e)
        return date.getMonth() === idx
      })

      const movieHrs = Math.round(
        monthCompletions
          .filter((e) => e.type === 'movie')
          .reduce((sum, e) => sum + (e.runtimeMinutes || 110), 0) / 60
      )
      const tvHrs = Math.round(
        monthCompletions
          .filter((e) => e.type === 'tv')
          .reduce((sum, e) => sum + (e.runtimeMinutes || 110), 0) / 60
      )

      return {
        month: m,
        Movies: movieHrs,
        TV: tvHrs,
        Total: movieHrs + tvHrs,
      }
    })
  }, [filteredCompletions])

  // Chart 4: Ratings Distribution
  const ratingsDistributionData = useMemo(() => {
    return Array.from({ length: 10 }).map((_, idx) => {
      const star = idx + 1
      const count = filteredCompletions.filter((e) => Math.round(e.rating ?? 0) === star).length
      return {
        label: `${star}★`,
        count,
        star,
      }
    })
  }, [filteredCompletions])

  // Chart 5: Runtime Distribution
  const runtimeDistributionData = useMemo(() => {
    const buckets = [
      { label: '<60m', count: 0 },
      { label: '60-90m', count: 0 },
      { label: '90-120m', count: 0 },
      { label: '120-150m', count: 0 },
      { label: '150m+', count: 0 },
    ]

    filteredCompletions.forEach((e) => {
      const mins = e.runtimeMinutes || 110
      if (mins < 60) {
        if (buckets[0]) buckets[0].count++
      } else if (mins <= 90) {
        if (buckets[1]) buckets[1].count++
      } else if (mins <= 120) {
        if (buckets[2]) buckets[2].count++
      } else if (mins <= 150) {
        if (buckets[3]) buckets[3].count++
      } else {
        if (buckets[4]) buckets[4].count++
      }
    })

    return buckets
  }, [filteredCompletions])

  // Chart 6: Top Platforms Donut
  const platformsData = useMemo(() => {
    const counts: Record<string, number> = {
      Netflix: 0,
      'Prime Video': 0,
      'Apple TV+': 0,
      'Disney+': 0,
      Others: 0,
    }

    filteredCompletions.forEach((e) => {
      const p = getPlatformName(e.titleKey)
      counts[p] = (counts[p] || 0) + 1
    })

    const total = Object.values(counts).reduce((acc, c) => acc + c, 0)
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        value: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .filter((item) => item.value > 0)
  }, [filteredCompletions])

  const dominantPlatformLabel = useMemo(() => {
    if (platformsData.length === 0) return 'No data'
    const sorted = [...platformsData].sort((a, b) => b.value - a.value)
    return `${sorted[0]?.percentage ?? 0}% ${sorted[0]?.name ?? ''}`
  }, [platformsData])

  if (isLoading) {
    return (
      <div className="unified-page-container analytics-page">
        <header className="unified-page-header">
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Insights & breakdown of your watching behavior</p>
          </div>
        </header>

        <div className="analytics-metrics-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--radius-lg, 12px)' }} />
          ))}
        </div>
      </div>
    )
  }

  const isDataEmpty = filteredCompletions.length === 0

  return (
    <div className="unified-page-container analytics-page">
      <header className="unified-page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Insights & breakdown of your watching behavior</p>
        </div>

        <div className="analytics-header-actions">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="cinetrack-select"
          >
            <option value="All Time">All Time</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>

          <div
            style={{
              display: 'inline-flex',
              background: 'var(--bg-secondary, #141522)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '3px',
              border: '1px solid var(--border-default, #2a2c3d)',
            }}
          >
            <button
              className={`calendar-btn-toggle ${contentType === 'all' ? 'calendar-btn-toggle--active' : ''}`}
              onClick={() => setContentType('all')}
              type="button"
            >
              All
            </button>
            <button
              className={`calendar-btn-toggle ${contentType === 'movie' ? 'calendar-btn-toggle--active' : ''}`}
              onClick={() => setContentType('movie')}
              type="button"
            >
              Movies
            </button>
            <button
              className={`calendar-btn-toggle ${contentType === 'tv' ? 'calendar-btn-toggle--active' : ''}`}
              onClick={() => setContentType('tv')}
              type="button"
            >
              TV Shows
            </button>
          </div>
        </div>
      </header>

      {isDataEmpty ? (
        <div className="ap-empty-card">
          <span style={{ fontSize: 48 }}>📊</span>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '12px 0 6px 0' }}>No analytics data</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>
            {selectedYear !== 'All Time'
              ? `You haven't completed any titles in ${selectedYear} matching the selection.`
              : 'Add and mark items as Completed in your library to see stats metrics.'}
          </p>
        </div>
      ) : (
        <>
          {/* 1. Metrics Stat Row - 6 Cards */}
          <div className="analytics-metrics-grid animate-fade-in">
            <div className="ap-stat-card">
              <span className="ap-stat-icon"><Film size={16} /></span>
              <span className="ap-stat-value"><AnimatedNumber value={metrics.moviesCount} /></span>
              <span className="ap-stat-lbl">Movies</span>
            </div>
            <div className="ap-stat-card">
              <span className="ap-stat-icon"><Layers size={16} /></span>
              <span className="ap-stat-value"><AnimatedNumber value={metrics.tvCount} /></span>
              <span className="ap-stat-lbl">TV Shows</span>
            </div>
            <div className="ap-stat-card">
              <span className="ap-stat-icon"><Clock size={16} /></span>
              <span className="ap-stat-value"><AnimatedNumber value={metrics.watchTimeHours} />h</span>
              <span className="ap-stat-lbl">Watch Time</span>
            </div>
            <div className="ap-stat-card">
              <span className="ap-stat-icon"><Flame size={16} /></span>
              <span className="ap-stat-value"><AnimatedNumber value={metrics.streak} /></span>
              <span className="ap-stat-lbl">Streak</span>
            </div>
            <div className="ap-stat-card">
              <span className="ap-stat-icon"><Star size={16} /></span>
              <span className="ap-stat-value"><AnimatedNumber value={metrics.avgRating} decimals={1} /></span>
              <span className="ap-stat-lbl">Avg Rating</span>
            </div>
            <div className="ap-stat-card">
              <span className="ap-stat-icon"><Play size={16} /></span>
              <span className="ap-stat-value"><AnimatedNumber value={metrics.rewatchedCount} /></span>
              <span className="ap-stat-lbl">Rewatched</span>
            </div>
          </div>

          {/* 2. Twin Donut Charts */}
          <div className="analytics-charts-split animate-fade-in">
            <div className="analytics-chart-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Movies vs Shows</h3>
              <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moviesShowsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, idx) => setHoveredType(moviesShowsData[idx]?.name || null)}
                      onMouseLeave={() => setHoveredType(null)}
                    >
                      <Cell fill="var(--color-brand, #e50914)" stroke="transparent" />
                      <Cell fill="#00B4D8" stroke="transparent" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="ap-donut-center">
                  <span className="ap-donut-center-lbl">{hoveredType || dominantTypeLabel}</span>
                </div>
              </div>
              <div className="ap-legend-text">
                {moviesShowsData.map((item, idx) => (
                  <span key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span className="ap-legend-dot" style={{ background: idx === 0 ? 'var(--color-brand, #e50914)' : '#00B4D8' }} />
                    {item.percentage}% {item.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="analytics-chart-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Genres</h3>
              <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genresData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      onMouseEnter={(_, idx) => setHoveredGenre(genresData[idx]?.name || null)}
                      onMouseLeave={() => setHoveredGenre(null)}
                    >
                      {genresData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={GENRE_COLORS[index % GENRE_COLORS.length] || '#E50914'} stroke="transparent" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="ap-donut-center">
                  <span className="ap-donut-center-lbl">{hoveredGenre || dominantGenreLabel}</span>
                </div>
              </div>

              <div className="ap-genre-pills">
                {genresData.map((g, idx) => (
                  <span key={g.name} className="ap-genre-pill">
                    <span className="ap-genre-pill-dot" style={{ background: GENRE_COLORS[idx % GENRE_COLORS.length] }} />
                    {g.name} ({g.percentage}%)
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Monthly Watch Time Stacked Bar Chart */}
          <div className="analytics-chart-card animate-fade-in" style={{ marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Monthly Watch Time ({selectedYear})</h3>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border-default, #2a2c3d)" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary, #b3b6cb)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary, #b3b6cb)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomMonthlyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="Movies" stackId="a" fill="var(--color-brand, #e50914)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="TV" stackId="a" fill="#00B4D8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Ratings & Runtime Distribution */}
          <div className="analytics-charts-split animate-fade-in">
            <div className="analytics-chart-card" style={{ height: 350 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Ratings Distribution</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={ratingsDistributionData} margin={{ top: 0, right: 20, left: -25, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="label" type="category" tick={{ fill: 'var(--text-secondary, #b3b6cb)', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomChartTooltip />} cursor={false} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {ratingsDistributionData.map((item) => {
                        let barColor = '#EF4444'
                        if (item.star >= 5 && item.star <= 7) barColor = '#F5A623'
                        else if (item.star >= 8) barColor = '#2ECC71'
                        return <Cell key={`cell-${item.star}`} fill={barColor} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analytics-chart-card" style={{ height: 350 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Runtime Distribution</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={runtimeDistributionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary, #b3b6cb)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--text-secondary, #b3b6cb)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomChartTooltip />} cursor={false} />
                    <Bar dataKey="count" fill="var(--color-brand, #e50914)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 5. Top Platforms Donut */}
          <div className="analytics-chart-card animate-fade-in" style={{ maxWidth: 600, margin: '0 auto 20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>Top Platforms</h3>
            <div className="ap-chart-donut-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={platformsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, idx) => setHoveredPlatform(platformsData[idx]?.name || null)}
                    onMouseLeave={() => setHoveredPlatform(null)}
                  >
                    {platformsData.map((item) => (
                      <Cell key={`cell-${item.name}`} fill={PLATFORM_COLORS[item.name] || '#888'} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="ap-donut-center">
                <span className="ap-donut-center-lbl">{hoveredPlatform || dominantPlatformLabel}</span>
              </div>
            </div>

            <div className="ap-legend-text" style={{ flexWrap: 'wrap', gap: 12 }}>
              {platformsData.map((item) => (
                <span key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span className="ap-legend-dot" style={{ background: PLATFORM_COLORS[item.name] || '#888' }} />
                  {item.name}: {item.value} ({item.percentage}%)
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AnalyticsPage
