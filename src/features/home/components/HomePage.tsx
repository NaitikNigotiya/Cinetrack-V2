import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { HomeStatsStrip } from './HomeStatsStrip'
import { ContinueWatchingSection } from './ContinueWatchingSection'
import { PlanShortlistSection } from './PlanShortlistSection'
import { ComingUpSection } from './ComingUpSection'
import { DiscoverCarousel } from '@/features/discover/components/DiscoverCarousel'
import { PosterCard, Button } from '@/shared/ui'
import { Search, Compass } from 'lucide-react'
import styles from './HomePage.module.css'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const { user } = useAuthStore()
  const uid = user?.uid
  const userName = user?.displayName ? user.displayName.split(' ')[0] : 'there'

  const [greetingPrefix] = useState(getGreeting)
  const greeting = `${greetingPrefix}, ${userName}!`

  const { entries, isLoading: isLibraryLoading } = useLibrary('all')

  const trendingQuery = useQuery({
    queryKey: ['tmdb', 'trending', 'day'],
    queryFn: () => tmdbClient.getTrending('all', 'day'),
    staleTime: 15 * 60 * 1000,
  })

  // Recently added to library
  const recentlyAdded = entries.slice(0, 8)

  return (
    <div className={styles.container}>
      <header className={styles.heroHeader}>
        <div>
          <h1 className={styles.greeting}>{greeting}</h1>
          <p className={styles.heroSub}>Ready to log your next watch or discover something new?</p>
        </div>

        <div className={styles.quickNav}>
          <Link to="/search">
            <Button variant="secondary" startIcon={<Search size={16} />}>
              Search
            </Button>
          </Link>
          <Link to="/discover">
            <Button variant="primary" startIcon={<Compass size={16} />}>
              Explore
            </Button>
          </Link>
        </div>
      </header>

      {uid && <HomeStatsStrip uid={uid} />}

      <ContinueWatchingSection entries={entries} isLoading={isLibraryLoading} />

      <PlanShortlistSection entries={entries} isLoading={isLibraryLoading} />

      {uid && <ComingUpSection uid={uid} />}

      <DiscoverCarousel
        title="Trending Today"
        subtitle="Popular releases right now"
        items={trendingQuery.data?.results}
        isLoading={trendingQuery.isLoading}
      />

      {recentlyAdded.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recently Added to Library</h2>
            <Link to="/library" className={styles.viewAll}>
              View library
            </Link>
          </div>

          <div className={styles.recentRow}>
            {recentlyAdded.map((entry) => (
              <div key={entry.titleKey} className={styles.recentCardWrapper}>
                <PosterCard
                  title={entry.title}
                  posterPath={entry.posterPath}
                  year={entry.year ?? undefined}
                  type={entry.type}
                  rating={entry.rating ?? undefined}
                  detailHref={`/title/${entry.titleKey}`}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
