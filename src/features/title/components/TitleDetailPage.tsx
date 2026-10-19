import { useEffect, useState, useMemo, type ChangeEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Film, ArrowLeft } from 'lucide-react'
import {
  collection,
  query as firestoreQuery,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import { useAuthStore } from '@/features/auth/store/authStore'
import { parseTitleKey } from '@/shared/lib/ids'
import { useTitleDetails, useTitleReviews } from '@/services/tmdb/hooks'
import { useLibraryEntry } from '../hooks/useLibraryEntry'
import { useAppStore } from '@/domain/store'
import {
  addToLibrary,
  setStatus,
  markMovieWatched,
  toggleFavorite,
  removeFromLibrary,
  setRating,
} from '@/domain/operations'
import { updateLibraryEntry } from '@/features/library/api/libraryApi'
import { addItemToCollection } from '@/features/collections/api/collectionsApi'
import { logPastWatch } from '@/features/history/api/historyApi'
import { toast } from '@/shared/ui'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { EmptyStateCard } from '@/shared/ui/layout/EmptyStateCard'
import { Button } from '@/shared/ui/Button/Button'
import type { LibraryStatus } from '@/shared/schemas'
import { TRIVIA_DATABASE, type UserReview } from './titleTypes'
import { TitleHeroBanner } from './TitleHeroBanner'
import { TitleOverviewTab } from './TitleOverviewTab'
import { TitleEpisodesTab } from './TitleEpisodesTab'
import { TitleCastTab } from './TitleCastTab'
import { TitleReviewsTab } from './TitleReviewsTab'
import { TitleSimilarTab, TitleImagesTab, TitleTriviaTab } from './TitleMediaTabs'
import { TitleModals } from './TitleModals'
import './TitleDetailPage.css'

type DetailTabKey = 'overview' | 'episodes' | 'cast' | 'reviews' | 'similar' | 'images' | 'trivia'

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

  // Tab & Season navigation
  const [activeTab, setActiveTab] = useState<DetailTabKey>('overview')
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

  // Sheets & menus
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showStatusSheet, setShowStatusSheet] = useState(false)
  const [showCollectionSheet, setShowCollectionSheet] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>('plan_to_watch')
  const userCollections = useAppStore((state) => state.collections)

  // Watchlist & Details queries
  const { entry, refetch: refetchEntry } = useLibraryEntry(uid, titleKey)
  const { data: details, isLoading: isDetailsLoading, isError, refetch: refetchDetails } = useTitleDetails(titleKey)
  const { data: tmdbReviews = [] } = useTitleReviews(mediaType, tmdbId)
  const isInWatchlist = Boolean(entry)

  // Sync reviews
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

  // Sync notes
  useEffect(() => {
    if (entry) {
      setLocalNotes((entry as any).notes || '')
    }
  }, [entry])

  // Debounced notes autosave
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

  // Derived Values
  const runtimeString = useMemo(() => {
    if (details?.runtimeMinutes) {
      const mins = details.runtimeMinutes
      const hrs = Math.floor(mins / 60)
      const remainingMins = mins % 60
      return hrs > 0 ? `${hrs}h ${remainingMins}m` : `${mins}m`
    }
    if (details?.tv) {
      const count = details.tv.totalSeasons
      return `${count} Season${count > 1 ? 's' : ''}`
    }
    return ''
  }, [details])

  const similarTitles = useMemo(() => {
    if (details?.similar && details.similar.length > 0) return details.similar
    if (details?.recommendations && details.recommendations.length > 0) return details.recommendations
    return []
  }, [details])

  const images = useMemo(() => {
    return details?.images || { backdrops: [], posters: [], logos: [] }
  }, [details])

  const allImagesFlat = useMemo(() => {
    const backdrops = (images.backdrops || []).slice(0, 12).map((img) => ({ ...img, group: 'backdrop' as const }))
    const posters = (images.posters || []).slice(0, 12).map((img) => ({ ...img, group: 'poster' as const }))
    const logos = (images.logos || []).slice(0, 12).map((img) => ({ ...img, group: 'logo' as const }))
    return [...backdrops, ...posters, ...logos]
  }, [images])

  const totalImagesCount = allImagesFlat.length
  const totalReviewsCount = reviewsList.length + tmdbReviews.length
  const triviaList = TRIVIA_DATABASE[tmdbId] ?? null

  // Action Handlers
  const handleRemove = async () => {
    if (!uid || !entry) return
    if (window.confirm('Remove this title from your library?')) {
      await removeFromLibrary(uid, titleKey)
      toast.success('Removed from library')
    }
  }

  const handleStatusChange = async (status: LibraryStatus) => {
    if (!uid || !entry) return
    if (isMovie && status === 'completed') {
      await markMovieWatched(uid, titleKey, entry)
    } else {
      await setStatus(uid, titleKey, status, entry)
      toast.success(`Status updated to ${status.replace(/_/g, ' ')}`)
    }
  }

  const handleAddToWatchlist = async (status: LibraryStatus) => {
    if (!uid || !details) return
    await addToLibrary(uid, {
      titleKey,
      tmdbId,
      type: mediaType,
      title: details.title,
      year: details.year ?? 0,
      posterPath: details.posterPath ?? null,
      backdropPath: details.backdropPath ?? null,
      genres: details.genres || [],
      runtimeMinutes: details.runtimeMinutes ?? null,
      status,
    })
    toast.success('Added to library')
  }

  const handleToggleFavorite = async () => {
    if (!uid) return
    if (!entry && details) {
      await addToLibrary(uid, {
        titleKey,
        tmdbId,
        type: mediaType,
        title: details.title,
        year: details.year ?? 0,
        posterPath: details.posterPath ?? null,
        backdropPath: details.backdropPath ?? null,
        genres: details.genres || [],
        status: 'plan_to_watch',
        isFavorite: true,
      })
      toast.success('Favorited and added to library')
      return
    }
    if (entry) {
      await toggleFavorite(uid, titleKey, !entry.isFavorite)
      toast.success(entry.isFavorite ? 'Removed from favorites' : 'Saved to favorites')
    }
  }

  const handleRatingSelect = async (ratingVal: number) => {
    if (!uid) return
    await setRating(uid, titleKey, ratingVal)
    toast.success(`Rated ${ratingVal}/10`)
  }

  const handleAddToCollection = async (collectionId: string) => {
    if (!uid || !details) return
    try {
      await addItemToCollection(uid, collectionId, {
        titleKey,
        title: details.title,
        type: mediaType,
        posterPath: details.posterPath ?? null,
      })
      setShowCollectionSheet(false)
      toast.success('Added to collection!')
    } catch (err) {
      console.error(err)
      toast.error('Could not add to collection')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: details?.title || 'CineTrack', url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.info('Link copied to clipboard!')
    }
  }

  const handleAddDate = async (e: ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value
    if (!rawVal || !uid || !entry) return
    try {
      await logPastWatch(uid, {
        eventId: crypto.randomUUID(),
        titleKey,
        title: details?.title || 'Title',
        type: isMovie ? 'movie' : 'tv_episode',
        runtimeMinutes: details?.runtimeMinutes || 60,
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
    const tagsArray = revTags.split(/[, ]+/).map((t) => t.trim().replace(/^#/, '')).filter(Boolean)

    try {
      await setDoc(doc(firestore, `users/${uid}/reviews`, reviewId), {
        titleKey,
        title: revTitle || details?.title || 'Review',
        year: String(details?.year || 0),
        rating: revRating,
        reviewText: revText,
        tags: tagsArray,
        updatedAt: serverTimestamp(),
      })
      setIsReviewSheetOpen(false)
      toast.success('Review saved!')
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
      <PageShell>
        <div className="title-loading-shell">
          <div className="title-skeleton title-skeleton-hero" />
        </div>
      </PageShell>
    )
  }

  if (isError || !details) {
    return (
      <PageShell>
        <EmptyStateCard
          icon={<Film size={36} />}
          title="Title not found"
          description="We couldn't load details for this title from TMDB."
          action={
            <Button variant="primary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
              Go Back
            </Button>
          }
        />
      </PageShell>
    )
  }

  // Navigation tab items configuration
  const tabOptions: { key: DetailTabKey; label: string; count?: number | undefined }[] = [
    { key: 'overview', label: 'Overview' },
    ...(mediaType === 'tv' ? [{ key: 'episodes' as const, label: 'Episodes', count: details.tv?.totalEpisodes || undefined }] : []),
    { key: 'cast', label: 'Cast & Crew', count: details.cast?.length },
    { key: 'reviews', label: 'Reviews', count: totalReviewsCount > 0 ? totalReviewsCount : undefined },
    { key: 'similar', label: 'Similar', count: similarTitles.length },
    { key: 'images', label: 'Images', count: totalImagesCount > 0 ? totalImagesCount : undefined },
    ...(triviaList ? [{ key: 'trivia' as const, label: 'Trivia', count: triviaList.length }] : []),
  ]

  return (
    <PageShell>
      <div className="title-detail-page-container">
        {/* 1. Cinematic Hero Banner */}
        <TitleHeroBanner
          details={details}
          entry={entry}
          isMovie={isMovie}
          runtimeString={runtimeString}
          isInWatchlist={isInWatchlist}
          onOpenAddSheet={() => setShowAddSheet(true)}
          onOpenStatusSheet={() => setShowStatusSheet(true)}
          onOpenTrailer={() => setShowTrailer(true)}
          onToggleFavorite={handleToggleFavorite}
          onOpenCollectionSheet={() => setShowCollectionSheet(true)}
          onScrollToRating={() => {
            setActiveTab('overview')
            setTimeout(() => document.getElementById('personal-rating-section')?.scrollIntoView({ behavior: 'smooth' }), 100)
          }}
          onWriteReview={() => openWriteReview()}
          onShare={handleShare}
          onRemove={handleRemove}
        />

        {/* 2. Sleek Tab Navigation Pill Bar */}
        <div className="title-detail-tab-bar" role="tablist">
          {tabOptions.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`title-detail-tab-pill ${activeTab === tab.key ? 'title-detail-tab-pill--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="title-detail-tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* 3. Tab Contents */}
        <div className="title-detail-tab-body">
          {activeTab === 'overview' && (
            <TitleOverviewTab
              details={details}
              entry={entry}
              isMovie={isMovie}
              localNotes={localNotes}
              isSavingNotes={isSavingNotes}
              onNotesChange={setLocalNotes}
              onRatingSelect={handleRatingSelect}
              onAddDate={handleAddDate}
              onSelectCastTab={() => setActiveTab('cast')}
            />
          )}

          {activeTab === 'episodes' && mediaType === 'tv' && (
            <TitleEpisodesTab
              tmdbId={tmdbId}
              titleKey={titleKey}
              totalSeasons={details.tv?.totalSeasons || 0}
              totalEpisodes={details.tv?.totalEpisodes || null}
              seasons={details.tv?.seasons || []}
              openSeasonNumber={openSeasonNumber}
              onToggleSeason={(num) => setOpenSeasonNumber(openSeasonNumber === num ? null : num)}
              onNavigateTracker={() => navigate(`/title/${titleKey}/episodes`)}
            />
          )}

          {activeTab === 'cast' && (
            <TitleCastTab
              cast={details.cast || []}
              crew={details.crew || []}
            />
          )}

          {activeTab === 'reviews' && (
            <TitleReviewsTab
              reviewsList={reviewsList}
              tmdbReviews={tmdbReviews}
              releaseYear={details.year || 0}
              onOpenWriteReview={openWriteReview}
              onDeleteReview={handleDeleteReview}
            />
          )}

          {activeTab === 'similar' && (
            <TitleSimilarTab
              titles={similarTitles}
              isLoading={isDetailsLoading}
              isError={isError}
              onRetry={() => refetchDetails()}
              onAddTitle={async (title) => {
                if (!uid) return
                await addToLibrary(uid, {
                  titleKey: title.titleKey,
                  tmdbId: title.tmdbId,
                  type: title.type,
                  title: title.title,
                  year: title.year ?? 0,
                  posterPath: title.posterPath ?? null,
                  backdropPath: title.backdropPath ?? null,
                  genres: [],
                  runtimeMinutes: null,
                  status: 'plan_to_watch',
                })
                refetchEntry()
                toast.success(`Added ${title.title} to library`)
              }}
            />
          )}

          {activeTab === 'images' && (
            <TitleImagesTab images={images} onSelectImage={setLightboxIndex} />
          )}

          {activeTab === 'trivia' && triviaList && (
            <TitleTriviaTab triviaList={triviaList} />
          )}
        </div>

        {/* 4. Modals & Bottom Sheets */}
        <TitleModals
          details={details}
          entry={entry}
          isMovie={isMovie}
          showStatusSheet={showStatusSheet}
          setShowStatusSheet={setShowStatusSheet}
          onStatusChange={handleStatusChange}
          onRemoveFromLibrary={handleRemove}
          showAddSheet={showAddSheet}
          setShowAddSheet={setShowAddSheet}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          onAddToWatchlist={handleAddToWatchlist}
          showCollectionSheet={showCollectionSheet}
          setShowCollectionSheet={setShowCollectionSheet}
          userCollections={userCollections}
          onAddToCollection={handleAddToCollection}
          isReviewSheetOpen={isReviewSheetOpen}
          setIsReviewSheetOpen={setIsReviewSheetOpen}
          editingReview={editingReview}
          revTitle={revTitle}
          setRevTitle={setRevTitle}
          revRating={revRating}
          setRevRating={setRevRating}
          revText={revText}
          setRevText={setRevText}
          revTags={revTags}
          setRevTags={setRevTags}
          onSaveReview={handleSaveReview}
          lightboxIndex={lightboxIndex}
          setLightboxIndex={setLightboxIndex}
          images={allImagesFlat}
          showTrailer={showTrailer}
          setShowTrailer={setShowTrailer}
          trailerKey={details.trailerKey || null}
        />
      </div>
    </PageShell>
  )
}
