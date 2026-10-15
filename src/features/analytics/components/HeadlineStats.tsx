import { Film, Tv, Clock, Star, Flame, Trophy } from 'lucide-react'
import type { StatsSummary } from '@/shared/schemas'
import styles from './HeadlineStats.module.css'

interface HeadlineStatsProps {
  summary: StatsSummary | null
}

export function HeadlineStats({ summary }: HeadlineStatsProps) {
  const totalHours = (((summary?.minutesWatched ?? 0) / 60)).toFixed(1)
  const avgRating =
    summary && summary.ratingCount > 0
      ? (summary.ratingSum / summary.ratingCount).toFixed(1)
      : '—'

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <Film size={22} className={styles.movieIcon} />
        </div>
        <div className={styles.info}>
          <span className={styles.value}>{summary?.moviesWatched ?? 0}</span>
          <span className={styles.label}>Movies Watched</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <Tv size={22} className={styles.tvIcon} />
        </div>
        <div className={styles.info}>
          <span className={styles.value}>{summary?.episodesWatched ?? 0}</span>
          <span className={styles.label}>Episodes Watched</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <Clock size={22} className={styles.timeIcon} />
        </div>
        <div className={styles.info}>
          <span className={styles.value}>{totalHours}h</span>
          <span className={styles.label}>Total Watch Time</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <Star size={22} className={styles.starIcon} />
        </div>
        <div className={styles.info}>
          <span className={styles.value}>{avgRating}</span>
          <span className={styles.label}>Average Rating</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <Flame size={22} className={styles.streakIcon} />
        </div>
        <div className={styles.info}>
          <span className={styles.value}>
            {summary?.currentStreak ?? 0} {summary?.currentStreak === 1 ? 'day' : 'days'}
          </span>
          <span className={styles.label}>
            Current Streak (Best: {summary?.longestStreak ?? 0})
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <Trophy size={22} className={styles.trophyIcon} />
        </div>
        <div className={styles.info}>
          <span className={styles.value}>{summary?.titlesCompleted ?? 0}</span>
          <span className={styles.label}>Titles Completed</span>
        </div>
      </div>
    </div>
  )
}
