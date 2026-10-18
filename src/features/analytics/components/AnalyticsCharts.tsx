import { useState } from 'react'
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
import { Card } from '@/shared/ui/layout/Card'
import { Section } from '@/shared/ui/layout/Section'

const GENRE_COLORS = [
  '#E50914',
  '#00B4D8',
  '#F5A623',
  '#2ECC71',
  '#8B5CF6',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
]

const PLATFORM_COLORS: Record<string, string> = {
  Netflix: '#E50914',
  'Prime Video': '#00A8E1',
  'Apple TV+': '#555555',
  'Disney+': '#113CCF',
  Others: '#888888',
}

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
        <div className="ap-tooltip-row" style={{ color: 'var(--brand-primary)' }}>
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
            borderTop: '1px solid var(--border-subtle)',
            marginTop: 4,
            paddingTop: 4,
            color: 'var(--text-primary)',
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

interface AnalyticsChartsProps {
  selectedYear: string
  moviesShowsData: Array<{ name: string; value: number; percentage: number }>
  dominantTypeLabel: string
  genresData: Array<{ name: string; value: number; percentage: number }>
  dominantGenreLabel: string
  monthlyData: Array<{ month: string; Movies: number; TV: number; Total: number }>
  ratingsDistributionData: Array<{ label: string; count: number; star: number }>
  runtimeDistributionData: Array<{ label: string; count: number }>
  platformsData: Array<{ name: string; value: number; percentage: number }>
  dominantPlatformLabel: string
}

export function AnalyticsCharts({
  selectedYear,
  moviesShowsData,
  dominantTypeLabel,
  genresData,
  dominantGenreLabel,
  monthlyData,
  ratingsDistributionData,
  runtimeDistributionData,
  platformsData,
  dominantPlatformLabel,
}: AnalyticsChartsProps) {
  const [hoveredType, setHoveredType] = useState<string | null>(null)
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null)
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* 1. Twin Donut Charts */}
      <Section title="Format & Genres">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--card-gap)' }}>
          <Card variant="default">
            <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>Movies vs Shows</h3>
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
                    <Cell fill="var(--brand-primary)" stroke="transparent" />
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
                  <span className="ap-legend-dot" style={{ background: idx === 0 ? 'var(--brand-primary)' : '#00B4D8' }} />
                  {item.percentage}% {item.name}
                </span>
              ))}
            </div>
          </Card>

          <Card variant="default">
            <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>Genres</h3>
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
          </Card>
        </div>
      </Section>

      {/* 2. Monthly Watch Time */}
      <Section title={`Monthly Watch Time (${selectedYear})`}>
        <Card variant="default">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomMonthlyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="Movies" stackId="a" fill="var(--brand-primary)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="TV" stackId="a" fill="#00B4D8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Section>

      {/* 3. Ratings & Runtime Distribution */}
      <Section title="Distributions">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--card-gap)' }}>
          <Card variant="default" style={{ height: 350 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>Ratings Distribution</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={ratingsDistributionData} margin={{ top: 0, right: 20, left: -25, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
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
          </Card>

          <Card variant="default" style={{ height: 350 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>Runtime Distribution</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={runtimeDistributionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomChartTooltip />} cursor={false} />
                  <Bar dataKey="count" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </Section>

      {/* 4. Top Platforms */}
      <Section title="Platforms">
        <Card variant="default" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-card-title)', fontWeight: 700, textAlign: 'center' }}>Top Platforms</h3>
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

          <div className="ap-legend-text" style={{ flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {platformsData.map((item) => (
              <span key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span className="ap-legend-dot" style={{ background: PLATFORM_COLORS[item.name] || '#888' }} />
                {item.name}: {item.value} ({item.percentage}%)
              </span>
            ))}
          </div>
        </Card>
      </Section>
    </div>
  )
}
