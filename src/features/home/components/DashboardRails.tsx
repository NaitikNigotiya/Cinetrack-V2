import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Shuffle, Film, Check, Plus, Search } from 'lucide-react'
import { Section } from '@/shared/ui/layout/Section'
import { Button } from '@/shared/ui/Button/Button'
import { getPosterUrl } from '@/shared/lib/tmdbImage'
import type { LibraryEntry } from '@/shared/schemas'

interface DashboardRailsProps {
  recentlyAdded: LibraryEntry[]
  isLibraryLoading: boolean
  seeds: LibraryEntry[]
  activeSeed: LibraryEntry | undefined
  seedIndex: number
  setSeedIndex: (fn: (prev: number) => number) => void
  onSeedChange: (index: number) => void
  recommendationsLoading: boolean
  recommendationItems: any[]
  entries: LibraryEntry[]
  filteredTrending: any[]
  mood: string | null
  onQuickAdd: (e: React.MouseEvent, item: any) => void
}

export function DashboardRails({
  recentlyAdded,
  isLibraryLoading,
  seeds,
  activeSeed,
  seedIndex,
  setSeedIndex,
  onSeedChange,
  recommendationsLoading,
  recommendationItems,
  entries,
  filteredTrending,
  mood,
  onQuickAdd,
}: DashboardRailsProps) {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      {/* 1. RECENTLY ADDED */}
      <Section
        title="Recently Added"
        action={
          <Link to="/library" style={{ fontSize: 'var(--fs-small)', color: 'var(--brand-primary)', textDecoration: 'none' }}>
            View all →
          </Link>
        }
      >
        {isLibraryLoading ? (
          <div className="hp-rail-scroll">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="hp-rail-skeleton" />
            ))}
          </div>
        ) : recentlyAdded.length > 0 ? (
          <div className="hp-rail-scroll">
            {recentlyAdded.map((item) => {
              const poster = getPosterUrl(item.posterPath, 'w185')
              return (
                <article
                  key={item.titleKey}
                  className="hp-poster-card"
                  onClick={() => navigate(`/title/${item.titleKey}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="hp-poster-wrap">
                    {poster ? (
                      <img src={poster} alt={item.title} className="hp-poster-img" loading="lazy" />
                    ) : (
                      <div className="hp-poster-fallback">
                        <Film size={20} />
                      </div>
                    )}
                    {item.rating !== null && item.rating !== undefined && (
                      <span className="hp-rating-badge">⭐ {item.rating.toFixed(1)}</span>
                    )}
                  </div>
                  <p className="hp-card-title">{item.title}</p>
                  <p className="hp-card-year">{item.year ?? '—'}</p>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="hp-rail-empty">No titles added to your library yet.</div>
        )}
      </Section>

      {/* 2. MAGIC RECOMMENDATIONS */}
      <Section
        title={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--brand-primary)' }} />
              Magic Recommendations
            </span>
            {activeSeed && (
              <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', fontWeight: 400 }}>
                Based on your interest in{' '}
                <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{activeSeed.title}</span>
              </span>
            )}
          </div>
        }
        action={
          seeds.length > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="hp-seed-select-wrap">
                <select
                  value={seedIndex}
                  onChange={(e) => onSeedChange(parseInt(e.target.value, 10))}
                  className="hp-seed-select"
                  aria-label="Recommendation seed title"
                >
                  {seeds.map((s, idx) => (
                    <option key={s.titleKey} value={idx}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="hp-seed-shuffle-btn"
                onClick={() => setSeedIndex((prev) => (prev + 1) % seeds.length)}
                title="Shuffle recommendation source"
                aria-label="Shuffle source"
                type="button"
              >
                <Shuffle size={12} />
              </button>
            </div>
          ) : undefined
        }
      >
        {seeds.length === 0 ? (
          <div className="hp-magic-empty-banner">
            <div className="hp-magic-empty-content">
              <span className="hp-magic-empty-sparkle">✨</span>
              <h3 className="hp-magic-empty-title">Unlock Magic Recommendations</h3>
              <p className="hp-magic-empty-desc">
                Add titles to your library, rate them, or mark them as completed to get personalized recommendations!
              </p>
              <Button
                variant="primary"
                size="sm"
                style={{ margin: '8px auto 0 auto' }}
                onClick={() => navigate('/search')}
              >
                <Search size={13} style={{ marginRight: '6px' }} /> Find movies & shows
              </Button>
            </div>
          </div>
        ) : recommendationsLoading ? (
          <div className="hp-rail-scroll">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="hp-rail-skeleton" />
            ))}
          </div>
        ) : recommendationItems.length > 0 ? (
          <div className="hp-rail-scroll">
            {recommendationItems.map((item) => {
              const poster = getPosterUrl(item.poster_path, 'w185')
              const title = item.title ?? item.name ?? 'Untitled'
              const mediaType = item.media_type || (item.release_date ? 'movie' : 'tv')
              const titleKey = `${mediaType}:${item.id}`
              const isAdded = entries.some((w) => w.titleKey === titleKey)
              const year = (item.release_date ?? item.first_air_date)?.slice(0, 4) ?? ''
              const rating = item.vote_average ? item.vote_average.toFixed(1) : null

              return (
                <article
                  key={item.id}
                  className="hp-poster-card"
                  onClick={() => navigate(`/title/${titleKey}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="hp-poster-wrap">
                    {poster ? (
                      <img src={poster} alt={title} className="hp-poster-img" loading="lazy" />
                    ) : (
                      <div className="hp-poster-fallback">
                        <Film size={20} />
                      </div>
                    )}
                    {rating && <span className="hp-rating-badge">⭐ {rating}</span>}
                    <button
                      className={`hp-add-badge ${isAdded ? 'hp-add-badge--added' : ''}`}
                      onClick={(e) => onQuickAdd(e, item)}
                      disabled={isAdded}
                      aria-label={isAdded ? 'Already in library' : 'Add to watchlist'}
                      type="button"
                    >
                      {isAdded ? <Check size={10} /> : <Plus size={10} />}
                    </button>
                  </div>
                  <p className="hp-card-title">{title}</p>
                  <p className="hp-card-year">{year}</p>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="hp-rail-empty">
            No recommendations found for this title. Try selecting a different title!
          </div>
        )}
      </Section>

      {/* 3. YOU MIGHT LIKE */}
      <Section
        title={
          <span>
            You Might Like
            {mood && <span className="hp-mood-pill"> · {mood}</span>}
          </span>
        }
      >
        {filteredTrending.length > 0 ? (
          <div className="hp-rail-scroll">
            {filteredTrending.map((item) => {
              const poster = getPosterUrl(item.poster_path, 'w185')
              const title = item.title ?? item.name ?? 'Untitled'
              const mediaType = item.media_type || (item.release_date ? 'movie' : 'tv')
              const titleKey = `${mediaType}:${item.id}`
              const isAdded = entries.some((w) => w.titleKey === titleKey)
              const year = (item.release_date ?? item.first_air_date)?.slice(0, 4) ?? ''
              const rating = item.vote_average ? item.vote_average.toFixed(1) : null

              return (
                <article
                  key={item.id}
                  className="hp-poster-card"
                  onClick={() => navigate(`/title/${titleKey}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="hp-poster-wrap">
                    {poster ? (
                      <img src={poster} alt={title} className="hp-poster-img" loading="lazy" />
                    ) : (
                      <div className="hp-poster-fallback">
                        <Film size={20} />
                      </div>
                    )}
                    {rating && <span className="hp-rating-badge">⭐ {rating}</span>}
                    <button
                      className={`hp-add-badge ${isAdded ? 'hp-add-badge--added' : ''}`}
                      onClick={(e) => onQuickAdd(e, item)}
                      disabled={isAdded}
                      aria-label={isAdded ? 'Already in library' : 'Add to watchlist'}
                      type="button"
                    >
                      {isAdded ? <Check size={10} /> : <Plus size={10} />}
                    </button>
                  </div>
                  <p className="hp-card-title">{title}</p>
                  <p className="hp-card-year">{year}</p>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="hp-rail-empty">Loading suggestions…</div>
        )}
      </Section>
    </div>
  )
}
