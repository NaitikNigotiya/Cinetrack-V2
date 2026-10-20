/**
 * CineTrack v1 Import Verification Script
 *
 * Usage:
 *   npm run import:verify
 */

import fs from 'node:fs'
import path from 'node:path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { selectDashboardStats, selectAnalyticsMetrics } from '../src/domain/selectors'
import type { DomainLibraryEntry, DomainHistoryEvent } from '../src/domain/types'

// Load Environment Variables
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const idx = trimmed.indexOf('=')
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}
loadEnv()

// Expected Ratings Map from pasted v1 data
const EXPECTED_RATINGS: Record<string, number> = {
  'movie:550': 10,
  'tv:94997': 8,
  'tv:124364': 8,
  'tv:46648': 10,
  'movie:496243': 9,
  'tv:70523': 10,
  'movie:1339713': 7,
  'movie:634649': 8,
  'movie:936075': 10,
  'movie:969681': 9,
  'movie:278': 10,
  'movie:103': 8,
  'movie:1431068': 10,
  'movie:242582': 8,
  'movie:4922': 9,
  'movie:466272': 7,
  'movie:181886': 9,
  'movie:16869': 10,
  'movie:1233413': 7,
  'movie:807': 10,
  'movie:1359': 9,
  'movie:303991': 7,
  'movie:68718': 9,
  'movie:46738': 10,
}

const EXPECTED_FAVORITES = new Set([
  'movie:550', // Fight Club
  'movie:670', // Oldboy
  'movie:46738', // Incendies
  'movie:1431068', // Main Vaapas Aaunga
])

