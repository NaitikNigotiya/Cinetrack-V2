import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import { createZodConverter } from '@/services/firebase/converters'
import { StatsSummarySchema } from '@/shared/schemas'
import { Skeleton } from '@/shared/ui'
import { Film, Clock, Flame, CheckCircle2 } from 'lucide-react'
import styles from './HomeStatsStrip.module.css'

interface HomeStatsStripProps {
  uid: string
}

const statsConverter = createZodConverter(StatsSummarySchema, 'stats')

export function HomeStatsStrip({ uid }: HomeStatsStripProps) {
  const statsQuery = useQuery({
    queryKey: ['stats', 'summary', uid],
    queryFn: async () => {
      const snap = await getDoc(doc(firestore, `users/${uid}/stats/summary`).withConverter(statsConverter))
      return snap.exists() ? snap.data() : null
    },
    enabled: Boolean(uid),
  })

  if (statsQuery.isLoading) {
    return (
      <div className={styles.strip}>
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={72} />
      </div>
    )
  }

  const stats = statsQuery.data
  const totalWatched = (stats?.moviesWatched ?? 0) + (stats?.episodesWatched ?? 0)
  const totalHours = ((stats?.minutesWatched ?? 0) / 60).toFixed(0)
  const streak = stats?.currentStreak ?? 0
  const completed = stats?.titlesCompleted ?? 0

  return (
    <div className={styles.strip}>
      <div className={styles.statCard}>
        <div className={styles.iconCircle}>
          <Film size={20} className={styles.statIcon} />
        </div>
        <div className={styles.statInfo}>
          <span className={styles.statValue}>{totalWatched}</span>
          <span className={styles.statLabel}>Total Watched</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.iconCircle}>
          <Clock size={20} className={styles.statIcon} />
        </div>
        <div className={styles.statInfo}>
          <span className={styles.statValue}>{totalHours}h</span>
          <span className={styles.statLabel}>Hours Tracked</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.iconCircle}>
          <Flame size={20} className={styles.flameIcon} />
        </div>
        <div className={styles.statInfo}>
          <span className={styles.statValue}>{streak} {streak === 1 ? 'day' : 'days'}</span>
          <span className={styles.statLabel}>Active Streak</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.iconCircle}>
          <CheckCircle2 size={20} className={styles.statIcon} />
        </div>
        <div className={styles.statInfo}>
          <span className={styles.statValue}>{completed}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
      </div>
    </div>
  )
}
