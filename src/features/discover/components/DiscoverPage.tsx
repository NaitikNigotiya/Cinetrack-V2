import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { addToLibrary } from '@/features/library/api/libraryApi'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { ContentCarousel, type CarouselItem } from '@/shared/ui/ContentCarousel/ContentCarousel'
import { TrailerModal } from '@/shared/ui/TrailerModal/TrailerModal'
import { toast } from '@/shared/ui'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Section } from '@/shared/ui/layout/Section'
import { Button } from '@/shared/ui/Button/Button'
import { DiscoverHero } from './DiscoverHero'
import { DiscoverTopImdb } from './DiscoverTopImdb'
import { DiscoverGenreSection } from './DiscoverGenreSection'
import { DiscoverAddSheet } from './DiscoverAddSheet'
import { GENRE_SECTIONS, tmdbToCarousel, getItemTitle } from '../constants/genresList'
import type { LibraryStatus } from '@/shared/schemas'
import './DiscoverPage.css'

function getItemYear(item: CarouselItem) {
  return (item.release_date ?? item.first_air_date)?.slice(0, 4) ?? '—'
}

export default function DiscoverPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const uid = user?.uid
  const { entries: libraryEntries, refetch: refetchLibrary } = useLibrary('all')

  const titleKeys = useMemo(() => {
    return new Set(libraryEntries.map((e) => e.titleKey))
  }, [libraryEntries])

  const [trendingWindow, setTrendingWindow] = useState<'day' | 'week'>('day')
  const [selectedItem, setSelectedItem] = useState<CarouselItem | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus>('plan_to_watch')
  const [isAdding, setIsAdding] = useState(false)

  const [trailerModal, setTrailerModal] = useState<{
    isOpen: boolean
    videoKey: string | null
    title: string
  }>({
    isOpen: false,
    videoKey: null,
    title: '',
  })

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending', 'all', trendingWindow],
    queryFn: () => tmdbClient.getTrending('all', trendingWindow),
    staleTime: 10 * 60 * 1000,
  })

  const { data: topRatedData } = useQuery({
    queryKey: ['top-rated-movies'],
    queryFn: () => tmdbClient.getTopRated('movie', 1),
    staleTime: 30 * 60 * 1000,
  })

  const { data: oscarData } = useQuery({
    queryKey: ['oscar-winners'],
    queryFn: () => tmdbClient.discoverMovies({ with_genres: '18', sort_by: 'vote_average.desc' }),
    staleTime: 60 * 60 * 1000,
  })

  const { data: scifiData } = useQuery({
    queryKey: ['discover-scifi'],
    queryFn: () => tmdbClient.discoverMovies({ with_genres: '878', sort_by: 'vote_average.desc' }),
    staleTime: 30 * 60 * 1000,
  })

  const trendingAll = (trendingData?.results ?? [])
    .filter((r) => (r as any).media_type !== 'person')
    .slice(0, 20)

  const heroItem = trendingAll[0] ?? null
  const carouselItems = trendingAll.slice(1, 15).map(tmdbToCarousel)
  const topRatedItems = topRatedData?.results?.slice(0, 10) ?? []
  const oscarItems = (oscarData?.results ?? []).slice(0, 12).map(tmdbToCarousel)
  const scifiItems = (scifiData?.results ?? []).slice(0, 15).map(tmdbToCarousel)

  const handleOpenAdd = useCallback((item: CarouselItem) => {
    setSelectedItem(item)
    setSelectedStatus('plan_to_watch')
  }, [])

  const handleConfirmAdd = async () => {
    if (!selectedItem) return
    if (!uid) {
      toast.error('Sign in to add titles to your library.')
      return
    }

    setIsAdding(true)
    try {
      const mediaType = selectedItem.media_type === 'tv' ? 'tv' : 'movie'
      const titleKey = `${mediaType}:${selectedItem.id}`
      const yr = parseInt(getItemYear(selectedItem)) || undefined

      await addToLibrary(uid, {
        titleKey,
        tmdbId: selectedItem.id,
        type: mediaType,
        title: getItemTitle(selectedItem),
        status: selectedStatus,
        year: yr,
        posterPath: selectedItem.poster_path,
        backdropPath: selectedItem.backdrop_path,
        rating: selectedItem.vote_average,
      })

      refetchLibrary()
      setSelectedItem(null)
      toast.success(`"${getItemTitle(selectedItem)}" added to library ✓`)
    } catch {
      toast.error('Failed to add. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const heroMediaType = heroItem ? (heroItem.media_type === 'tv' ? 'tv' : 'movie') : 'movie'
  const heroTitleKey = heroItem ? `${heroMediaType}:${heroItem.id}` : null
  const heroInList = heroTitleKey ? titleKeys.has(heroTitleKey) : false

  const handleWatchTrailer = async (id: number, mediaType: 'movie' | 'tv', title: string) => {
    try {
      const details =
        mediaType === 'movie'
          ? await tmdbClient.getMovieDetails(id)
          : await tmdbClient.getTvDetails(id)

      const videos = (details as any).videos?.results ?? []
      const trailer =
        videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') ??
        videos.find((v: any) => v.site === 'YouTube')

      setTrailerModal({
        isOpen: true,
        videoKey: trailer?.key ?? null,
        title,
      })
    } catch {
      setTrailerModal({
        isOpen: true,
        videoKey: null,
        title,
      })
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="EXPLORE"
        title="Discover"
        subtitle="Trending and upcoming releases"
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant={trendingWindow === 'day' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTrendingWindow('day')}
            >
              Today
            </Button>
            <Button
              variant={trendingWindow === 'week' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTrendingWindow('week')}
            >
              This Week
            </Button>
          </div>
        }
      />

      <Section title="Trending Now 🔥">
        <DiscoverHero
          heroItem={heroItem}
          isLoading={trendingLoading}
          inWatchlist={heroInList}
          onAdd={() => heroItem && handleOpenAdd(tmdbToCarousel(heroItem))}
          onWatchTrailer={handleWatchTrailer}
        />
        {carouselItems.length > 0 && (
          <div style={{ marginTop: 'var(--space-3)' }}>
            <ContentCarousel
              items={carouselItems}
              onAdd={handleOpenAdd}
              onClick={(item) => navigate(`/title/${item.media_type || 'movie'}:${item.id}`)}
            />
          </div>
        )}
      </Section>

      <Section
        title="Top IMDb ⭐"
        action={<span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>Top 10 All Time</span>}
      >
        <DiscoverTopImdb
          topRatedItems={topRatedItems}
          titleKeys={titleKeys}
          onAdd={handleOpenAdd}
        />
      </Section>

      <Section title="Award Winners 🏆">
        {oscarItems.length > 0 ? (
          <ContentCarousel
            items={oscarItems}
            onAdd={handleOpenAdd}
            onClick={(item) => navigate(`/title/movie:${item.id}`)}
            cardWidth={110}
          />
        ) : (
          <div style={{ display: 'flex', gap: 'var(--card-gap)' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ flex: '0 0 110px', height: '160px', borderRadius: 'var(--radius-tile)' }} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Mind-Bending Movies 🌀">
        {scifiItems.length > 0 ? (
          <ContentCarousel
            items={scifiItems}
            onAdd={handleOpenAdd}
            onClick={(item) => navigate(`/title/movie:${item.id}`)}
            cardWidth={110}
          />
        ) : (
          <div style={{ display: 'flex', gap: 'var(--card-gap)' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ flex: '0 0 110px', height: '160px', borderRadius: 'var(--radius-tile)' }} />
            ))}
          </div>
        )}
      </Section>

      {GENRE_SECTIONS.map((genre) => (
        <DiscoverGenreSection
          key={genre.id}
          genreId={genre.id}
          label={genre.label}
          color={genre.color}
          emoji={genre.emoji}
          onAdd={handleOpenAdd}
          onClick={(item) => navigate(`/title/movie:${item.id}`)}
        />
      ))}

      <DiscoverAddSheet
        selectedItem={selectedItem}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onConfirm={handleConfirmAdd}
        onClose={() => setSelectedItem(null)}
        isAdding={isAdding}
      />

      <TrailerModal
        isOpen={trailerModal.isOpen}
        onClose={() => setTrailerModal((prev) => ({ ...prev, isOpen: false }))}
        videoKey={trailerModal.videoKey}
        title={trailerModal.title}
      />
    </PageShell>
  )
}
