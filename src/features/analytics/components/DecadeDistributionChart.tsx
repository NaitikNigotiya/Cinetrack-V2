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
import styles from './DecadeDistributionChart.module.css'

interface DecadeDistributionChartProps {
  distribution: { decade: string; count: number }[]
}

export function DecadeDistributionChart({ distribution }: DecadeDistributionChartProps) {
  const [showTable, setShowTable] = useState(false)

  const hasData = distribution.some((d) => d.count > 0)
  const total = distribution.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Release Decades</h2>
          <span className={styles.subtitle}>Eras of titles in your library</span>
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
        <div className={styles.empty}>No release year data available.</div>
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
                    dataKey="decade"
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
                      return [`${count} titles`, 'Count']
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div className={showTable ? styles.tableWrapper : styles.srOnly}>
            <table className={styles.table}>
              <caption>Titles count by release decade</caption>
              <thead>
                <tr>
                  <th scope="col">Decade</th>
                  <th scope="col">Count</th>
                  <th scope="col">Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {distribution.map((row) => (
                  <tr key={row.decade}>
                    <td>{row.decade}</td>
                    <td>{row.count}</td>
                    <td>
                      {total > 0 ? `${((row.count / total) * 100).toFixed(1)}%` : '0%'}
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
