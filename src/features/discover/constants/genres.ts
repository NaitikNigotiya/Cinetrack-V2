export interface GenreItem {
  id: number
  name: string
  emoji: string
}

export const POPULAR_GENRES: GenreItem[] = [
  { id: 28, name: 'Action', emoji: '💥' },
  { id: 12, name: 'Adventure', emoji: '🗺️' },
  { id: 16, name: 'Animation', emoji: '🎨' },
  { id: 35, name: 'Comedy', emoji: '😂' },
  { id: 80, name: 'Crime', emoji: '🕵️' },
  { id: 99, name: 'Documentary', emoji: '📽️' },
  { id: 18, name: 'Drama', emoji: '🎭' },
  { id: 14, name: 'Fantasy', emoji: '🧙' },
  { id: 27, name: 'Horror', emoji: '👻' },
  { id: 878, name: 'Sci-Fi', emoji: '🚀' },
  { id: 53, name: 'Thriller', emoji: '⚡' },
  { id: 10749, name: 'Romance', emoji: '❤️' },
]
