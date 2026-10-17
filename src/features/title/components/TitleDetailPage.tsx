import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  Star,
  Play,
  Check,
  Plus,
  Trash2,
  Edit,
  MoreHorizontal,
  Lightbulb,
  Film,
  Clock,
  X,
  Share2,
  FolderOpen,
  FileText,
  ChevronDown,
  ListChecks,
} from 'lucide-react'
import {
  collection,
  query as firestoreQuery,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import { useAuthStore } from '@/features/auth/store/authStore'
import { parseTitleKey } from '@/shared/lib/ids'
import { useTitleDetails, useSeason } from '@/services/tmdb/hooks'
import { getBackdropUrl, getPosterUrl, getProfileUrl, getStillUrl } from '@/services/tmdb/images'
import { useLibraryEntry } from '../hooks/useLibraryEntry'
import {
  addToLibrary,
  setStatus,
  toggleFavorite,
  removeFromLibraryWithUndo,
  updateLibraryEntry,
  setRating,
} from '@/features/library/api/libraryApi'
import { fetchCollections, addItemToCollection } from '@/features/collections/api/collectionsApi'
import { logPastWatch } from '@/features/history/api/historyApi'
import { BottomSheet, PosterCard, TrailerModal, toast } from '@/shared/ui'
import type { LibraryStatus, Collection } from '@/shared/schemas'
import './TitleDetailPage.css'

// ─── Constants & Options ──────────────────────────────────────────────────────

const STATUS_OPTS: { value: LibraryStatus; label: string; emoji: string; desc: string; color: string }[] = [
  { value: 'watching', label: 'Watching', emoji: '👁', desc: 'Actively watching this title', color: 'var(--status-watching)' },
  { value: 'completed', label: 'Completed', emoji: '✓', desc: 'Finished watching this title', color: 'var(--status-completed)' },
  { value: 'plan_to_watch', label: 'Plan to Watch', emoji: '🕐', desc: 'Want to watch in the future', color: 'var(--status-plan)' },
  { value: 'dropped', label: 'Dropped', emoji: '✗', desc: 'Decided to stop watching', color: 'var(--status-dropped)' },
]

// Hardcoded trivia facts for iconic movies
const TRIVIA_DATABASE: Record<number, string[]> = {
  550: [
    "Brad Pitt and Edward Norton actually learned how to make real soap for the film.",
    "The warning screen at the beginning of the movie contains a hidden message from Tyler Durden.",
    "Brad Pitt chipped his front tooth for the role to match Tyler's chaotic look.",
    "Fight Club's author, Chuck Palahniuk, has stated that he thinks the movie is an improvement on his novel.",
    "A CGI coffee cup is hidden in almost every single scene of the movie."
  ],
  278: [
    "Though it was a box office disappointment initially, it became one of the most beloved films of all time through home rentals.",
    "The mugshots of young Red are actually photos of Morgan Freeman's son, Alfonso.",
    "Clint Eastwood, Harrison Ford, and Paul Newman were all considered for the role of Red.",
    "Stephen King sold the film rights to his novella for $5,600, but he never cashed the check.",
    "The iconic sewer crawl was actually done in chocolate syrup diluted with water."
  ],
  238: [
    "Marlon Brando wanted to make Don Corleone look like a bulldog, so he wore a custom mouthpiece.",
    "Al Pacino boycotted the Academy Awards because he was nominated for Supporting Actor while Marlon Brando got Best Actor.",
    "The horse head used in the film was real; the production got it from a dog food company.",
    "The cat held by Marlon Brando in the opening scene was a stray found in the studio lot.",
    "The term 'Godfather' was not widely used by actual mobsters before the book and movie popularized it."
  ],
  155: [
    "Heath Ledger lived alone in a hotel room for a month to formulate the Joker's psychotic personality.",
    "This was the first comic book film to reach the billion-dollar milestone at the box office.",
    "Christopher Nolan chose to shoot several key sequences in IMAX format.",
    "Christian Bale did all of his own stunt driving during the Batpod chases.",
    "The Joker's makeup design was based on Ledger's own collaboration with makeup artists."
  ],
  496243: [
    "It became the first non-English language film to win the Academy Award for Best Picture.",
    "The wealthy family's house was entirely constructed on an outdoor set by a production designer.",
    "Director Bong Joon Ho drew inspiration from his own college years working as a tutor.",
    "The famous 'Jessica Song' was adapted from a real Korean school mnemonic.",
    "Bong Joon Ho initially conceived the idea as a stage play."
  ],
  872585: [
    "No CGI was used for the recreation of the Trinity nuclear test scene.",
    "Cillian Murphy lost significant weight to match J. Robert Oppenheimer's famously thin physique.",
    "The film was shot on large-format IMAX film, including custom-developed black-and-white IMAX stock.",
    "Christopher Nolan's screenplay was uniquely written in the first-person perspective.",
    "It is the highest-grossing biographical film of all time."
  ]
}

const PROVIDERS = [
  { name: 'Netflix', color: '#E50914' },
  { name: 'Prime Video', color: '#00A8E1' },
  { name: 'Apple TV', color: '#1A1A1A' },
  { name: 'Disney+', color: '#113CCF' }
]

interface UserReview {
  id: string
  titleKey: string
  title: string
  year?: string
  rating: number
  reviewText: string
  tags: string[]
  createdAt?: Timestamp
}

function SeasonRowAccordion({
  tmdbId,
  season,
  isOpen,
  onToggle,
}: {
  tmdbId: number
  season: { seasonNumber: number; name: string; episodeCount: number; airDate: string | null; posterPath: string | null }
  isOpen: boolean
  onToggle: () => void
}) {
  const { data: seasonDetail, isLoading } = useSeason(isOpen ? tmdbId : null, isOpen ? season.seasonNumber : null)
  const episodes = seasonDetail?.episodes || []

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: '10px',
      overflow: 'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 16px',
          cursor: 'pointer',
          background: isOpen ? 'var(--bg-elevated)' : 'transparent',
          transition: 'background 150ms ease',
        }}
      >
        {season.posterPath ? (
          <img
            src={getPosterUrl(season.posterPath, 'w185') || ''}
            alt={`Season ${season.seasonNumber}`}
            style={{ width: 40, height: 60, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 40, height: 60, borderRadius: 'var(--radius-sm)', background: 'var(--bg-overlay)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🎬</div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
            {season.name || `Season ${season.seasonNumber}`}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {season.episodeCount} episodes{season.airDate && ` · ${new Date(season.airDate).getFullYear()}`}
          </div>
        </div>

        <span style={{
          fontSize: '18px',
          color: 'var(--text-muted)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 300ms ease',
          flexShrink: 0,
        }}>⌄</span>
      </div>

      {isOpen && (
        <div style={{ borderTop: '1px solid var(--border-default)' }}>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              Loading episodes...
            </div>
          ) : episodes.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              No episodes available.
            </div>
          ) : (
            episodes.map((ep, idx) => (
              <div key={ep.episodeNumber} style={{
                display: 'flex',
                gap: '14px',
                padding: '14px 16px',
                borderBottom: idx < episodes.length - 1 ? '1px solid var(--border-default)' : 'none',
                alignItems: 'flex-start',
              }}>
                {ep.stillPath ? (
                  <img
                    src={getStillUrl(ep.stillPath, 'w300') || ''}
                    alt={ep.name}
                    style={{ width: 100, height: 60, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{ width: 100, height: 60, borderRadius: 'var(--radius-sm)', background: 'var(--bg-overlay)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎬</div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>
                      E{String(ep.episodeNumber).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ep.name}
                    </span>
                  </div>

                  {ep.overview && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ep.overview}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    {ep.runtimeMinutes && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>⏱ {ep.runtimeMinutes}m</span>
                    )}
                    {ep.airDate && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📅 {new Date(ep.airDate).toLocaleDateString()}</span>
                    )}
                    {ep.voteAverage && ep.voteAverage > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--star-filled)' }}>⭐ {ep.voteAverage.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function TitleDetailPage() {
  const { titleKey: rawTitleKey } = useParams<{ titleKey?: string }>()
  const titleKey = rawTitleKey || ''
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid

  const parsed = useMemo(() => (titleKey ? parseTitleKey(titleKey) : null), [titleKey])
  const tmdbId = parsed?.tmdbId ?? 0
  const isMovie = parsed?.type === 'movie'
  const mediaType = isMovie ? 'movie' : 'tv'

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'cast' | 'reviews' | 'similar' | 'images' | 'trivia'>('overview')
  const [openSeasonNumber, setOpenSeasonNumber] = useState<number | null>(1)

  // Lightbox & Trailer
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showTrailer, setShowTrailer] = useState(false)

  // Firestore Reviews
  const [reviewsList, setReviewsList] = useState<UserReview[]>([])
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<UserReview | null>(null)
  const [revTitle, setRevTitle] = useState('')
  const [revRating, setRevRating] = useState(10)
  const [revText, setRevText] = useState('')
  const [revTags, setRevTags] = useState('')

  // Local Notes autosave
  const [localNotes, setLocalNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(true)

  // Sheets & menus
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showStatusSheet, setShowStatusSheet] = useState(false)
  const [showCollectionSheet, setShowCollectionSheet] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>('plan_to_watch')
  const [userCollections, setUserCollections] = useState<Collection[]>([])

  // Watchlist & Details queries
  const { entry, refetch: refetchEntry } = useLibraryEntry(uid, titleKey)
  const { data: details, isLoading: isDetailsLoading, isError } = useTitleDetails(titleKey)

  const isInWatchlist = Boolean(entry)

  // Sync reviews for this title
  useEffect(() => {
    if (!uid || !titleKey) return
    const q = firestoreQuery(
      collection(firestore, `users/${uid}/reviews`),
      where('titleKey', '==', titleKey)
    )
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<UserReview, 'id'>),
      }))
      setReviewsList(items)
    })
  }, [uid, titleKey])

  // Sync collections for Add to Collection sheet
  useEffect(() => {
    if (!uid) return
    fetchCollections(uid)
      .then((cols) => setUserCollections(cols))
      .catch((err) => console.error(err))
  }, [uid])

  // Sync local notes with entry
  useEffect(() => {
    if (entry) {
      setLocalNotes((entry as any).notes || '')
    }
  }, [entry])

  // Debounced autosave notes
  useEffect(() => {
    if (!entry || !uid) return
    const currentNotes = (entry as any).notes || ''
    if (localNotes === currentNotes) return

    setIsSavingNotes(true)
    const timeout = setTimeout(async () => {
      try {
        await updateLibraryEntry(uid, titleKey, { notes: localNotes } as any)
      } catch (err) {
        console.error(err)
      } finally {
        setIsSavingNotes(false)
      }
    }, 800)

    return () => clearTimeout(timeout)
  }, [localNotes, entry, uid, titleKey])

  // Derived values
  const title = details?.title || 'Details'
  const releaseYear = details?.year || 0
  const backdrop = details?.backdropPath ? getBackdropUrl(details.backdropPath, 'original') : null
  const poster = details?.posterPath ? getPosterUrl(details.posterPath, 'w500') : null
  const ratingAverage = details?.voteAverage ? details.voteAverage.toFixed(1) : null

  const runtimeString = useMemo(() => {
    if (details?.runtimeMinutes) {
      const mins = details.runtimeMinutes
      const hrs = Math.floor(mins / 60)
      const remainingMins = mins % 60
      return hrs > 0 ? `${hrs}h ${remainingMins}m` : `${mins}m`
    }
    if (details?.tv) {
      const seasonsCount = details.tv.totalSeasons
      return `${seasonsCount} Season${seasonsCount > 1 ? 's' : ''}`
    }
    return ''
  }, [details])

  const trailerKey = useMemo(() => {
    return details?.trailerKey || null
  }, [details])

  const similarTitles = useMemo(() => {
    return details?.recommendations || []
  }, [details])

  const images = useMemo(() => {
    return (details as any)?.images?.backdrops?.slice(0, 12) || []
  }, [details])

  // Handlers
  const handleRemove = async () => {
    if (!uid || !entry) return
    if (window.confirm('Remove this title from your library?')) {
      await removeFromLibraryWithUndo(uid, titleKey, entry)
      refetchEntry()
    }
  }

  const handleStatusChange = async (status: LibraryStatus) => {
    if (!uid || !entry) return
    await setStatus(uid, titleKey, status, entry)
    refetchEntry()
    toast.success(`Status updated to ${status}`)
  }

  const handleAddToWatchlist = async (status: LibraryStatus) => {
    if (!details || !uid || !titleKey || !parsed) return
    await addToLibrary(uid, {
      titleKey,
      tmdbId: parsed.tmdbId,
      type: parsed.type,
      title: details.title,
      status,
      year: details.year ?? undefined,
      posterPath: details.posterPath ?? undefined,
      backdropPath: details.backdropPath ?? undefined,
      genres: details.genres,
      runtimeMinutes: details.runtimeMinutes ?? undefined,
    })
    refetchEntry()
    toast.success('Added to library!')
  }

  const handleToggleFavorite = async () => {
    if (!uid || !details || !parsed) return
    if (!entry) {
      await addToLibrary(uid, {
        titleKey,
        tmdbId: parsed.tmdbId,
        type: parsed.type,
        title: details.title,
        status: 'plan_to_watch',
        year: details.year ?? undefined,
        posterPath: details.posterPath ?? undefined,
        backdropPath: details.backdropPath ?? undefined,
        genres: details.genres,
        runtimeMinutes: details.runtimeMinutes ?? undefined,
        isFavorite: true,
      })
      refetchEntry()
      toast.success('Added to Favorites!')
      return
    }
    await toggleFavorite(uid, titleKey, !entry.isFavorite)
    refetchEntry()
    toast.success(entry.isFavorite ? 'Removed from favorites' : 'Added to favorites!')
  }

  const handleRatingSelect = async (val: number) => {
    if (!uid || !details || !parsed) return
    if (!entry) {
      await addToLibrary(uid, {
        titleKey,
        tmdbId: parsed.tmdbId,
        type: parsed.type,
        title: details.title,
        status: 'completed',
        year: details.year ?? undefined,
        posterPath: details.posterPath ?? undefined,
        backdropPath: details.backdropPath ?? undefined,
        genres: details.genres,
        runtimeMinutes: details.runtimeMinutes ?? undefined,
        rating: val,
      })
      refetchEntry()
      return
    }
    const nextRating = entry.rating === val ? null : val
    await setRating(uid, titleKey, nextRating, entry.rating ?? null)
    refetchEntry()
  }

  const handleShare = () => {
    void navigator.clipboard.writeText(window.location.href)
    toast.info('Link copied to clipboard! 🔗')
  }

  const handleAddToCollection = async (colId: string) => {
    if (!uid || !details) return
    try {
      await addItemToCollection(uid, colId, {
        titleKey,
        title: details.title,
        posterPath: details.posterPath ?? null,
        type: mediaType,
      })
      setShowCollectionSheet(false)
      toast.success('Added to collection!')
    } catch (err: any) {
      toast.error(err.message || 'Could not add to collection')
    }
  }

  const handleAddDate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value
    if (!rawVal || !entry || !uid || !titleKey) return
    try {
      const runtime = details?.runtimeMinutes || 120
      const eventId = `${titleKey}_${Date.now()}`
      await logPastWatch(uid, {
        eventId,
        titleKey,
        title,
        type: isMovie ? 'movie' : 'tv_episode',
        runtimeMinutes: runtime,
        watchedAt: new Date(rawVal + 'T12:00:00'),
        rating: entry.rating ?? null,
        posterPath: details?.posterPath ?? null,
        genreIds: details?.genres.map((g) => g.id) || [],
      })
      refetchEntry()
      toast.success('Watch date logged!')
    } catch (err) {
      console.error(err)
    }
  }

  // Reviews handlers
  const openWriteReview = (rev?: UserReview) => {
    if (rev) {
      setEditingReview(rev)
      setRevTitle(rev.title)
      setRevRating(rev.rating)
      setRevText(rev.reviewText)
      setRevTags(rev.tags.join(', '))
    } else {
      setEditingReview(null)
      setRevTitle('')
      setRevRating(10)
      setRevText('')
      setRevTags('')
    }
    setIsReviewSheetOpen(true)
  }

  const handleSaveReview = async () => {
    if (!uid || !titleKey) return
    const reviewId = editingReview?.id || doc(collection(firestore, `users/${uid}/reviews`)).id
    const tagsArray = revTags
      .split(/[, ]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0)

    try {
      await setDoc(doc(firestore, `users/${uid}/reviews`, reviewId), {
        titleKey,
        title: revTitle || title,
        year: String(releaseYear),
        rating: revRating,
        reviewText: revText,
        tags: tagsArray,
        updatedAt: serverTimestamp(),
      })
      setIsReviewSheetOpen(false)
      toast.success('Review saved successfully!')
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteReview = async (revId: string) => {
    if (!uid || !confirm('Delete this review?')) return
    try {
      await deleteDoc(doc(firestore, `users/${uid}/reviews`, revId))
      toast.info('Review deleted')
    } catch (e) {
      console.error(e)
    }
  }

  if (isDetailsLoading) {
    return (
      <div className="page-wrapper detail-page">
        <button
          className="detail-back-btn"
          onClick={() => navigate(-1)}
          type="button"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="skeleton skeleton-backdrop" style={{ height: 300 }} />
        <div style={{ display: 'flex', gap: 20, marginTop: -60, padding: '0 24px' }}>
          <div className="skeleton" style={{ width: 120, height: 180, borderRadius: 'var(--radius-lg)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'flex-end' }}>
            <div className="skeleton" style={{ height: 32, width: '70%' }} />
            <div className="skeleton" style={{ height: 16, width: '40%' }} />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !details) {
    return (
      <div className="page-wrapper detail-page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: 'var(--text-secondary)' }}>Failed to load title details.</p>
        <button onClick={() => navigate(-1)} className="dp-confirm-btn" style={{ width: 'auto', marginTop: 16 }}>
          Go Back
        </button>
      </div>
    )
  }

  // Trivia & Details
  const triviaList = TRIVIA_DATABASE[tmdbId] ?? null
  const director = details.crew?.find((c) => c.job === 'Director')?.name || 'N/A'
  const writer = details.crew?.find((c) => c.job === 'Writer' || c.job === 'Screenplay')?.name || 'N/A'
  const stars = details.cast?.slice(0, 3).map((c) => c.name).join(', ') || 'N/A'
  const spokenLanguage = details.originalLanguage?.toUpperCase() || 'EN'

  const addedDate = entry?.addedAt && typeof (entry.addedAt as any).toDate === 'function'
    ? (entry.addedAt as any).toDate().toLocaleDateString()
    : null

  const watchedDate = entry?.completedAt && typeof (entry.completedAt as any).toDate === 'function'
    ? (entry.completedAt as any).toDate().toLocaleDateString()
    : 'Not watched yet'

  const ratedDate = entry?.rating ? `${entry.rating} / 10` : 'Not rated yet'

  return (
    <div className="page-wrapper detail-page">
      {/* ── BACK BUTTON ── */}
      <button
        className="detail-back-btn"
        onClick={() => navigate(-1)}
        type="button"
        aria-label="Go back"
      >
        <ArrowLeft size={20} />
      </button>

      {/* ── HERO BACKDROP ── */}
      <section className="detail-hero">
        {backdrop ? (
          <img src={backdrop} alt={title} className="detail-hero-backdrop" />
        ) : (
          <div style={{ background: 'var(--bg-secondary)', width: '100%', height: '100%' }} />
        )}
        <div className="detail-hero-overlay-dark" />
        <div className="detail-hero-overlay-left" />
        <div className="detail-hero-overlay-bottom" />
      </section>

      {/* ── TITLE BLOCK ── */}
      <section className="detail-title-block">
        {poster ? (
          <img src={poster} alt={title} className="detail-poster" />
        ) : (
          <div className="detail-poster detail-poster--placeholder">
            <Film size={28} />
          </div>
        )}

        <div className="detail-info-block">
          <h1 className="detail-title-text">{title}</h1>
          <p className="detail-meta-text">
            {releaseYear > 0 ? releaseYear : '—'} · {runtimeString}
          </p>
          <div className="detail-meta-text" style={{ marginTop: 2, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {ratingAverage && (
              <>
                <span className="detail-large-rating">⭐ {ratingAverage}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(IMDb)</span>
              </>
            )}
          </div>
          <div className="detail-genres-row">
            {details.genres.slice(0, 3).map((g) => (
              <span key={g.id} className="detail-genre-chip">{g.name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTION BUTTONS ROW ── */}
      <div className="detail-action-buttons-row" style={{
        display: 'flex', gap: '10px', flexWrap: 'wrap',
        marginTop: '16px', marginBottom: '8px',
        padding: '0 24px',
      }}>
        {/* 1. PRIMARY — Add to Watchlist / Status button */}
        {!isInWatchlist ? (
          <button onClick={() => setShowAddSheet(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            background: 'var(--color-brand)',
            color: 'var(--text-on-brand)',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontWeight: 700, fontSize: '14px', cursor: 'pointer',
          }}>
            <Plus size={16} /> Add to Watchlist
          </button>
        ) : (
          <button onClick={() => setShowStatusSheet(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            background: 'var(--color-brand)',
            color: 'var(--text-on-brand)',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontWeight: 700, fontSize: '14px', cursor: 'pointer',
          }}>
            {entry?.status === 'watching' && <><Play size={14} fill="currentColor" /> Watching</>}
            {entry?.status === 'completed' && <><Check size={14} /> Completed</>}
            {entry?.status === 'plan_to_watch' && <><Clock size={14} /> Plan to Watch</>}
            {entry?.status === 'dropped' && <><X size={14} /> Dropped</>}
            <ChevronDown size={14} />
          </button>
        )}

        {/* Track Episodes button (only for TV shows in library) */}
        {isInWatchlist && !isMovie && (
          <button onClick={() => navigate(`/title/${titleKey}/episodes`)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
          }}>
            <ListChecks size={14} /> Track Episodes
          </button>
        )}

        {/* 2. Play Trailer */}
        <button onClick={() => setShowTrailer(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px',
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600, fontSize: '14px', cursor: 'pointer',
        }}>
          <Play size={14} fill="currentColor" /> Trailer
        </button>

        {/* 3. Favorite toggle */}
        <button onClick={handleToggleFavorite} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px',
          background: entry?.isFavorite ? 'rgba(229,9,20,0.1)' : 'var(--bg-elevated)',
          color: entry?.isFavorite ? '#E50914' : 'var(--text-secondary)',
          border: `1px solid ${entry?.isFavorite ? 'rgba(229,9,20,0.4)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          fontWeight: 600, fontSize: '14px', cursor: 'pointer',
          transition: 'all 200ms ease',
        }}>
          <Heart size={14} fill={entry?.isFavorite ? 'currentColor' : 'none'} />
          {entry?.isFavorite ? 'Favorited' : 'Favorite'}
        </button>

        {/* 4. More actions dropdown trigger */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer',
            }}
          >
            <MoreHorizontal size={16} /> More
          </button>

          {showMoreMenu && (
            <>
              <div
                onClick={() => setShowMoreMenu(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                zIndex: 100, minWidth: '200px',
                overflow: 'hidden',
              }}>
                {[
                  { icon: <FolderOpen size={15} />, label: 'Add to Collection', action: () => { setShowMoreMenu(false); setShowCollectionSheet(true) } },
                  { icon: <Star size={15} />, label: 'Rate this title', action: () => { setShowMoreMenu(false); document.getElementById('personal-rating-section')?.scrollIntoView({ behavior: 'smooth' }) } },
                  { icon: <FileText size={15} />, label: 'Write a Review', action: () => { setShowMoreMenu(false); navigate('/reviews') } },
                  { icon: <Share2 size={15} />, label: 'Share', action: () => { setShowMoreMenu(false); handleShare() } },
                  ...(isInWatchlist ? [{ icon: <Trash2 size={15} color="var(--color-error)" />, label: 'Remove from Watchlist', action: () => { setShowMoreMenu(false); handleRemove() }, danger: true }] : []),
                ].map((item, i) => (
                  <button key={i} onClick={item.action} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '12px 16px',
                    background: 'none', border: 'none',
                    borderBottom: '1px solid var(--border-default)',
                    color: item.danger ? 'var(--color-error)' : 'var(--text-primary)',
                    fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                    textAlign: 'left',
                  }}>
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <nav className="detail-tab-bar">
        <button
          className={`detail-tab-btn ${activeTab === 'overview' ? 'detail-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('overview')}
          type="button"
        >
          Overview
        </button>

        {mediaType === 'tv' && (
          <button
            className={`detail-tab-btn ${activeTab === 'episodes' ? 'detail-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('episodes')}
            type="button"
          >
            Episodes
          </button>
        )}

        {(['cast', 'reviews', 'similar', 'images', 'trivia'] as const).map((tab) => (
          <button
            key={tab}
            className={`detail-tab-btn ${activeTab === tab ? 'detail-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* ── TAB CONTENT ── */}
      <main className="detail-tab-content">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="tab-pane animate-fade-in">
            <section className="detail-card">
              <h3 className="detail-card-title">Overview</h3>
              <p className="detail-overview-p">
                {isOverviewCollapsed && (details.overview?.length || 0) > 200
                  ? `${details.overview.slice(0, 200)}...`
                  : details.overview || 'No overview available.'}
              </p>
              {(details.overview?.length || 0) > 200 && (
                <button
                  className="detail-read-more"
                  onClick={() => setIsOverviewCollapsed(!isOverviewCollapsed)}
                  type="button"
                >
                  {isOverviewCollapsed ? 'Read more' : 'Read less'}
                </button>
              )}
            </section>

            {/* Details Grid */}
            <section className="detail-card">
              <h3 className="detail-card-title">Details</h3>
              <div className="detail-grid-2col">
                <div className="detail-grid-item">
                  <span className="detail-grid-lbl">Director</span>
                  <span className="detail-grid-val">{director}</span>
                </div>
                <div className="detail-grid-item">
                  <span className="detail-grid-lbl">Writer</span>
                  <span className="detail-grid-val">{writer}</span>
                </div>
                <div className="detail-grid-item">
                  <span className="detail-grid-lbl">Stars</span>
                  <span className="detail-grid-val">{stars}</span>
                </div>
                <div className="detail-grid-item">
                  <span className="detail-grid-lbl">Status</span>
                  <span className="detail-grid-val">{details.status || 'Released'}</span>
                </div>
                <div className="detail-grid-item">
                  <span className="detail-grid-lbl">Language</span>
                  <span className="detail-grid-val">{spokenLanguage}</span>
                </div>
                <div className="detail-grid-item">
                  <span className="detail-grid-lbl">Type</span>
                  <span className="detail-grid-val">{isMovie ? 'Movie' : 'TV Series'}</span>
                </div>
              </div>
            </section>

            {/* Personal Status & Rating Section (If in library) */}
            {entry && (
              <>
                <section id="personal-rating-section" className="detail-card">
                  <h3 className="detail-card-title">Personal rating</h3>
                  <div className="detail-stars-interactive">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const starVal = i + 1
                      const isStarActive = (entry.rating ?? 0) >= starVal
                      return (
                        <button
                          key={starVal}
                          className="detail-star-btn"
                          onClick={() => handleRatingSelect(starVal)}
                          aria-label={`Rate ${starVal} stars`}
                          type="button"
                        >
                          <Star size={24} fill={isStarActive ? 'var(--star-filled)' : 'none'} color={isStarActive ? 'var(--star-filled)' : 'var(--text-muted)'} />
                        </button>
                      )
                    })}
                  </div>
                  {entry.rating && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                      You rated this: <strong>{entry.rating} / 10</strong>
                    </p>
                  )}
                </section>

                <section className="detail-card">
                  <h3 className="detail-card-title">Personal Notes</h3>
                  <textarea
                    className="detail-notes-textarea"
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    placeholder="Auto-saved on blur. Add your personal thoughts here..."
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>{isSavingNotes ? 'Saving...' : 'Saved'}</span>
                    <span>{localNotes.length} chars</span>
                  </div>
                </section>

                {/* Timeline */}
                <section className="detail-card">
                  <h3 className="detail-card-title">Timeline</h3>
                  <div className="detail-timeline">
                    <div className="detail-timeline-item">
                      <span className="detail-timeline-dot" />
                      <div className="detail-timeline-info">
                        <span className="detail-timeline-lbl">Added</span>
                        <span className="detail-timeline-val">{addedDate || 'In Library'}</span>
                      </div>
                    </div>
                    <div className="detail-timeline-item">
                      <span className="detail-timeline-dot" />
                      <div className="detail-timeline-info">
                        <span className="detail-timeline-lbl">Watched</span>
                        <span className="detail-timeline-val">{watchedDate}</span>
                      </div>
                    </div>
                    <div className="detail-timeline-item">
                      <span className="detail-timeline-dot" />
                      <div className="detail-timeline-info">
                        <span className="detail-timeline-lbl">Rated</span>
                        <span className="detail-timeline-val">{ratedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="date-add-trigger" style={{ marginTop: 12 }}>
                    <button className="watch-date-add-btn" type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--border-default)', background: 'transparent', padding: '6px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                      <span>+ Add watch date</span>
                      <input
                        type="date"
                        className="date-add-input"
                        onChange={handleAddDate}
                        max={new Date().toISOString().slice(0, 10)}
                        aria-label="Select watch date"
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      />
                    </button>
                  </div>
                </section>
              </>
            )}

            {/* Where to Watch */}
            <section className="detail-card">
              <h3 className="detail-card-title">Where to watch</h3>
              <div className="detail-providers-row">
                {PROVIDERS.map((provider) => (
                  <span
                    key={provider.name}
                    className="detail-provider-pill"
                    style={{ borderLeft: `3px solid ${provider.color}` }}
                  >
                    {provider.name}
                  </span>
                ))}
              </div>
              <p className="detail-providers-msg">Streaming availability may vary by region</p>
            </section>
          </div>
        )}

        {/* ── EPISODES TAB ── */}
        {activeTab === 'episodes' && mediaType === 'tv' && (
          <div className="tab-pane animate-fade-in" style={{ padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {details.tv?.totalSeasons || 0} Seasons · {details.tv?.totalEpisodes || 0} Episodes
                </div>
              </div>
              <button
                onClick={() => navigate(`/title/${titleKey}/episodes`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px',
                  background: 'var(--color-brand)', color: 'var(--text-on-brand)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                📋 Track Episodes
              </button>
            </div>

            {details.tv?.seasons?.filter((s) => s.seasonNumber > 0).map((s) => (
              <SeasonRowAccordion
                key={s.seasonNumber}
                tmdbId={tmdbId}
                season={s}
                isOpen={openSeasonNumber === s.seasonNumber}
                onToggle={() => setOpenSeasonNumber(openSeasonNumber === s.seasonNumber ? null : s.seasonNumber)}
              />
            ))}
          </div>
        )}

        {/* ── CAST TAB ── */}
        {activeTab === 'cast' && (
          <div className="tab-pane animate-fade-in">
            {details.cast && details.cast.length > 0 ? (
              <div className="cast-grid">
                {details.cast.slice(0, 16).map((c) => {
                  const avatar = c.profilePath ? getProfileUrl(c.profilePath, 'w185') : null
                  return (
                    <div key={c.id} className="detail-cast-card">
                      {avatar ? (
                        <img src={avatar} alt={c.name} className="detail-cast-avatar" />
                      ) : (
                        <div className="detail-cast-avatar detail-cast-avatar--placeholder">👤</div>
                      )}
                      <p className="detail-cast-name">{c.name}</p>
                      <p className="detail-cast-char">{c.character || 'Cast'}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="detail-tab-empty">No cast details available.</p>
            )}
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {activeTab === 'reviews' && (
          <div className="tab-pane animate-fade-in">
            <div className="detail-tab-header">
              <h3 className="detail-card-title" style={{ margin: 0 }}>Journal Reviews</h3>
              <button className="detail-write-rev-btn" onClick={() => openWriteReview()} type="button">
                Write a Review
              </button>
            </div>

            {reviewsList.length > 0 ? (
              <div className="detail-reviews-list">
                {reviewsList.map((rev) => (
                  <article key={rev.id} className="detail-rev-card">
                    <div className="detail-rev-top">
                      <div className="detail-rev-meta">
                        <h4 className="detail-rev-title">{rev.title}</h4>
                        <span className="detail-rev-year">{rev.year || releaseYear} · ⭐ {rev.rating}/10</span>
                      </div>
                      <div className="detail-rev-actions">
                        <button className="detail-rev-action-btn" onClick={() => openWriteReview(rev)} aria-label="Edit review" type="button">
                          <Edit size={14} />
                        </button>
                        <button className="detail-rev-action-btn detail-rev-action-btn--delete" onClick={() => handleDeleteReview(rev.id)} aria-label="Delete review" type="button">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="detail-rev-text">{rev.reviewText}</p>
                    {rev.tags && rev.tags.length > 0 && (
                      <div className="detail-rev-tags">
                        {rev.tags.map((tag) => (
                          <span key={tag} className="detail-tag-chip">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="detail-tab-empty">You haven't written any reviews for this title yet.</p>
            )}
          </div>
        )}

        {/* ── SIMILAR TAB ── */}
        {activeTab === 'similar' && (
          <div style={{ padding: '20px 0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              More Like This
            </h3>
            {similarTitles.length > 0 ? (
              <div className="poster-grid">
                {similarTitles.slice(0, 18).map((item) => (
                  <PosterCard
                    key={item.titleKey}
                    title={item.title}
                    year={item.year}
                    posterPath={item.posterPath}
                    rating={item.voteAverage}
                    type={item.type}
                    onClick={() => navigate(`/title/${item.titleKey}`)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎬</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  No similar titles found
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── IMAGES TAB ── */}
        {activeTab === 'images' && (
          <div style={{ padding: '20px 0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Images
            </h3>
            {images.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {images.map((img: any, idx: number) => {
                  const url = getBackdropUrl(img.file_path || img.filePath, 'w780')
                  return (
                    <div key={idx} onClick={() => setLightboxIndex(idx)} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '16/9', background: 'var(--bg-elevated)', cursor: 'pointer' }}>
                      <img src={url || ''} alt={`Backdrop ${idx + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No extra backdrops available
              </div>
            )}
          </div>
        )}

        {/* ── TRIVIA TAB ── */}
        {activeTab === 'trivia' && (
          <div className="tab-pane animate-fade-in">
            {triviaList ? (
              <ol className="detail-trivia-list">
                {triviaList.map((fact, idx) => (
                  <li key={idx} className="detail-trivia-item">
                    <div className="detail-trivia-icon-box">
                      <Lightbulb size={16} />
                    </div>
                    <div className="detail-trivia-content">
                      <span className="detail-trivia-num">Fact #{idx + 1}</span>
                      <p className="detail-trivia-text">{fact}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="detail-tab-empty">No trivia curated yet for this title.</p>
            )}
          </div>
        )}
      </main>

      {/* ── Image Lightbox Modal ── */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div className="dp-lightbox" onClick={() => setLightboxIndex(null)}>
          <button className="dp-lightbox-close" onClick={() => setLightboxIndex(null)} type="button">×</button>
          <div className="dp-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={getBackdropUrl(images[lightboxIndex].file_path || images[lightboxIndex].filePath, 'original') || ''}
              alt="Backdrop Lightbox"
              className="dp-lightbox-img"
            />
            {images.length > 1 && (
              <div className="dp-lightbox-nav">
                <button
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)}
                  type="button"
                >
                  ◀ Prev
                </button>
                <span className="dp-lightbox-counter">{lightboxIndex + 1} / {images.length}</span>
                <button
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % images.length)}
                  type="button"
                >
                  Next ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Watch Status bottom sheet ── */}
      <BottomSheet isOpen={showStatusSheet} onClose={() => setShowStatusSheet(false)}>
        <div style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Update Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {STATUS_OPTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { handleStatusChange(opt.value); setShowStatusSheet(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px',
                  background: entry?.status === opt.value ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
                  border: `1px solid ${entry?.status === opt.value ? opt.color : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                  boxShadow: entry?.status === opt.value ? `inset 3px 0 0 ${opt.color}` : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                <span style={{ fontSize: '20px' }}>{opt.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px', fontWeight: 600,
                    color: entry?.status === opt.value ? opt.color : 'var(--text-primary)',
                  }}>{opt.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.desc}</div>
                </div>
                {entry?.status === opt.value && <Check size={16} color={opt.color} />}
              </button>
            ))}
          </div>

          {isInWatchlist && (
            <button
              onClick={() => { handleRemove(); setShowStatusSheet(false) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, width: '100%', marginTop: '12px', padding: '12px',
                background: 'rgba(229,9,20,0.08)',
                border: '1px solid rgba(229,9,20,0.25)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-error)', fontSize: '14px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Trash2 size={14} /> Remove from Library
            </button>
          )}
        </div>
      </BottomSheet>

      {/* ── Add to Watchlist bottom sheet ── */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-default)' }}>
            {poster && (
              <img src={poster} alt={title} style={{ width: 56, height: 84, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>{title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {releaseYear} · {isMovie ? 'Movie' : 'TV Show'}
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Add as
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {STATUS_OPTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedStatus(opt.value)}
                style={{
                  padding: '12px', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${selectedStatus === opt.value ? opt.color : 'var(--border-default)'}`,
                  background: selectedStatus === opt.value ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
                  cursor: 'pointer', textAlign: 'center',
                  boxShadow: selectedStatus === opt.value ? `0 0 0 1px ${opt.color}` : 'none',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{opt.emoji}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: selectedStatus === opt.value ? opt.color : 'var(--text-secondary)' }}>
                  {opt.label}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => { handleAddToWatchlist(selectedStatus); setShowAddSheet(false) }}
            style={{
              width: '100%', padding: '14px',
              background: 'var(--color-brand)', color: 'var(--text-on-brand)',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Add to Library
          </button>
        </div>
      </BottomSheet>

      {/* ── Add to Collection bottom sheet ── */}
      <BottomSheet isOpen={showCollectionSheet} onClose={() => setShowCollectionSheet(false)}>
        <div style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Add to Collection
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {userCollections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                No collections yet.{' '}
                <span
                  onClick={() => { setShowCollectionSheet(false); navigate('/collections') }}
                  style={{ color: 'var(--color-brand)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Create one →
                </span>
              </div>
            ) : (
              userCollections.map((col) => (
                <button
                  key={col.id || col.name}
                  onClick={() => col.id && handleAddToCollection(col.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    textAlign: 'left', width: '100%',
                  }}
                >
                  <FolderOpen size={18} color="var(--color-brand)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{col.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {col.items?.length || 0} titles
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </BottomSheet>

      {/* ── Review Sheet ── */}
      <BottomSheet
        isOpen={isReviewSheetOpen}
        onClose={() => setIsReviewSheetOpen(false)}
        label="Write a review"
      >
        <div className="status-sheet-content" style={{ padding: '20px' }}>
          <p className="filter-sheet-title" style={{ padding: '0 0 16px', fontSize: 16, fontWeight: 700 }}>
            {editingReview ? 'Edit Review' : 'Write a Review'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Review Headline</label>
              <input
                type="text"
                value={revTitle}
                onChange={(e) => setRevTitle(e.target.value)}
                placeholder="e.g. Masterpiece!, Disappointing, Worth a watch"
                className="review-input"
                style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Star Rating ({revRating}/10)</label>
              <input
                type="range"
                min="1"
                max="10"
                value={revRating}
                onChange={(e) => setRevRating(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-brand)', marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Review Body</label>
              <textarea
                value={revText}
                onChange={(e) => setRevText(e.target.value)}
                placeholder="Write your full thoughts on this title..."
                className="detail-notes-textarea"
                style={{ width: '100%', height: 120, marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Tags (comma/space separated)</label>
              <input
                type="text"
                value={revTags}
                onChange={(e) => setRevTags(e.target.value)}
                placeholder="e.g. masterpiece, thriller, mindbending"
                className="review-input"
                style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <button
              onClick={handleSaveReview}
              type="button"
              style={{
                width: '100%', padding: '14px',
                background: 'var(--color-brand)', color: 'var(--text-on-brand)',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: 8,
              }}
            >
              Save Review
            </button>
          </div>
        </div>
      </BottomSheet>

      <TrailerModal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        videoKey={trailerKey}
        title={title || ''}
      />
    </div>
  )
}
