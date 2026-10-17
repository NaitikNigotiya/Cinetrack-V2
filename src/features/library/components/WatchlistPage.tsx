import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SlidersHorizontal,
  LayoutGrid,
  Heart,
  Film,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react'

import { useLibrary } from '../hooks/useLibrary'
import { updateLibraryEntry } from '../api/libraryApi'
import { useAuthStore } from '@/features/auth/store/authStore'
import { getPosterUrl, getBackdropUrl } from '@/shared/lib/tmdbImage'
import { BottomSheet } from '@/shared/ui/BottomSheet/BottomSheet'
import { PosterCard } from '@/shared/ui/PosterCard/PosterCard'
import { toast } from '@/shared/ui'
import type { LibraryEntry, LibraryStatus } from '@/shared/schemas'
import './WatchlistPage.css'

// ─── Constants & Option Mappings ──────────────────────────────────────────────

const STATUS_LABELS: Record<LibraryStatus, string> = {
  watching: 'Watching',
  completed: 'Completed',
  plan_to_watch: 'Plan to Watch',
  on_hold: 'On Hold',
  dropped: 'Dropped',
}

const STATUS_COLORS: Record<LibraryStatus, string> = {
  watching: 'var(--status-watching)',
  completed: 'var(--status-completed)',
  plan_to_watch: 'var(--status-plan)',
  on_hold: 'var(--status-on-hold, #f39c12)',
  dropped: 'var(--status-dropped)',
}

type SortKey = 'addedAt' | 'title' | 'rating' | 'year' | 'runtime'

