import type { CarouselItem } from '@/shared/ui/ContentCarousel/ContentCarousel'

export const GENRE_SECTIONS = [
  { id: 28, label: 'Action', color: '#E53E3E', emoji: '💥' },
  { id: 35, label: 'Comedy', color: '#D69E2E', emoji: '😂' },
  { id: 27, label: 'Horror', color: '#6B46C1', emoji: '👻' },
  { id: 53, label: 'Thriller', color: '#2D3748', emoji: '🔪' },
  { id: 18, label: 'Drama', color: '#3182CE', emoji: '🎭' },
  { id: 16, label: 'Animation', color: '#38A169', emoji: '🎨' },
]

export function tmdbToCarousel(item: any): CarouselItem {
  return {
    id: item.id,
    media_type: item.media_type ?? (item.title ? 'movie' : 'tv'),
    title: item.title ?? item.name,
    name: item.name,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    vote_average: item.vote_average ?? item.voteAverage,
    overview: item.overview,
    genre_ids: item.genre_ids,
  }
}

export function getItemTitle(item: CarouselItem) {
  return item.title ?? item.name ?? 'Untitled'
}
