import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { getGenreName } from '../lib/genresHelper'
import styles from './TopGenresChart.module.css'

interface TopGenresChartProps {
  genreCounts: Record<string, number> | undefined
}

interface GenreDataPoint {
  genre: string
  count: number
  percentage: number
}

const PALETTE = [
  '#e50914',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

export function TopGenresChart({ genreCounts }: TopGenresChartProps) {
  const [showTable, setShowTable] = useState(false)

  const rawEntries = Object.entries(genreCounts ?? {})
  const totalCount = rawEntries.reduce((sum, [, count]) => sum + count, 0)

  const data: GenreDataPoint[] = rawEntries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, count]) => ({
      genre: getGenreName(id),
      count,
      percentage: totalCount > 0 ? parseFloat(((count / totalCount) * 100).toFixed(1)) : 0,
    }))

  const hasData = data.length > 0 && totalCount > 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Top Genres</h2>
          <span className={styles.subtitle}>Most frequently watched categories</span>
        </div>
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setShowTable((prev) => !prev)}
          aria-expanded={showTable}
        >
          {showTable ? 'Show Chart' : 'View as Table'}
        </button>
      </div>

      {!hasData ? (
        <div className={styles.empty}>No genre data available yet.</div>
      ) : (
        <>
          {!showTable ? (
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="genre"
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                    }}
                    formatter={(value: unknown) => {
                      const count = typeof value === 'number' ? value : 0
                      const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0
                      return [`${count} titles (${pct}%)`, 'Watched']
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.genre}`}
                        fill={PALETTE[index % PALETTE.length] ?? '#e50914'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div className={showTable ? styles.tableWrapper : styles.srOnly}>
            <table className={styles.table}>
              <caption>Top genres with title counts and percentages</caption>
              <thead>
                <tr>
                  <th scope="col">Genre</th>
                  <th scope="col">Titles Count</th>
                  <th scope="col">Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.genre}>
                    <td>{row.genre}</td>
                    <td>{row.count}</td>
                    <td>{row.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
