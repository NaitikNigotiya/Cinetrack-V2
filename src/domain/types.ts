/**
 * Pure domain types with NO Firebase and NO React dependencies.
 */
import type {
  LibraryEntry as SchemaLibraryEntry,
  HistoryEvent as SchemaHistoryEvent,
  Collection as SchemaCollection,
  CollectionItem as SchemaCollectionItem,
  LibraryStatus,
} from '@/shared/schemas'

export type CanonicalStatus = LibraryStatus
export type Priority = 'high' | 'normal' | 'low'

export type DomainLibraryEntry = SchemaLibraryEntry
export type LibraryEntry = SchemaLibraryEntry

export type DomainHistoryEvent = SchemaHistoryEvent
export type HistoryEvent = SchemaHistoryEvent

export type DomainCollection = SchemaCollection
export type Collection = SchemaCollection

export type DomainCollectionItem = SchemaCollectionItem
export type CollectionItem = SchemaCollectionItem

export interface GenreItem {
  id: number
  name: string
}

export interface TvProgressMeta {
  totalEpisodes?: number | null | undefined
  totalSeasons?: number | null | undefined
  episodesWatched?: number | undefined
  currentSeason?: number | null | undefined
  nextEpisodeToWatch?: { season: number; episode: number } | null | undefined
  tmdbStatus?: string | null | undefined
  nextAirDate?: string | null | undefined
}

export interface SmartCollection {
  id: string
  name: string
  description: string
  list: DomainLibraryEntry[]
  isBuiltIn: boolean
}

export interface WatchlistSmartGroups {
  waitingForRelease: DomainLibraryEntry[]
  watchSoon: DomainLibraryEntry[]
  thisWeekend: DomainLibraryEntry[]
  maybeLater: DomainLibraryEntry[]
}

export interface DashboardStats {
  moviesWatched: number
  tvShows: number
  hoursWatched: number
  avgRating: string
  completedThisMonth: number
  currentStreak: number
  longestStreak: number
  watchGoalProgress: number
  moviesCount: number
  tvShowsCount: number
  dayStreak: number
  totalCompleted: number
}
