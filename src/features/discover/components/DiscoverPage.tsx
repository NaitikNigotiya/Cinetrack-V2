import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tmdbClient } from '@/services/tmdb/tmdbClient'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { addToLibrary } from '@/features/library/api/libraryApi'
import { DiscoverCarousel } from './DiscoverCarousel'
import { GenreBrowseGrid } from './GenreBrowseGrid'
import type { GenreItem } from '../constants/genres'
import { toast } from '@/shared/ui'
import type { TmdbSearchResult } from '@/services/tmdb/tmdb.schema'
import styles from './DiscoverPage.module.css'

export default function DiscoverPage() {
  const { user } = useAuthStore()
  const uid = user?.uid
  const { entries: libraryEntries, refetch: refetchLibrary } = useLibrary('all')

  const libraryKeys = useMemo(() => {
    return new Set(libraryEntries.map((e) => e.titleKey))
  }, [libraryEntries])

  const [selectedGenre, setSelectedGenre] = useState<GenreItem | null>(null)

  // TMDB Queries
  const trendingQuery = useQuery({
    queryKey: ['tmdb', 'trending', 'week'],
    queryFn: () => tmdbClient.getTrending('all', 'week'),
    staleTime: 15 * 60 * 1000,
  })

  const popularMoviesQuery = useQuery({
    queryKey: ['tmdb', 'popular', 'movie'],
    queryFn: () => tmdbClient.getPopular('movie'),
    staleTime: 60 * 60 * 1000,
  })

  const popularTvQuery = useQuery({
    queryKey: ['tmdb', 'popular', 'tv'],
    queryFn: () => tmdbClient.getPopular('tv'),
    staleTime: 60 * 60 * 1000,
  })

  const topRatedQuery = useQuery({
    queryKey: ['tmdb', 'top_rated', 'movie'],
    queryFn: () => tmdbClient.getTopRated('movie'),
    staleTime: 60 * 60 * 1000,
  })

  const upcomingQuery = useQuery({
    queryKey: ['tmdb', 'upcoming'],
    queryFn: () => tmdbClient.getUpcoming(),
    staleTime: 60 * 60 * 1000,
  })

  const genreQuery = useQuery({
    queryKey: ['tmdb', 'genre', selectedGenre?.id],
    queryFn: () =>
      selectedGenre ? tmdbClient.discoverByGenre('movie', selectedGenre.id) : null,
    enabled: Boolean(selectedGenre),
    staleTime: 60 * 60 * 1000,
  })

  const handleQuickAdd = async (item: TmdbSearchResult) => {
    if (!uid) {
      toast.error('Sign in to add titles to your library.')
      return
    }

    const mediaType = item.media_type || (item.title ? 'movie' : 'tv')
    const titleKey = `${mediaType}:${item.id}`
    const title = item.title || item.name || 'Untitled'
    const releaseDate = item.release_date || item.first_air_date
    const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined

    try {
      await addToLibrary(uid, {
        titleKey,
        tmdbId: item.id,
        type: mediaType as 'movie' | 'tv',
        title,
        posterPath: item.poster_path ?? null,
        backdropPath: item.backdrop_path ?? null,
        year: year ?? null,
        genres: [],
        status: 'plan_to_watch',
        tv:
          mediaType === 'tv'
            ? {
                totalSeasons: 1,
                totalEpisodes: 10,
                episodesWatched: 0,
                currentSeason: 1,
                nextEpisodeToWatch: { season: 1, episode: 1 },
                tmdbStatus: 'Ended',
                nextAirDate: null,
              }
            : undefined,
      })
      toast.success(`Added "${title}" to Plan to Watch!`)
      refetchLibrary()
    } catch {
      toast.error('Failed to add title.')
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Discover</h1>
        <p className={styles.subtitle}>Explore trending, popular, and top-rated entertainment</p>
      </header>

      <DiscoverCarousel
        title="Trending This Week"
        subtitle="What audiences worldwide are watching right now"
        items={trendingQuery.data?.results}
        isLoading={trendingQuery.isLoading}
        libraryKeys={libraryKeys}
        onQuickAdd={handleQuickAdd}
      />

      <GenreBrowseGrid
        selectedGenreId={selectedGenre?.id}
        onSelectGenre={(genre) => {
          setSelectedGenre((prev) => (prev?.id === genre.id ? null : genre))
        }}
      />

      {selectedGenre && (
        <DiscoverCarousel
          title={`${selectedGenre.emoji} Top ${selectedGenre.name} Movies`}
          items={genreQuery.data?.results}
          isLoading={genreQuery.isLoading}
          libraryKeys={libraryKeys}
          onQuickAdd={handleQuickAdd}
        />
      )}

      <DiscoverCarousel
        title="Popular Movies"
        items={popularMoviesQuery.data?.results}
        isLoading={popularMoviesQuery.isLoading}
        libraryKeys={libraryKeys}
        onQuickAdd={handleQuickAdd}
      />

      <DiscoverCarousel
        title="Popular TV Shows"
        items={popularTvQuery.data?.results}
        isLoading={popularTvQuery.isLoading}
        libraryKeys={libraryKeys}
        onQuickAdd={handleQuickAdd}
      />

      <DiscoverCarousel
        title="Top Rated Movies"
        subtitle="All-time cinematic classics acclaimed by critics and viewers"
        items={topRatedQuery.data?.results}
        isLoading={topRatedQuery.isLoading}
        libraryKeys={libraryKeys}
        onQuickAdd={handleQuickAdd}
      />

      <DiscoverCarousel
        title="Coming Soon to Theatres"
        items={upcomingQuery.data?.results}
        isLoading={upcomingQuery.isLoading}
        libraryKeys={libraryKeys}
        onQuickAdd={handleQuickAdd}
      />
    </div>
  )
}
