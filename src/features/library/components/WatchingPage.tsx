import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Check, Film, Sparkles } from 'lucide-react'

import { useAppStore } from '@/domain/store'
import { selectWatchingList, toDomainDate } from '@/domain'
import { markMovieWatched, setStatus } from '@/domain/operations'
import { useAuthStore } from '@/features/auth/store/authStore'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import {
  toast,
  PageShell,
  PageHeader,
  FilterBar,
  EmptyStateCard,
  Button,
} from '@/shared/ui'
import type { DomainLibraryEntry } from '@/domain'
import './WatchingPage.css'

export default function WatchingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid
  const { library } = useAppStore()

  // Single source of truth: strictly status === 'watching' ONLY (movies and TV)
  const watchingEntries = useMemo(() => selectWatchingList(library), [library])

  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies')
  const [sortBy, setSortBy] = useState<'newest' | 'updated' | 'title'>('newest')

  const movieEntries = useMemo(() => watchingEntries.filter((e) => e.type === 'movie'), [watchingEntries])
  const tvEntries = useMemo(() => watchingEntries.filter((e) => e.type === 'tv'), [watchingEntries])
  const currentEntries = activeTab === 'movies' ? movieEntries : tvEntries

  const sortedEntries = useMemo(() => {
    return [...currentEntries].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === 'updated') {
        const timeA = toDomainDate(a.updatedAt)?.getTime() || 0
        const timeB = toDomainDate(b.updatedAt)?.getTime() || 0
        return timeB - timeA
      }
      const timeA = toDomainDate(a.addedAt)?.getTime() || 0
      const timeB = toDomainDate(b.addedAt)?.getTime() || 0
      return timeB - timeA
    })
  }, [currentEntries, sortBy])

  const handleMarkCompleted = async (e: React.MouseEvent, entry: DomainLibraryEntry) => {
    e.stopPropagation()
    if (!uid) return
    try {
      if (entry.type === 'movie') {
        await markMovieWatched(uid, entry.titleKey, entry)
      } else {
        await setStatus(uid, entry.titleKey, 'completed', entry)
        toast.success(`Marked "${entry.title}" as completed! 🎉`)
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow={<><Sparkles size={14} /> In Progress</>}
        title="Watching"
        subtitle="Titles currently in progress"
        meta={<span>{watchingEntries.length} {watchingEntries.length === 1 ? 'title' : 'titles'} in total</span>}
      />

      {/* FilterBar with Pill Tabs and Right-aligned Sort */}
      <FilterBar
        tabs={[
          { id: 'movies', label: 'Movies', count: movieEntries.length },
          { id: 'tv', label: 'TV Shows', count: tvEntries.length },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        sortOptions={[
          { value: 'newest', label: 'Newest Added' },
          { value: 'updated', label: 'Recently Updated' },
          { value: 'title', label: 'Title (A-Z)' },
        ]}
        sortValue={sortBy}
        onSortChange={(val) => setSortBy(val as any)}
      />

      {/* Grid */}
      {sortedEntries.length === 0 ? (
        <EmptyStateCard
          icon="🍿"
          title="Nothing currently in progress"
          description={`You don't have any ${activeTab === 'movies' ? 'movies' : 'TV shows'} in progress. Search for titles to start watching.`}
          action={
            <Button variant="primary" onClick={() => navigate('/search')}>
              Browse Titles
            </Button>
          }
        />
      ) : (
        <div className="watching-grid">
          {sortedEntries.map((entry) => {
            const poster = getPosterUrl(entry.posterPath, 'w342')
            const isTv = entry.type === 'tv'
            const watched = entry.tv?.episodesWatched || 0
            const total = entry.tv?.totalEpisodes || 0
            const progressPercent = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0

            return (
              <div
                key={entry.titleKey}
                className="watching-card"
                onClick={() => navigate(`/title/${entry.titleKey}`)}
              >
                {/* Poster container */}
                <div className="watching-poster-wrap">
                  {poster ? (
                    <img src={poster} alt={entry.title} className="watching-poster-img" />
                  ) : (
                    <div className="watching-poster-fallback">
                      <Film size={32} />
                    </div>
                  )}

                  {/* Complete Action Button Overlay */}
                  <button
                    type="button"
                    className="watching-complete-btn"
                    title="Mark as completed"
                    onClick={(e) => handleMarkCompleted(e, entry)}
                  >
                    <Check size={16} />
                  </button>
                </div>

                {/* Info Container */}
                <div className="watching-info">
                  <h3 className="watching-title">{entry.title}</h3>
                  <div className="watching-meta">
                    <span>{entry.year || '—'}</span>
                    <span>•</span>
                    <span>{isTv ? `${total} eps` : entry.runtimeMinutes ? `${entry.runtimeMinutes}m` : 'Movie'}</span>
                  </div>

                  {/* TV Progress Bar or Movie CTA */}
                  {isTv ? (
                    <div className="watching-progress-container">
                      <div className="watching-progress-bar">
                        <div
                          className="watching-progress-fill"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="watching-progress-label">
                        <span>{watched} of {total} watched</span>
                        <span>{progressPercent}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="watching-movie-action">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Play size={12} fill="currentColor" />}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/title/${entry.titleKey}`)
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