async function runVerify() {
  console.log('='.repeat(70))
  console.log('           CINETRACK V1 IMPORT VERIFICATION RUNNER')
  console.log('='.repeat(70))

  const projectId = (process.env.FIREBASE_PROJECT_ID || '').replace(/^["']|["']$/g, '')
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/^["']|["']$/g, '')
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/^["']|["']$/g, '')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[Error] Missing Firebase Admin credentials in .env.local')
    process.exit(1)
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  }

  const ownerEmail = 'nigotiyanaitik@gmail.com'
  const user = await getAuth().getUserByEmail(ownerEmail)
  const uid = user.uid

  const db = getFirestore()
  const libCol = db.collection(`users/${uid}/library`)
  const histCol = db.collection(`users/${uid}/history`)

  const [libSnap, histSnap] = await Promise.all([libCol.get(), histCol.get()])

  const libraryDocs = libSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    addedAt: d.data().addedAt?.toDate?.() || d.data().addedAt,
    updatedAt: d.data().updatedAt?.toDate?.() || d.data().updatedAt,
    completedAt: d.data().completedAt?.toDate?.() || d.data().completedAt,
    startedAt: d.data().startedAt?.toDate?.() || d.data().startedAt,
    lastWatchedAt: d.data().lastWatchedAt?.toDate?.() || d.data().lastWatchedAt,
  })) as unknown as DomainLibraryEntry[]

  const historyDocs = histSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    watchedAt: d.data().watchedAt?.toDate?.() || d.data().watchedAt,
    createdAt: d.data().createdAt?.toDate?.() || d.data().createdAt,
  })) as unknown as DomainHistoryEvent[]

  let failures = 0
  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`)
    } else {
      console.error(`  ❌ [FAIL] ${message}`)
      failures++
    }
  }

  console.log('\n--- 1. Library Counts & Status Assertions ---')
  assert(libraryDocs.length === 52, `Total library docs === 52 (actual: ${libraryDocs.length})`)

  const completed = libraryDocs.filter((e) => e.status === 'completed')
  const completedMovies = completed.filter((e) => e.type === 'movie')
  const completedTv = completed.filter((e) => e.type === 'tv')
  const planToWatch = libraryDocs.filter((e) => e.status === 'plan_to_watch')
  const dropped = libraryDocs.filter((e) => e.status === 'dropped')
  const watching = libraryDocs.filter((e) => e.status === 'watching')

  assert(
    completed.length === 46,
    `Completed titles === 46 (actual: ${completed.length}; movies: ${completedMovies.length}, tv: ${completedTv.length})`
  )
  assert(completedMovies.length === 38, `Completed movies === 38 (actual: ${completedMovies.length})`)
  assert(completedTv.length === 8, `Completed TV === 8 (actual: ${completedTv.length})`)
  assert(planToWatch.length === 3, `Plan to watch === 3 (actual: ${planToWatch.length})`)
  assert(dropped.length === 2, `Dropped === 2 (actual: ${dropped.length})`)
  assert(watching.length === 1, `Watching === 1 (actual: ${watching.length})`)

  console.log('\n--- 2. Watching & Continue Watching Assertions ---')
  const watchingKeys = watching.map((w) => w.titleKey)
  assert(
    watchingKeys.length === 1 && watchingKeys[0] === 'tv:200875',
    `Watching contains ONLY IT: Welcome to Derry (actual: ${watchingKeys.join(', ')})`
  )

  const derry = watching[0]
  if (derry && derry.tv) {
    assert(
      derry.tv.episodesWatched === 2,
      `IT: Welcome to Derry has episodesWatched === 2 (actual: ${derry.tv.episodesWatched})`
    )
    assert(
      derry.tv.nextEpisodeToWatch?.season === 1 && derry.tv.nextEpisodeToWatch?.episode === 3,
      `IT: Welcome to Derry nextEpisodeToWatch === S01E03 (actual: S0${derry.tv.nextEpisodeToWatch?.season}E0${derry.tv.nextEpisodeToWatch?.episode})`
    )
  } else {
    assert(false, 'IT: Welcome to Derry tv progress metadata exists')
  }

  console.log('\n--- 3. Single Status per Title Assertion ---')
  const titleKeysSeen = new Set<string>()
  let duplicatesFound = 0
  libraryDocs.forEach((e) => {
    if (titleKeysSeen.has(e.titleKey)) duplicatesFound++
    titleKeysSeen.add(e.titleKey)
  })
  assert(duplicatesFound === 0, `No title appears on multiple status pages (duplicates: ${duplicatesFound})`)

  console.log('\n--- 4. Favorites Assertions ---')
  const favorites = libraryDocs.filter((e) => Boolean(e.isFavorite))
  assert(favorites.length === 4, `Total favorites === 4 (actual: ${favorites.length})`)
  const favKeys = new Set(favorites.map((f) => f.titleKey))
  const favKeysMatch =
    EXPECTED_FAVORITES.size === favKeys.size &&
    [...EXPECTED_FAVORITES].every((k) => favKeys.has(k))
  assert(
    favKeysMatch,
    `Favorites match exactly Fight Club, Oldboy, Incendies, Main Vaapas Aaunga (actual: ${[
      ...favKeys,
    ].join(', ')})`
  )

  console.log('\n--- 5. Ratings Assertions ---')
  const rated = libraryDocs.filter((e) => typeof e.rating === 'number')
  assert(rated.length === 24, `Total rated titles === 24 (actual: ${rated.length})`)

  let ratingMismatches = 0
  for (const [key, expectedRating] of Object.entries(EXPECTED_RATINGS)) {
    const doc = libraryDocs.find((e) => e.titleKey === key)
    if (!doc || doc.rating !== expectedRating) {
      console.error(
        `  Mismatch for ${key}: expected ${expectedRating}, found ${doc?.rating}`
      )
      ratingMismatches++
    }
  }
  assert(
    ratingMismatches === 0,
    `All 24 ratings match their exact v1 values (mismatches: ${ratingMismatches})`
  )

  console.log('\n--- 6. History Events Assertions ---')
  const completedKeys = new Set(completed.map((c) => c.titleKey))
  const historyTitleKeys = new Set(historyDocs.map((h) => h.titleKey))

  let completedWithoutHistory = 0
  for (const cKey of completedKeys) {
    if (!historyTitleKeys.has(cKey)) {
      console.error(`  Completed title ${cKey} has no history event!`)
      completedWithoutHistory++
    }
  }
  assert(
    completedWithoutHistory === 0,
    `Every completed title has at least 1 history event (missing: ${completedWithoutHistory})`
  )
  assert(
    historyDocs.length >= 46,
    `Total history events >= 46 (actual: ${historyDocs.length})`
  )

  console.log('\n--- 7. Dashboard and Analytics Metric Equality ---')
  const dashStats = selectDashboardStats(libraryDocs, historyDocs)
  const analyticsStats = selectAnalyticsMetrics(libraryDocs, historyDocs, 'All Time', 'all')

  assert(
    dashStats.moviesWatched === analyticsStats.moviesCount &&
      dashStats.moviesWatched === completedMovies.length,
    `Dashboard movies (${dashStats.moviesWatched}) === Analytics movies (${analyticsStats.moviesCount}) === Completed movies (${completedMovies.length})`
  )
  assert(
    (dashStats.tvShows === 11 && analyticsStats.tvCount === completedTv.length) ||
      dashStats.tvShows === analyticsStats.tvCount,
    `Dashboard TV (${dashStats.tvShows}; 8 completed + 3 with progress) and Analytics TV (${analyticsStats.tvCount}) === Completed TV (${completedTv.length})`
  )
  assert(
    dashStats.hoursWatched === analyticsStats.watchTimeHours,
    `Dashboard hours (${dashStats.hoursWatched}) === Analytics hours (${analyticsStats.watchTimeHours})`
  )
  assert(
    dashStats.totalCompleted === completed.length,
    `Dashboard total completed (${dashStats.totalCompleted}) === Library completed (${completed.length})`
  )

  console.log('\n--- 8. Movie Metadata Quality (Runtime & Genres) ---')
  const zeroRuntimeMovies: string[] = []
  const emptyGenreMovies: string[] = []

  libraryDocs
    .filter((e) => e.type === 'movie')
    .forEach((m) => {
      if (!m.runtimeMinutes || m.runtimeMinutes <= 0) {
        zeroRuntimeMovies.push(`${m.title} (${m.titleKey})`)
      }
      if (!m.genres || m.genres.length === 0) {
        emptyGenreMovies.push(`${m.title} (${m.titleKey})`)
      }
    })

  assert(
    zeroRuntimeMovies.length === 0,
    `No movies have 0 runtime (exceptions: ${zeroRuntimeMovies.join(', ') || 'none'})`
  )
  assert(
    emptyGenreMovies.length === 0,
    `No movies have empty genres (exceptions: ${emptyGenreMovies.join(', ') || 'none'})`
  )

  console.log('\n' + '='.repeat(70))
  if (failures === 0) {
    console.log('🎉 ALL ASSERTIONS PASSED PERFECTLY!')
    console.log('='.repeat(70))
    process.exit(0)
  } else {
    console.error(`💥 VERIFICATION FAILED: ${failures} assertion(s) failed.`)
    console.log('='.repeat(70))
    process.exit(1)
  }
}

runVerify().catch((err) => {
  console.error('[Verification Fatal]:', err)
  process.exit(1)
})
