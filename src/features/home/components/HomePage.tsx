import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  Star,
  Flame,
  Tv,
  Clapperboard,
  Settings,
} from 'lucide-react'

import { useAuthStore } from '@/features/auth/store/authStore'
import { useAppStore } from '@/domain/store'
import { addToLibrary } from '@/domain/operations'
import { toast } from '@/shared/ui'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatRow } from '@/shared/ui/layout/StatRow'
import { StatTile } from '@/shared/ui/layout/StatTile'
import { Section } from '@/shared/ui/layout/Section'
import { Button } from '@/shared/ui/Button/Button'
import { DashboardAside } from './DashboardAside'
import { DashboardHeroWatching } from './DashboardHeroWatching'
import { DashboardRails } from './DashboardRails'
import { useDashboardData } from '../hooks/useDashboardData'

import './HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Explorer'

  const { library, history, isReady } = useAppStore()

  const {
    currentYear,
    formattedDate,
    formattedTime,
    watchGoal,
    setWatchGoal,
    mood,
    setMood,
    seedIndex,
    setSeedIndex,
    seeds,
    activeSeed,
    recommendationsQuery,
    recommendationItems,
    filteredTrending,
    heroProgress,
    recentlyAdded,
    completedMoviesCount,
    completedTVCount,
    hoursWatched,
    streak,
    avgRating,
    recentActivities,
    dailyQuote,
  } = useDashboardData(uid, library, history)

  const handleQuickAdd = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    if (!uid) {
      toast.info('Please sign in to add to your library')
      return
    }
    const type = item.media_type === 'tv' ? 'tv' : 'movie'
    const titleKey = `${type}:${item.id}`
    if (library.some((w) => w.titleKey === titleKey)) return
    const year = parseInt((item.release_date ?? item.first_air_date)?.slice(0, 4) || '0', 10) || undefined
    const title = item.title ?? item.name ?? 'Untitled'
    try {
      await addToLibrary(uid, {
        titleKey,
        tmdbId: item.id,
        type,
        title,
        year,
        posterPath: item.poster_path ?? undefined,
        backdropPath: item.backdrop_path ?? undefined,
        status: 'plan_to_watch',
      })
      toast.success(`Added "${title}" to Plan to Watch`)
    } catch {
      toast.error('Failed to add title')
    }
  }

  const handleRandomPick = () => {
    const ptw = library.filter((e) => e.status === 'plan_to_watch')
    if (!ptw.length) {
      toast.info('No titles in your "Plan to Watch" list yet!')
      return
    }
    const picked = ptw[Math.floor(Math.random() * ptw.length)]!
    navigate(`/title/${picked.titleKey}`)
  }

  return (
    <PageShell
      aside={
        <DashboardAside
          currentYear={currentYear}
          completedMoviesCount={completedMoviesCount}
          watchGoal={watchGoal}
          setWatchGoal={setWatchGoal}
          mood={mood}
          onSelectMood={(m) => {
            const next = mood === m ? null : m
            setMood(next)
            if (next) localStorage.setItem('cinetrack-mood', next)
            else localStorage.removeItem('cinetrack-mood')
          }}
          recentActivities={recentActivities}
          dailyQuote={dailyQuote}
          onRandomPick={handleRandomPick}
        />
      }
    >
      <PageHeader
        eyebrow="TODAY"
        title={`Welcome back, ${firstName} 👋`}
        subtitle="What are we watching today?"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
              {formattedDate} · {formattedTime}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              aria-label="Settings"
            >
              <Settings size={16} />
            </Button>
          </div>
        }
      />

      <StatRow>
        <StatTile
          icon={<Clapperboard size={20} />}
          value={completedMoviesCount}
          label="Movies"
        />
        <StatTile
          icon={<Tv size={20} />}
          value={completedTVCount}
          label="TV Shows"
        />
        <StatTile
          icon={<Clock size={20} />}
          value={hoursWatched}
          label="Hours Watched"
        />
        <StatTile
          icon={<Flame size={20} />}
          value={streak}
          label="Day Streak"
        />
        <StatTile
          icon={<Star size={20} />}
          value={avgRating}
          label="Avg. Rating"
        />
      </StatRow>

      <Section title="Continue Watching">
        <DashboardHeroWatching heroProgress={heroProgress} />
      </Section>

      <DashboardRails
        recentlyAdded={recentlyAdded as any}
        isLibraryLoading={!isReady}
        seeds={seeds as any}
        activeSeed={activeSeed as any}
        seedIndex={seedIndex}
        setSeedIndex={setSeedIndex}
        onSeedChange={setSeedIndex}
        recommendationsLoading={recommendationsQuery.isLoading}
        recommendationItems={recommendationItems}
        entries={library as any}
        filteredTrending={filteredTrending}
        mood={mood}
        onQuickAdd={handleQuickAdd}
      />
    </PageShell>
  )
}
