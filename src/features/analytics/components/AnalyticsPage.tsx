import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { toast } from '@/shared/ui/Toast/toastStore'
import {
  fetchStatsSummary,
  fetchMonthlyStats,
  fetchLibraryInsights,
  fetchActivityMap,
  recomputeStats,
} from '../api/analyticsApi'
import { HeadlineStats } from './HeadlineStats'
import { WatchTimeChart } from './WatchTimeChart'
import { TopGenresChart } from './TopGenresChart'
import { RatingDistributionChart } from './RatingDistributionChart'
import { DecadeDistributionChart } from './DecadeDistributionChart'
import { TopRatedSection } from './TopRatedSection'
import { ActivityHeatmap } from './ActivityHeatmap'
import { YearInReviewView } from './YearInReviewView'
import styles from './AnalyticsPage.module.css'

export function AnalyticsPage() {
  const { user } = useAuthStore()
  const uid = user?.uid ?? ''
  const queryClient = useQueryClient()

  const summaryQuery = useQuery({
    queryKey: ['stats', 'summary', uid],
    queryFn: () => fetchStatsSummary(uid),
    enabled: Boolean(uid),
  })

  const monthlyQuery = useQuery({
    queryKey: ['stats', 'monthly', uid],
    queryFn: () => fetchMonthlyStats(uid),
    enabled: Boolean(uid),
  })

  const insightsQuery = useQuery({
    queryKey: ['stats', 'insights', uid],
    queryFn: () => fetchLibraryInsights(uid),
    enabled: Boolean(uid),
  })

  const activityQuery = useQuery({
    queryKey: ['stats', 'activity', uid],
    queryFn: () => fetchActivityMap(uid),
    enabled: Boolean(uid),
  })

  const repairMutation = useMutation({
    mutationFn: () => recomputeStats(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Viewing statistics successfully repaired & synced!')
    },
    onError: () => {
      toast.error('Failed to repair statistics. Please try again.')
    },
  })

  const isLoading =
    summaryQuery.isLoading ||
    monthlyQuery.isLoading ||
    insightsQuery.isLoading ||
    activityQuery.isLoading

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics & Insights</h1>
          <p className={styles.subtitle}>
            Comprehensive breakdown of your viewing habits, milestones and streaks
          </p>
        </div>

        <button
          type="button"
          className={styles.repairBtn}
          onClick={() => repairMutation.mutate()}
          disabled={repairMutation.isPending || !uid}
          aria-label="Repair and recalculate statistics"
        >
          <RefreshCw
            size={16}
            className={repairMutation.isPending ? styles.spin : undefined}
          />
          <span>{repairMutation.isPending ? 'Repairing...' : 'Repair My Data'}</span>
        </button>
      </div>

      {isLoading ? (
        <div className={styles.skeletonGroup}>
          <div className={styles.skeletonStrip} />
          <div className={styles.skeletonChart} />
          <div className={styles.skeletonChart} />
        </div>
      ) : (
        <>
          <HeadlineStats summary={summaryQuery.data ?? null} />

          <YearInReviewView
            monthlyStats={monthlyQuery.data ?? []}
            availableYears={activityQuery.data?.availableYears ?? []}
          />

          <div className={styles.chartsGrid}>
            <WatchTimeChart data={monthlyQuery.data ?? []} />
            <TopGenresChart genreCounts={summaryQuery.data?.genreCounts} />
          </div>

          <div className={styles.chartsGrid}>
            <RatingDistributionChart
              distribution={insightsQuery.data?.ratingDistribution ?? []}
            />
            <DecadeDistributionChart
              distribution={insightsQuery.data?.decadeDistribution ?? []}
            />
          </div>

          <div className={styles.chartsGrid}>
            <ActivityHeatmap
              dayCounts={activityQuery.data?.dayCounts ?? {}}
            />
            <TopRatedSection
              titles={insightsQuery.data?.topRatedTitles ?? []}
            />
          </div>
        </>
      )}
    </div>
  )
}
