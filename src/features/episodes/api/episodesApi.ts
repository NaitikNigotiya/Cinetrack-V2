import {
  runTransaction,
  writeBatch,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from '@/services/firebase/db'
import {
  getLibraryDocRef,
  getSeasonDocRef,
  getHistoryDocRef,
  getStatsSummaryDocRef,
} from '@/services/firebase/collections'
import { makeEpisodeLabel, makeEpisodeEventId } from '@/shared/lib/ids'
import type { SeasonDoc, LibraryEntry } from '@/shared/schemas'

export interface EpisodeInfo {
  episodeNumber: number
  runtimeMinutes: number
  title: string
  airDate?: string | null
}

/**
 * Atomically marks an episode watched or unwatched.
 * Updates season doc, library tv counters, writes/deletes deterministic history doc, and updates stats.
 */
export async function toggleEpisodeWatched(
  uid: string,
  titleKey: string,
  seasonNumber: number,
  episode: EpisodeInfo,
  watched: boolean
): Promise<{ completedShow: boolean }> {
  let completedShow = false

  await runTransaction(db, async (tx) => {
    const libRef = getLibraryDocRef(uid, titleKey)
    const seasonRef = getSeasonDocRef(uid, titleKey, seasonNumber)
    const statsRef = getStatsSummaryDocRef(uid)
    const eventId = makeEpisodeEventId(titleKey, seasonNumber, episode.episodeNumber)
    const historyRef = getHistoryDocRef(uid, eventId)

    const [libSnap, seasonSnap] = await Promise.all([
      tx.get(libRef),
      tx.get(seasonRef),
    ])

    if (!libSnap.exists()) {
      throw new Error(`Library entry "${titleKey}" does not exist`)
    }

    const libData = libSnap.data() as LibraryEntry
    const seasonData: SeasonDoc = seasonSnap.exists()
      ? (seasonSnap.data() as SeasonDoc)
      : {
          season: seasonNumber,
          totalEpisodes: null,
          watched: {},
          watchedCount: 0,
          minutesWatched: 0,
          completed: false,
          updatedAt: serverTimestamp(),
        }

    const episodeStr = episode.episodeNumber.toString()
    const now = serverTimestamp()
    const currentWatchedMap = { ...seasonData.watched }

    let countDelta = 0
    let minutesDelta = 0
    const runtime = episode.runtimeMinutes || libData.runtimeMinutes || 45

    if (watched) {
      if (!currentWatchedMap[episodeStr]) {
        currentWatchedMap[episodeStr] = now
        countDelta = 1
        minutesDelta = runtime

        // Write deterministic history doc
        tx.set(historyRef, {
          eventId,
          titleKey,
          title: libData.title,
          type: 'tv_episode',
          season: seasonNumber,
          episode: episode.episodeNumber,
          episodeLabel: makeEpisodeLabel(seasonNumber, episode.episodeNumber),
          watchedAt: now,
          runtimeMinutes: runtime,
          posterPath: libData.posterPath,
          genreIds: libData.genres.map((g) => g.id),
          source: 'manual',
          createdAt: now,
          schemaVersion: 1,
        })
      }
    } else {
      if (currentWatchedMap[episodeStr]) {
        delete currentWatchedMap[episodeStr]
        countDelta = -1
        minutesDelta = -runtime

        // Delete deterministic history doc
        tx.delete(historyRef)
      }
    }

    const newSeasonWatchedCount = Math.max(0, seasonData.watchedCount + countDelta)
    const newSeasonMinutesWatched = Math.max(0, seasonData.minutesWatched + minutesDelta)
    const isSeasonComplete = Boolean(
      seasonData.totalEpisodes && newSeasonWatchedCount >= seasonData.totalEpisodes
    )

    // Save season doc
    tx.set(seasonRef, {
      ...seasonData,
      watched: currentWatchedMap,
      watchedCount: newSeasonWatchedCount,
      minutesWatched: newSeasonMinutesWatched,
      completed: isSeasonComplete,
      updatedAt: now,
    })

    // Update title tv counters
    const currentTv = libData.tv || {
      totalEpisodes: null,
      totalSeasons: null,
      episodesWatched: 0,
      currentSeason: seasonNumber,
      nextEpisodeToWatch: null,
      tmdbStatus: null,
      nextAirDate: null,
    }

    const newEpisodesWatched = Math.max(0, currentTv.episodesWatched + countDelta)
    const newTotalMinutes = Math.max(0, (libData.totalMinutesWatched || 0) + minutesDelta)

    let nextStatus = libData.status
    if (watched && libData.status === 'plan_to_watch') {
      nextStatus = 'watching'
    }

    // Auto-complete if finished all episodes and show is ended
    if (
      watched &&
      currentTv.totalEpisodes &&
      newEpisodesWatched >= currentTv.totalEpisodes &&
      currentTv.tmdbStatus === 'Ended'
    ) {
      nextStatus = 'completed'
      completedShow = true
    }

    const nextEpisode = watched
      ? { season: seasonNumber, episode: episode.episodeNumber + 1 }
      : { season: seasonNumber, episode: episode.episodeNumber }

    tx.update(libRef, {
      status: nextStatus,
      totalMinutesWatched: newTotalMinutes,
      lastWatchedAt: watched ? now : libData.lastWatchedAt,
      'tv.episodesWatched': newEpisodesWatched,
      'tv.currentSeason': seasonNumber,
      'tv.nextEpisodeToWatch': nextEpisode,
      updatedAt: now,
    })

    // Update pre-aggregated stats
    tx.set(
      statsRef,
      {
        episodesWatched: increment(countDelta),
        minutesWatched: increment(minutesDelta),
        updatedAt: now,
      },
      { merge: true }
    )
  })

  return { completedShow }
}

/**
 * Atomically marks an entire season watched or unwatched.
 */
export async function toggleSeasonWatched(
  uid: string,
  titleKey: string,
  seasonNumber: number,
  episodes: EpisodeInfo[],
  watched: boolean
): Promise<void> {
  const batch = writeBatch(db)
  const seasonRef = getSeasonDocRef(uid, titleKey, seasonNumber)
  const libRef = getLibraryDocRef(uid, titleKey)
  const now = serverTimestamp()

  const watchedMap: Record<string, unknown> = {}
  let totalSeasonMinutes = 0

  episodes.forEach((ep) => {
    const runtime = ep.runtimeMinutes || 45
    totalSeasonMinutes += runtime
    const eventId = makeEpisodeEventId(titleKey, seasonNumber, ep.episodeNumber)
    const historyRef = getHistoryDocRef(uid, eventId)

    if (watched) {
      watchedMap[ep.episodeNumber.toString()] = now
      batch.set(historyRef, {
        eventId,
        titleKey,
        title: ep.title,
        type: 'tv_episode',
        season: seasonNumber,
        episode: ep.episodeNumber,
        episodeLabel: makeEpisodeLabel(seasonNumber, ep.episodeNumber),
        watchedAt: now,
        runtimeMinutes: runtime,
        posterPath: null,
        genreIds: [],
        source: 'season_bulk',
        createdAt: now,
        schemaVersion: 1,
      })
    } else {
      batch.delete(historyRef)
    }
  })

  batch.set(seasonRef, {
    season: seasonNumber,
    totalEpisodes: episodes.length,
    watched: watched ? watchedMap : {},
    watchedCount: watched ? episodes.length : 0,
    minutesWatched: watched ? totalSeasonMinutes : 0,
    completed: watched,
    updatedAt: now,
  })

  batch.update(libRef, {
    updatedAt: now,
  })

  await batch.commit()
}