export default function WatchlistPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid
  const { entries, refetch } = useLibrary('all')

  // View settings
  const [viewType, setViewType] = useState<'smart' | 'status'>('smart')
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | LibraryStatus>('plan_to_watch')
  const [activeSmartTab, setActiveSmartTab] = useState<'watchSoon' | 'thisWeekend' | 'waitingForRelease' | 'maybeLater'>('watchSoon')

  // Filter Bottom Sheet states
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('addedAt')
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])

  // Temporary filter states inside sheet
  const [tempSortBy, setTempSortBy] = useState<SortKey>(sortBy)
  const [tempFilterType, setTempFilterType] = useState<'all' | 'movie' | 'tv'>(filterType)
  const [tempGenres, setTempGenres] = useState<string[]>(selectedGenres)

  // ── All unique genres from current library ──
  const availableGenres = useMemo(() => {
    const genres = new Set<string>()
    entries.forEach((e) => {
      e.genres?.forEach((g) => {
        if (g.name) genres.add(g.name)
      })
    })
    return Array.from(genres).sort()
  }, [entries])

  // ── Apply filters to general list ──
  const filteredAndSortedList = useMemo(() => {
    let list = [...entries]

    // Media type filter
    if (filterType !== 'all') {
      list = list.filter((e) => e.type === filterType)
    }

    // Genres filter
    if (selectedGenres.length > 0) {
      list = list.filter((e) => e.genres?.some((g) => selectedGenres.includes(g.name)))
    }

    // Status tab filter (only in status view)
    if (viewType === 'status' && activeStatusTab !== 'all') {
      list = list.filter((e) => e.status === activeStatusTab)
    }

    // Sort logic
    return list.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0)
      }
      if (sortBy === 'year') {
        return (b.year ?? 0) - (a.year ?? 0)
      }
      if (sortBy === 'runtime') {
        return (b.runtimeMinutes ?? 0) - (a.runtimeMinutes ?? 0)
      }
      // addedAt default
      const timeA = a.addedAt?.seconds ? a.addedAt.seconds * 1000 : (a.addedAt ? new Date(a.addedAt).getTime() : 0)
      const timeB = b.addedAt?.seconds ? b.addedAt.seconds * 1000 : (b.addedAt ? new Date(b.addedAt).getTime() : 0)
      return timeB - timeA
    })
  }, [entries, filterType, selectedGenres, viewType, activeStatusTab, sortBy])

  // ── SMART SECTIONS (4 smart categories) ──
  const smartSections = useMemo(() => {
    const basePlan = entries.filter((e) => e.status === 'plan_to_watch' || e.status === 'watching')

    // Watch Soon: High rating (>= 8) or favorite or currently watching
    const watchSoon = basePlan.filter((e) => (e.rating && e.rating >= 8) || e.isFavorite || e.status === 'watching')

    // This Weekend: Short runtime (< 120 mins) or popular comedy/action
    const thisWeekend = basePlan.filter(
      (e) => (e.runtimeMinutes && e.runtimeMinutes > 0 && e.runtimeMinutes <= 120) ||
        e.genres?.some((g) => ['Action', 'Comedy', 'Animation'].includes(g.name))
    )

    // Waiting for release: Year >= current year or TV show with future air date
    const currentYear = new Date().getFullYear()
    const waitingForRelease = basePlan.filter((e) => (e.year && e.year >= currentYear) || Boolean(e.tv?.nextAirDate))

    // Maybe Later: Lower priority / remaining
    const usedKeys = new Set([
      ...watchSoon.map((e) => e.titleKey),
      ...thisWeekend.map((e) => e.titleKey),
      ...waitingForRelease.map((e) => e.titleKey),
    ])
    const maybeLater = basePlan.filter((e) => !usedKeys.has(e.titleKey))

    return {
      watchSoon: watchSoon.slice(0, 20),
      thisWeekend: thisWeekend.slice(0, 20),
      waitingForRelease: waitingForRelease.slice(0, 20),
      maybeLater: maybeLater.slice(0, 20),
    }
  }, [entries])

  const handleToggleFavorite = async (e: React.MouseEvent, entry: LibraryEntry) => {
    e.stopPropagation()
    if (!uid) return
    try {
      await updateLibraryEntry(uid, entry.titleKey, { isFavorite: !entry.isFavorite })
      toast.success(entry.isFavorite ? 'Removed from favorites' : 'Added to favorites ❤️')
      void refetch()
    } catch {
      toast.error('Failed to update favorite')
    }
  }

  const handleOpenFilterSheet = () => {
    setTempSortBy(sortBy)
    setTempFilterType(filterType)
    setTempGenres(selectedGenres)
    setIsFilterOpen(true)
  }

  const handleApplyFilters = () => {
    setSortBy(tempSortBy)
    setFilterType(tempFilterType)
    setSelectedGenres(tempGenres)
    setIsFilterOpen(false)
  }

  const handleResetFilters = () => {
    setTempSortBy('addedAt')
    setTempFilterType('all')
    setTempGenres([])
    setSortBy('addedAt')
    setFilterType('all')
    setSelectedGenres([])
    setIsFilterOpen(false)
  }

  const handleGenreToggle = (genreName: string) => {
    setTempGenres((prev) =>
      prev.includes(genreName) ? prev.filter((g) => g !== genreName) : [...prev, genreName]
    )
  }

  // Active filter count indicator
  const activeFilterCount =
    (filterType !== 'all' ? 1 : 0) +
    selectedGenres.length +
    (sortBy !== 'addedAt' ? 1 : 0)

  // Render individual card for Smart View
  const renderSmartCard = (entry: LibraryEntry) => {
    const backdropUrl = getBackdropUrl(entry.backdropPath, 'w780')
    const posterFallback = getPosterUrl(entry.posterPath, 'w342')
    const displayImg = backdropUrl || posterFallback

    return (
      <div
        key={entry.titleKey}
        className="wl-smart-card"
        onClick={() => navigate(`/title/${entry.titleKey}`)}
      >
        <div className="wl-smart-card-top">
          {displayImg ? (
            <img src={displayImg} alt={entry.title} className="wl-smart-card-img" loading="lazy" />
          ) : (
            <div className="wl-smart-card-img-ph">
              <Film size={24} />
            </div>
          )}
          <div className="wl-smart-card-overlay" />

          {/* Status Badge */}
          <span
            className="wl-smart-card-status-badge"
            style={{ background: STATUS_COLORS[entry.status] }}
          >
            {STATUS_LABELS[entry.status]}
          </span>

          {/* Rating Badge */}
          {entry.rating != null && (
            <span className="wl-smart-card-rating-badge">
              ⭐ {entry.rating.toFixed(1)}
            </span>
          )}

          {/* Heart favorite button */}
          <button
            className={`wl-smart-card-heart ${entry.isFavorite ? 'wl-smart-card-heart--active' : ''}`}
            onClick={(e) => handleToggleFavorite(e, entry)}
            aria-label={entry.isFavorite ? 'Remove favorite' : 'Add favorite'}
            type="button"
          >
            <Heart size={14} fill={entry.isFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* Title block over gradient */}
          <div className="wl-smart-card-title-block">
            <h4 className="wl-smart-card-title">{entry.title}</h4>
            <span className="wl-smart-card-year">
              {entry.year || '—'} · {entry.type === 'tv' ? 'TV Series' : 'Movie'}
            </span>
          </div>
        </div>

        <div className="wl-smart-card-bottom">
          {/* Genres Chips */}
          <div className="wl-smart-card-genres">
            {entry.genres?.slice(0, 3).map((g) => (
              <span key={g.id || g.name} className="wl-smart-genre-chip">
                {g.name}
              </span>
            ))}
          </div>

          <div className="wl-smart-card-footer">
            <div className="wl-smart-stars">
              {entry.rating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--star-filled, #f5c518)' }}>
                  <Star size={12} fill="currentColor" />
                  <span>{entry.rating.toFixed(1)}</span>
                </div>
              ) : null}
            </div>
            <span className="wl-smart-added-date">
              {entry.runtimeMinutes ? `${entry.runtimeMinutes}m` : ''}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="watchlist-page">
      {/* ─── Top Header ─── */}
      <header className="wl-header">
        <div>
          <h1 className="wl-title">Watchlist</h1>
          <p className="wl-count-label">
            {entries.length} {entries.length === 1 ? 'title' : 'titles'} in total
          </p>
        </div>

        <div className="wl-header-actions">
          <button
            className="wl-btn-add-movie"
            onClick={() => navigate('/search')}
            type="button"
          >
            <Plus size={16} />
            <span>Add Title</span>
          </button>

          <button
            className={`wl-filter-icon-btn ${activeFilterCount > 0 ? 'wl-filter-icon-btn--active' : ''}`}
            onClick={handleOpenFilterSheet}
            aria-label="Filter and Sort Watchlist"
            title="Filter and Sort"
            type="button"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* ─── View Mode Toggle ─── */}
      <div className="wl-control-row">
        <div className="wl-mode-toggle-group" role="tablist">
          <button
            className={`wl-mode-btn ${viewType === 'smart' ? 'wl-mode-btn--active' : ''}`}
            onClick={() => setViewType('smart')}
            role="tab"
            aria-selected={viewType === 'smart'}
            type="button"
          >
            <Sparkles size={14} />
            <span>Smart View</span>
          </button>

          <button
            className={`wl-mode-btn ${viewType === 'status' ? 'wl-mode-btn--active' : ''}`}
            onClick={() => setViewType('status')}
            role="tab"
            aria-selected={viewType === 'status'}
            type="button"
          >
            <LayoutGrid size={14} />
            <span>All by Status</span>
          </button>
        </div>
      </div>

      {/* ─── View 1: Smart Sections (Kanban Columns) ─── */}
      {viewType === 'smart' && (
        <>
          {/* Mobile Tab Selector */}
          <div className="wl-smart-tabs-row mobile-only-flex">
            {[
              { id: 'watchSoon', label: 'Watch Soon', count: smartSections.watchSoon.length },
              { id: 'thisWeekend', label: 'This Weekend', count: smartSections.thisWeekend.length },
              { id: 'waitingForRelease', label: 'Coming Soon', count: smartSections.waitingForRelease.length },
              { id: 'maybeLater', label: 'Maybe Later', count: smartSections.maybeLater.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSmartTab(tab.id as any)}
                className={`wl-status-tab-btn ${activeSmartTab === tab.id ? 'wl-status-tab-btn--active' : ''}`}
                type="button"
              >
                {tab.label}
                <span className="wl-status-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="wl-smart-container">
            {/* Column 1: Watch Soon */}
            <div className={`wl-smart-column ${activeSmartTab === 'watchSoon' ? 'wl-smart-column--active' : 'wl-smart-column--hidden-mobile'}`}>
              <h3 className="wl-column-title">Watch Soon</h3>
              <span className="wl-column-badge">{smartSections.watchSoon.length} titles</span>
              <div className="wl-column-cards-list">
                {smartSections.watchSoon.length === 0 ? (
                  <p className="wl-column-empty">No high priority titles</p>
                ) : (
                  smartSections.watchSoon.map(renderSmartCard)
                )}
              </div>
            </div>

            {/* Column 2: This Weekend */}
            <div className={`wl-smart-column ${activeSmartTab === 'thisWeekend' ? 'wl-smart-column--active' : 'wl-smart-column--hidden-mobile'}`}>
              <h3 className="wl-column-title">This Weekend</h3>
              <span className="wl-column-badge">{smartSections.thisWeekend.length} titles</span>
              <div className="wl-column-cards-list">
                {smartSections.thisWeekend.length === 0 ? (
                  <p className="wl-column-empty">No short titles saved</p>
                ) : (
                  smartSections.thisWeekend.map(renderSmartCard)
                )}
              </div>
            </div>

            {/* Column 3: Waiting for Release */}
            <div className={`wl-smart-column ${activeSmartTab === 'waitingForRelease' ? 'wl-smart-column--active' : 'wl-smart-column--hidden-mobile'}`}>
              <h3 className="wl-column-title">Waiting For Release</h3>
              <span className="wl-column-badge">{smartSections.waitingForRelease.length} titles</span>
              <div className="wl-column-cards-list">
                {smartSections.waitingForRelease.length === 0 ? (
                  <p className="wl-column-empty">No upcoming titles</p>
                ) : (
                  smartSections.waitingForRelease.map(renderSmartCard)
                )}
              </div>
            </div>

            {/* Column 4: Maybe Later */}
            <div className={`wl-smart-column ${activeSmartTab === 'maybeLater' ? 'wl-smart-column--active' : 'wl-smart-column--hidden-mobile'}`}>
              <h3 className="wl-column-title">Maybe Later</h3>
              <span className="wl-column-badge">{smartSections.maybeLater.length} titles</span>
              <div className="wl-column-cards-list">
                {smartSections.maybeLater.length === 0 ? (
                  <p className="wl-column-empty">No backlogged titles</p>
                ) : (
                  smartSections.maybeLater.map(renderSmartCard)
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── View 2: Status View (Grid) ─── */}
      {viewType === 'status' && (
        <div className="wl-status-container">
          <div className="wl-status-tabs-row" role="tablist">
            {(['all', 'plan_to_watch', 'watching', 'completed', 'on_hold', 'dropped'] as const).map((status) => {
              const label = status === 'all' ? 'All' : STATUS_LABELS[status]
              const count = status === 'all' ? entries.length : entries.filter((e) => e.status === status).length

              return (
                <button
                  key={status}
                  className={`wl-status-tab-btn ${activeStatusTab === status ? 'wl-status-tab-btn--active' : ''}`}
                  onClick={() => setActiveStatusTab(status)}
                  role="tab"
                  aria-selected={activeStatusTab === status}
                  type="button"
                >
                  {label}
                  <span className="wl-status-tab-count">{count}</span>
                </button>
              )
            })}
          </div>

          {filteredAndSortedList.length === 0 ? (
            <p className="wl-tab-empty-msg">No titles found in this category.</p>
          ) : (
            <div
              className="media-card-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredAndSortedList.map((entry) => (
                <PosterCard
                  key={entry.titleKey}
                  title={entry.title}
                  year={entry.year}
                  posterPath={entry.posterPath}
                  rating={entry.rating}
                  type={entry.type}
                  status={entry.status}
                  isFavorite={entry.isFavorite}
                  onClick={() => navigate(`/title/${entry.titleKey}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Filter & Sort Bottom Sheet ─── */}
      <BottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        label="Filter & Sort Watchlist"
      >
        <div className="wl-filter-sheet-body">
          {/* Section: Sort By */}
          <div className="wl-filter-section">
            <h4 className="wl-filter-heading">Sort By</h4>
            <div className="wl-filter-radio-group">
              {[
                { id: 'addedAt', label: 'Date Added (Newest First)' },
                { id: 'rating', label: 'Highest Rating' },
                { id: 'title', label: 'Title (A-Z)' },
                { id: 'year', label: 'Release Year' },
                { id: 'runtime', label: 'Runtime Length' },
              ].map((opt) => (
                <label key={opt.id} className="wl-filter-radio-lbl">
                  <input
                    type="radio"
                    name="wl-sort"
                    className="wl-filter-radio-input"
                    checked={tempSortBy === opt.id}
                    onChange={() => setTempSortBy(opt.id as SortKey)}
                  />
                  <span className="wl-filter-radio-custom" />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section: Media Type */}
          <div className="wl-filter-section">
            <h4 className="wl-filter-heading">Media Type</h4>
            <div className="wl-filter-pills-row">
              {(['all', 'movie', 'tv'] as const).map((t) => (
                <button
                  key={t}
                  className={`wl-filter-pill-btn ${tempFilterType === t ? 'wl-filter-pill-btn--active' : ''}`}
                  onClick={() => setTempFilterType(t)}
                  type="button"
                >
                  {t === 'all' ? 'All Types' : t === 'movie' ? 'Movies Only' : 'TV Shows Only'}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Genres Filter */}
          {availableGenres.length > 0 && (
            <div className="wl-filter-section">
              <h4 className="wl-filter-heading">Genres</h4>
              <div className="wl-filter-genre-grid">
                {availableGenres.map((g) => {
                  const isActive = tempGenres.includes(g)
                  return (
                    <button
                      key={g}
                      className={`wl-filter-genre-chip ${isActive ? 'wl-filter-genre-chip--active' : ''}`}
                      onClick={() => handleGenreToggle(g)}
                      type="button"
                    >
                      {g}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="wl-filter-actions">
            <button className="wl-filter-apply-btn" onClick={handleApplyFilters} type="button">
              Apply Filters
            </button>
            <button className="wl-filter-reset-btn" onClick={handleResetFilters} type="button">
              Reset All
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
