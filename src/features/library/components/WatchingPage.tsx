import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Check, Film } from 'lucide-react'

import { useLibrary } from '../hooks/useLibrary'
import { updateLibraryEntry } from '../api/libraryApi'
import { useAuthStore } from '@/features/auth/store/authStore'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import { toast } from '@/shared/ui'
import type { LibraryEntry } from '@/shared/schemas'
import './WatchingPage.css'

export default function WatchingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid
  const { entries, refetch } = useLibrary('watching')

  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies')
  const [sortBy, setSortBy] = useState<'newest' | 'updated' | 'title'>('newest')

  const movieEntries = useMemo(() => entries.filter((e) => e.type === 'movie'), [entries])
  const tvEntries = useMemo(() => entries.filter((e) => e.type === 'tv'), [entries])
  const currentEntries = activeTab === 'movies' ? movieEntries : tvEntries

  // Memoized sorting
  const sortedEntries = useMemo(() => {
    return [...currentEntries].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === 'updated') {
        const secondsA = a.updatedAt?.seconds ?? 0
        const secondsB = b.updatedAt?.seconds ?? 0
        return secondsB - secondsA
      }
      // 'newest' (addedAt default)
      const secondsA = a.addedAt?.seconds ?? 0
      const secondsB = b.addedAt?.seconds ?? 0
      return secondsB - secondsA
    })
  }, [currentEntries, sortBy])

  const handleMarkCompleted = async (e: React.MouseEvent, entry: LibraryEntry) => {
    e.stopPropagation()
    if (!uid) return
    try {
      await updateLibraryEntry(uid, entry.titleKey, {
        status: 'completed',
        completedAt: new Date(),
      })
      toast.success(`Marked "${entry.title}" as completed! 🎉`)
      void refetch()
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="watching-page">
      <header className="wt-header-v2">
        <div>
          <h1 className="wt-title-v2">Watching</h1>
          <p className="wt-subtitle-v2">Titles currently in progress</p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="wt-sort-select"
          style={{ width: 'auto', flexShrink: 0 }}
        >
          <option value="newest">Newest</option>
          <option value="updated">Recently Updated</option>
          <option value="title">A-Z</option>
        </select>
      </header>

      {/* Tabs */}
      <div className="wt-tabs-row-v2">
        <button
          onClick={() => setActiveTab('movies')}
          className={`wt-tab-btn-v2 ${activeTab === 'movies' ? 'wt-tab-btn-v2--active' : ''}`}
          type="button"
        >
          Movies
          <span className="wt-tab-badge-v2">{movieEntries.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('tv')}
          className={`wt-tab-btn-v2 ${activeTab === 'tv' ? 'wt-tab-btn-v2--active' : ''}`}
          type="button"
        >
          TV Shows
          <span className="wt-tab-badge-v2">{tvEntries.length}</span>
        </button>
      </div>

      {/* Grid */}
      <div className="watching-grid-layout">
        {sortedEntries.length === 0 ? (
          <div className="wt-empty-state-v2">
            <div className="wt-empty-emoji-v2">🎬</div>
            <h3 className="wt-empty-title-v2">Nothing currently in progress.</h3>
            <button
              onClick={() => navigate('/search')}
              className="wt-empty-cta-v2"
              type="button"
            >
              Browse Titles
            </button>
          </div>
        ) : (
          sortedEntries.map((entry) => {
            const totalEps = entry.tv?.totalEpisodes ?? 0
            const watchedEps = entry.tv?.episodesWatched ?? 0
            const progressPercent =
              entry.type === 'tv' && totalEps > 0 ? Math.round((watchedEps / totalEps) * 100) : 0
            const poster = getPosterUrl(entry.posterPath, 'w342')

            return (
              <div
                key={entry.titleKey}
                className="watching-card-compact"
                onClick={() => navigate(`/title/${entry.titleKey}`)}
                style={{ cursor: 'pointer' }}
              >
                {/* Poster */}
                <div className="watching-poster-box">
                  {poster ? (
                    <img src={poster} alt={entry.title} className="watching-poster-img" loading="lazy" />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      <Film size={24} />
                    </div>
                  )}

                  {/* Progress bar */}
                  {entry.type === 'tv' && totalEps > 0 && (
                    <div className="watching-progress-bar-fixed">
                      <div className="watching-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="watching-info-block">
                  <h4 className="watching-card-title">{entry.title}</h4>
                  <div className="watching-card-meta">
                    <span>{entry.year || '—'}</span>
                    {entry.type === 'tv' && totalEps > 0 && (
                      <span className="watching-pill-stat">
                        {watchedEps}/{totalEps} eps ({progressPercent}%)
                      </span>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div className="watching-action-row">
                    <button
                      className="watching-btn-main"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (entry.type === 'tv') {
                          navigate(`/title/${entry.titleKey}/episodes`)
                        } else {
                          navigate(`/title/${entry.titleKey}`)
                        }
                      }}
                      type="button"
                    >
                      <Play size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {entry.type === 'tv' ? 'Track Episodes' : 'Details'}
                    </button>
                    <button
                      className="watching-btn-sub"
                      onClick={(e) => handleMarkCompleted(e, entry)}
                      title="Mark as completed"
                      type="button"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
