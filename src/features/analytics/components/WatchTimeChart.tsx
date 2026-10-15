import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import type { MonthlyStats } from '@/shared/schemas'
import styles from './WatchTimeChart.module.css'

interface WatchTimeChartProps {
  data: MonthlyStats[]
}

interface ChartItem {
  month: string
  label: string
  movieHours: number
  tvHours: number
  totalHours: number
}

function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-')
  if (!yearStr || !monthStr) return monthKey
  const monthNum = parseInt(monthStr, 10)
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const name = monthNames[monthNum - 1] ?? monthStr
  return `${name} '${yearStr.slice(2)}`
}

export function WatchTimeChart({ data }: WatchTimeChartProps) {
  const [showTable, setShowTable] = useState(false)

  const chartData: ChartItem[] = data.slice(-12).map((item) => {
    const movieHours = parseFloat(((item.movieMinutes || 0) / 60).toFixed(1))
    const tvHours = parseFloat(((item.tvMinutes || 0) / 60).toFixed(1))
    return {
      month: item.monthKey,
      label: formatMonthLabel(item.monthKey),
      movieHours,
      tvHours,
      totalHours: parseFloat((movieHours + tvHours).toFixed(1)),
    }
  })

  const hasData = chartData.some((d) => d.totalHours > 0)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Monthly Watch Time</h2>
          <span className={styles.subtitle}>Movie vs TV viewing hours (last 12 months)</span>
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
        <div className={styles.empty}>No watch activity recorded for this period yet.</div>
      ) : (
        <>
          {!showTable ? (
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--color-text-secondary)"
                    fontSize={12}
                    tickLine={false}
                    unit="h"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                    }}
                    formatter={(value: unknown, name: unknown) => {
                      const num = typeof value === 'number' ? value : 0
                      const label = typeof name === 'string' ? name : ''
                      return [`${num} hours`, label]
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  />
                  <Bar
                    dataKey="movieHours"
                    name="Movies"
                    stackId="watch"
                    fill="var(--color-accent)"
                    radius={[0, 0, 2, 2]}
                  />
                  <Bar
                    dataKey="tvHours"
                    name="TV Shows"
                    stackId="watch"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div className={showTable ? styles.tableWrapper : styles.srOnly}>
            <table className={styles.table}>
              <caption>Monthly watch time breakdown in hours</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Movies (hours)</th>
                  <th scope="col">TV Shows (hours)</th>
                  <th scope="col">Total (hours)</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => (
                  <tr key={row.month}>
                    <td>{row.label}</td>
                    <td>{row.movieHours}h</td>
                    <td>{row.tvHours}h</td>
                    <td>{row.totalHours}h</td>
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
