import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import styles from './RatingDistributionChart.module.css'

interface RatingDistributionChartProps {
  distribution: { bucket: string; count: number }[]
}

export function RatingDistributionChart({ distribution }: RatingDistributionChartProps) {
  const [showTable, setShowTable] = useState(false)

  const hasData = distribution.some((d) => d.count > 0)
  const totalRated = distribution.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Rating Distribution</h2>
          <span className={styles.subtitle}>Spread across rating tiers ({totalRated} rated)</span>
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
        <div className={styles.empty}>No ratings logged yet.</div>
      ) : (
        <>
          {!showTable ? (
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distribution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                    tickLine={false}
                    allowDecimals={false}
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
                      return [`${count} titles`, 'Rated']
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-warning)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div className={showTable ? styles.tableWrapper : styles.srOnly}>
            <table className={styles.table}>
              <caption>Distribution of ratings given to titles</caption>
              <thead>
                <tr>
                  <th scope="col">Rating Tier</th>
                  <th scope="col">Count</th>
                  <th scope="col">Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {distribution.map((row) => (
                  <tr key={row.bucket}>
                    <td>{row.bucket}</td>
                    <td>{row.count}</td>
                    <td>
                      {totalRated > 0
                        ? `${((row.count / totalRated) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
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
