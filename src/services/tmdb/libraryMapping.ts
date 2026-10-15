import { Timestamp, updateDoc } from 'firebase/firestore'
import { getLibraryDocRef } from '@/services/firebase/collections'
import type { TitleDetails, TitleSummary } from '@/shared/schemas/title'
import type { LibraryEntry, LibraryStatus } from '@/shared/schemas/library.schema'
import { parseTitleKey } from '@/shared/lib/ids'
import { getMovieDetails, getTvDetails } from './endpoints'
import { toTitleDetails } from './normalize/models'

/**
 * Builds the initial library entry data from TitleDetails or TitleSummary.
 * Strictly stores image paths, never full URLs.
 */
export function buildLibraryEntryFromTitle(
  title: TitleDetails | TitleSummary,
  status: LibraryStatus = 'plan_to_watch'
): Partial<LibraryEntry> {
  const isDetails = 'runtimeMinutes' in title
  const details = isDetails ? (title as TitleDetails) : null

  const now = Timestamp.now()

  const entry: Partial<LibraryEntry> = {
    titleKey: title.titleKey,
    tmdbId: title.tmdbId,
    type: title.type,
    title: title.title,
    originalTitle: title.originalTitle ?? undefined,
    year: title.year,
    posterPath: title.posterPath,
    backdropPath: title.backdropPath,
    genres: details ? details.genres : title.genreIds.map((id) => ({ id, name: '' })),
    runtimeMinutes: details ? details.runtimeMinutes : null,
    status,
    rating: null,
    isFavorite: false,
    watchCount: 0,
    lastWatchedAt: null,
    totalMinutesWatched: 0,
    tags: [],
    addedAt: now,
    startedAt: status === 'watching' ? now : null,
    completedAt: status === 'completed' ? now : null,
    updatedAt: now,
    schemaVersion: 1,
  }

  if (title.type === 'tv' && details?.tv) {
    entry.tv = {
      totalEpisodes: details.tv.totalEpisodes,
      totalSeasons: details.tv.totalSeasons,
      episodesWatched: 0,
      currentSeason: null,
      nextEpisodeToWatch: null,
      tmdbStatus: details.status,
      nextAirDate: details.tv.nextEpisodeToAir?.airDate ?? null,
    }
  }

  return entry
}

/**
 * Checks whether the stored library title metadata is stale.
 * - Detail view: stale if older than 7 days.
 * - Episode tracker for 'Returning Series': stale if older than 12 hours.
 */
export function isMetadataStale(
  entry: LibraryEntry & { metadataRefreshedAt?: Timestamp | null },
  context: 'detail' | 'tracker' = 'detail'
): boolean {
  const lastRefreshed = entry.metadataRefreshedAt || entry.updatedAt
  if (!lastRefreshed || typeof lastRefreshed.toMillis !== 'function') {
    return true
  }

  const ageMs = Date.now() - lastRefreshed.toMillis()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const twelveHoursMs = 12 * 60 * 60 * 1000

  if (context === 'tracker' && entry.tv?.tmdbStatus === 'Returning Series') {
    return ageMs >= twelveHoursMs
  }

  return ageMs >= sevenDaysMs
}

export interface RefreshResult {
  updated: boolean
  hasNewEpisodes: boolean
  previousEpisodes?: number
  newEpisodes?: number
}

/**
 * Refreshes stored TMDB metadata in Firestore with a field mask.
 * Never touches status, rating, notes, history, or counters.
 */
export async function refreshTitleMetadata(
  uid: string,
  entry: LibraryEntry,
  options: { force?: boolean; context?: 'detail' | 'tracker'; userRegion?: string } = {}
): Promise<RefreshResult> {
  const isStale = isMetadataStale(entry, options.context ?? 'detail')
  if (!isStale && !options.force) {
    return { updated: false, hasNewEpisodes: false }
  }

  const parsed = parseTitleKey(entry.titleKey)
  if (!parsed) {
    return { updated: false, hasNewEpisodes: false }
  }

  // Fetch fresh details from TMDB proxy
  const rawData =
    parsed.type === 'movie'
      ? await getMovieDetails(parsed.tmdbId)
      : await getTvDetails(parsed.tmdbId)

  const freshDetails = toTitleDetails(rawData as never, parsed.type, {
    userRegion: options.userRegion || 'US',
  })

  // Detect new episodes for completed show
  let hasNewEpisodes = false
  const previousEpisodes = entry.tv?.totalEpisodes ?? 0
  const newEpisodes = freshDetails.tv?.totalEpisodes ?? previousEpisodes

  if (
    entry.type === 'tv' &&
    entry.status === 'completed' &&
    newEpisodes > previousEpisodes &&
    previousEpisodes > 0
  ) {
    hasNewEpisodes = true
  }

  // Build field mask: only update metadata fields
  const now = Timestamp.now()
  const metadataUpdate: Record<string, unknown> = {
    title: freshDetails.title,
    originalTitle: freshDetails.originalTitle ?? null,
    year: freshDetails.year,
    posterPath: freshDetails.posterPath,
    backdropPath: freshDetails.backdropPath,
    genres: freshDetails.genres,
    runtimeMinutes: freshDetails.runtimeMinutes,
    updatedAt: now,
    metadataRefreshedAt: now,
  }

  if (freshDetails.type === 'tv' && freshDetails.tv) {
    metadataUpdate['tv.totalEpisodes'] = freshDetails.tv.totalEpisodes
    metadataUpdate['tv.totalSeasons'] = freshDetails.tv.totalSeasons
    metadataUpdate['tv.tmdbStatus'] = freshDetails.status
    metadataUpdate['tv.nextAirDate'] = freshDetails.tv.nextEpisodeToAir?.airDate ?? null
  }

  // Execute partial update on Firestore document
  try {
    const docRef = getLibraryDocRef(uid, entry.titleKey)
    await updateDoc(docRef, metadataUpdate)
  } catch (err) {
    console.warn(`[TMDB Metadata Refresh] Failed to update Firestore for ${entry.titleKey}:`, err)
    return { updated: false, hasNewEpisodes: false }
  }

  return {
    updated: true,
    hasNewEpisodes,
    previousEpisodes,
    newEpisodes,
  }
}
