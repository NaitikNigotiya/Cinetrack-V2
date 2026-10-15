import { useState, useMemo } from 'react'
import styles from './ActivityHeatmap.module.css'

interface ActivityHeatmapProps {
  dayCounts: Record<string, number>
}

interface DayCell {
  dateKey: string
  label: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 4) return 3
  return 4
}

export function ActivityHeatmap({ dayCounts }: ActivityHeatmapProps) {
  const [showTable, setShowTable] = useState(false)
  const [anchorDate] = useState(() => new Date())

  const cells: DayCell[] = useMemo(() => {
    const list: DayCell[] = []
    const totalDays = 112 // 16 full weeks

    // Calculate start day so that last cell is today
    const current = new Date(anchorDate)
    const currentDayOfWeek = (current.getDay() + 6) % 7 // Mon = 0, Sun = 6
    const daysToInclude = totalDays - (6 - currentDayOfWeek)

    const start = new Date(current)
    start.setDate(start.getDate() - (daysToInclude - 1))

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`
      const count = dayCounts[dateKey] ?? 0

      list.push({
        dateKey,
        label: d.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        count,
        level: getLevel(count),
      })
    }

    return list
  }, [anchorDate, dayCounts])

  const totalWatches = useMemo(
    () => cells.reduce((sum, c) => sum + c.count, 0),
    [cells]
  )
  const activeDaysCount = useMemo(
    () => cells.filter((c) => c.count > 0).length,
    [cells]
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Viewing Activity Heatmap</h2>
          <span className={styles.subtitle}>
            {activeDaysCount} active days, {totalWatches} watches in the past 16 weeks
          </span>
        </div>
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setShowTable((prev) => !prev)}
          aria-expanded={showTable}
        >
          {showTable ? 'Show Heatmap' : 'View as Table'}
        </button>
      </div>

      {!showTable ? (
        <div className={styles.heatmapWrapper}>
          <div className={styles.grid} role="region" aria-label="16-week activity calendar grid">
            {cells.map((cell) => {
              const levelClass =
                cell.level === 0
                  ? styles.level0
                  : cell.level === 1
                    ? styles.level1
                    : cell.level === 2
                      ? styles.level2
                      : cell.level === 3
                        ? styles.level3
                        : styles.level4

              return (
                <div
                  key={cell.dateKey}
                  className={`${styles.cell} ${levelClass}`}
                  title={`${cell.label}: ${cell.count} ${cell.count === 1 ? 'watch' : 'watches'}`}
                  aria-label={`${cell.label}: ${cell.count} watches`}
                />
              )
            })}
          </div>

          <div className={styles.legend}>
            <span>Less</span>
            <div className={styles.legendSquares}>
              <div className={`${styles.legendSquare} ${styles.level0}`} />
              <div className={`${styles.legendSquare} ${styles.level1}`} />
              <div className={`${styles.legendSquare} ${styles.level2}`} />
              <div className={`${styles.legendSquare} ${styles.level3}`} />
              <div className={`${styles.legendSquare} ${styles.level4}`} />
            </div>
            <span>More</span>
          </div>
        </div>
      ) : null}

      <div className={showTable ? styles.tableWrapper : styles.srOnly}>
        <table className={styles.table}>
          <caption>Viewing activity history over the last 16 weeks</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Watches</th>
            </tr>
          </thead>
          <tbody>
            {cells
              .filter((c) => c.count > 0)
              .reverse()
              .map((cell) => (
                <tr key={cell.dateKey}>
                  <td>{cell.label}</td>
                  <td>{cell.count}</td>
                </tr>
              ))}
            {activeDaysCount === 0 && (
              <tr>
                <td colSpan={2}>No activity recorded in this time period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
