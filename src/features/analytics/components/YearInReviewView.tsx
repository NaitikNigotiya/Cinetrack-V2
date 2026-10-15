import { useState, useMemo } from 'react'
import type { MonthlyStats } from '@/shared/schemas'
import { getGenreName } from '../lib/genresHelper'
import styles from './YearInReviewView.module.css'

interface YearInReviewViewProps {
  monthlyStats: MonthlyStats[]
  availableYears: string[]
}

export function YearInReviewView({ monthlyStats, availableYears }: YearInReviewViewProps) {
  const [currentYear] = useState(() => new Date().getFullYear().toString())
  const [selectedYear, setSelectedYear] = useState<string>(
    availableYears[0] ?? currentYear
  )

  const yearStats = useMemo(() => {
    const months = monthlyStats.filter((m) => m.monthKey.startsWith(selectedYear))
    let movies = 0
    let episodes = 0
    let movieMinutes = 0
    let tvMinutes = 0
    const genres: Record<string, number> = {}
    let peakMonthKey = ''
    let peakMonthMinutes = 0

    months.forEach((m) => {
      movies += m.movies
      episodes += m.episodes
      movieMinutes += m.movieMinutes
      tvMinutes += m.tvMinutes
      const totalMins = m.movieMinutes + m.tvMinutes
      if (totalMins > peakMonthMinutes) {
        peakMonthMinutes = totalMins
        peakMonthKey = m.monthKey
      }

      Object.entries(m.genreCounts).forEach(([gid, count]) => {
        genres[gid] = (genres[gid] ?? 0) + count
      })
    })

    const totalMinutes = movieMinutes + tvMinutes
    const totalHours = (totalMinutes / 60).toFixed(1)

    // Find top genre
    const sortedGenres = Object.entries(genres).sort((a, b) => b[1] - a[1])
    const topGenreEntry = sortedGenres[0]
    const topGenre = topGenreEntry ? getGenreName(topGenreEntry[0]) : '—'

    // Format peak month
    let peakMonthName = '—'
    if (peakMonthKey) {
      const monthPart = parseInt(peakMonthKey.split('-')[1] ?? '0', 10)
      const names = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ]
      peakMonthName = names[monthPart - 1] ?? peakMonthKey
    }

    return {
      movies,
      episodes,
      totalHours,
      topGenre,
      peakMonthName,
      totalMinutes,
    }
  }, [monthlyStats, selectedYear])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <span className={styles.badge}>Rewind</span>
          <h2 className={styles.title}>Year in Review</h2>
        </div>

        <select
          className={styles.yearSelect}
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          aria-label="Select year for review"
        >
          {availableYears.map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>
      </div>

      {yearStats.totalMinutes === 0 && yearStats.movies === 0 && yearStats.episodes === 0 ? (
        <div className={styles.empty}>
          No watch activity logged for {selectedYear} yet.
        </div>
      ) : (
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{yearStats.movies}</span>
            <span className={styles.statName}>Movies Logged</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{yearStats.episodes}</span>
            <span className={styles.statName}>Episodes Watched</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{yearStats.totalHours}h</span>
            <span className={styles.statName}>Total Hours</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{yearStats.topGenre}</span>
            <span className={styles.statName}>Top Genre</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{yearStats.peakMonthName}</span>
            <span className={styles.statName}>Peak Month</span>
          </div>
        </div>
      )}
    </div>
  )
}
