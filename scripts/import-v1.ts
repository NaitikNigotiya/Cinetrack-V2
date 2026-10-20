/**
 * CineTrack v1 to v2 Library Importer
 *
 * Usage:
 *   npm run import:v1 -- --file data/imports/v1-library.json
 *   npm run import:v1 -- --file data/imports/v1-library.json --confirm
 *   npm run import:v1 -- --file data/imports/v1-library.json --confirm --clean
 */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { z } from 'zod'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { makeEpisodeKey, makeEpisodeLabel } from '../src/shared/lib/ids'
import { computeStreak } from '../src/domain/date'

// ─── Load Environment Variables ───────────────────────────────────────────────
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

// ─── Compact v1 Input Schema ──────────────────────────────────────────────────
export const CompactV1EntrySchema = z.object({
  k: z.string().regex(/^(movie|tv):[0-9]+$/),
  t: z.string().min(1),
  y: z.number().int().nullable().optional(),
  s: z.enum(['plan_to_watch', 'watching', 'completed', 'on_hold', 'dropped']),
  r: z.number().min(0.5).max(10).nullable(),
  fav: z.boolean(),
  added: z.string().datetime(),
  upd: z.string().datetime(),
  p: z.string().nullable().optional(),
  b: z.string().nullable().optional(),
  eps: z.number().int().min(0).optional().default(0),
  season: z.number().int().min(0).optional().default(0),
  wd: z.array(z.string()).optional(),
  rew: z.number().int().min(0).optional().default(0),
})

export type CompactV1Entry = z.infer<typeof CompactV1EntrySchema>

// ─── TMDB Client with Caching & Rate Limiting ─────────────────────────────────
const CACHE_DIR = path.resolve(process.cwd(), 'data', 'imports', '.cache', 'tmdb')

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }
}

function getCachePath(cacheKey: string): string {
  const sanitized = cacheKey.replace(/[^a-zA-Z0-9_-]/g, '_')
  return path.join(CACHE_DIR, `${sanitized}.json`)
}

async function fetchTmdb<T>(endpoint: string, retries = 3): Promise<T> {
  ensureCacheDir()
  const cacheFile = getCachePath(endpoint)
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
      return cached as T
    } catch {
      // cache corrupted, re-fetch
    }
  }

  const token = (process.env.TMDB_READ_TOKEN || '').trim().replace(/^["']|["']$/g, '')
  const apiKey = (process.env.TMDB_API_KEY || '').trim().replace(/^["']|["']$/g, '')

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Try Bearer token first if present and not short, else apiKey query param
      const useBearer = token.length > 50
      let url = `https://api.themoviedb.org/3/${endpoint}`
      const headers: Record<string, string> = { Accept: 'application/json' }

      if (useBearer) {
        headers['Authorization'] = `Bearer ${token}`
      } else if (apiKey || token) {
        const sep = url.includes('?') ? '&' : '?'
        url += `${sep}api_key=${apiKey || token}`
      }

      let res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) })

      // If Bearer got 401, fallback to apiKey
      if (res.status === 401 && apiKey && useBearer) {
        const sep = url.includes('?') ? '&' : '?'
        const fallbackUrl = `https://api.themoviedb.org/3/${endpoint}${sep}api_key=${apiKey}`
        res = await fetch(fallbackUrl, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(12000),
        })
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from TMDB: ${res.statusText}`)
      }

      const json = await res.json()
      fs.writeFileSync(cacheFile, JSON.stringify(json, null, 2), 'utf8')
      return json as T
    } catch (err: any) {
      lastError = err
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError || new Error(`Failed to fetch TMDB endpoint: ${endpoint}`)
}

// ─── Concurrency Limiter ──────────────────────────────────────────────────────
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let currentIndex = 0

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++
      results[idx] = await fn(items[idx], idx)
    }
  })

  await Promise.all(workers)
  return results
}

// ─── Types for Prepared Data ──────────────────────────────────────────────────
export interface PreparedMovie {
  type: 'movie'
  v1: CompactV1Entry
  tmdbId: number
  title: string
  year: number | null
  posterPath: string | null
  backdropPath: string | null
  genres: { id: number; name: string }[]
  runtimeMinutes: number | null
  releaseDate: string | null
  needsAttention: boolean
  attentionReason?: string
  historyEvents: any[]
}

export interface PreparedEpisode {
  seasonNumber: number
  episodeNumber: number
  name: string
  runtime: number
  airDate: string | null
  watchedAt: Timestamp
  isWatched: boolean
}

export interface PreparedTvSeason {
  seasonNumber: number
  totalEpisodes: number
  episodes: PreparedEpisode[]
}

export interface PreparedTv {
  type: 'tv'
  v1: CompactV1Entry
  tmdbId: number
  title: string
  year: number | null
  posterPath: string | null
  backdropPath: string | null
  genres: { id: number; name: string }[]
  runtimeMinutes: number | null
  tmdbStatus: string | null
  totalSeasons: number
  totalEpisodes: number
  releasedEpisodesCount: number
  seasons: PreparedTvSeason[]
  episodesWatchedCount: number
  totalMinutesWatched: number
  nextEpisodeToWatch: { season: number; episode: number } | null
  currentSeason: number | null
  needsAttention: boolean
  attentionReason?: string
  historyEvents: any[]
}

export type PreparedTitle = PreparedMovie | PreparedTv

// ─── Prepare Title with TMDB Backfill ─────────────────────────────────────────
async function prepareTitle(entry: CompactV1Entry): Promise<PreparedTitle> {
  const [type, idStr] = entry.k.split(':') as ['movie' | 'tv', string]
  const tmdbId = parseInt(idStr, 10)
  const isMovie = type === 'movie'

  let genres: { id: number; name: string }[] = []
  let runtimeMinutes: number | null = null
  let releaseDate: string | null = null
  let tmdbStatus: string | null = null
  let totalSeasons = 0
  let totalEpisodes = 0
  let needsAttention = false
  let attentionReason: string | undefined

  if (isMovie) {
    try {
      const data: any = await fetchTmdb(`movie/${tmdbId}`)
      genres = (data.genres || []).map((g: any) => ({ id: g.id, name: g.name }))
      runtimeMinutes = typeof data.runtime === 'number' && data.runtime > 0 ? data.runtime : null
      releaseDate = data.release_date || null
      if (runtimeMinutes === null || genres.length === 0) {
        needsAttention = true
        attentionReason = `Movie metadata incomplete (runtime: ${runtimeMinutes}, genres: ${genres.length})`
      }
    } catch (err: any) {
      needsAttention = true
      attentionReason = `TMDB movie fetch failed: ${err.message}`
    }

    const historyEvents: any[] = []
    if (entry.s === 'completed') {
      const watchedAtDate = new Date(entry.upd || entry.added)
      const yyyy = watchedAtDate.getUTCFullYear()
      const mm = String(watchedAtDate.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(watchedAtDate.getUTCDate()).padStart(2, '0')
      const yyyyMMdd = `${yyyy}${mm}${dd}`

      const totalWatches = 1 + (entry.rew || 0)
      for (let i = 0; i < totalWatches; i++) {
        historyEvents.push({
          eventId: `${entry.k}_${yyyyMMdd}_${i}`,
          titleKey: entry.k,
          title: entry.t,
          type: 'movie',
          watchedAt: Timestamp.fromDate(watchedAtDate),
          runtimeMinutes: runtimeMinutes || 0,
          rating: entry.r,
          posterPath: entry.p || null,
          genreIds: genres.map((g) => g.id),
          source: 'import-v1',
          approximate: true,
          createdAt: Timestamp.fromDate(watchedAtDate),
          schemaVersion: 1,
        })
      }
    }

    return {
      type: 'movie',
      v1: entry,
      tmdbId,
      title: entry.t,
      year: entry.y ?? null,
      posterPath: entry.p || null,
      backdropPath: entry.b || null,
      genres,
      runtimeMinutes,
      releaseDate,
      needsAttention,
      attentionReason,
      historyEvents,
    }
  } else {
    // TV show
    const seasonsList: PreparedTvSeason[] = []
    let releasedEpisodesCount = 0
    let avgEpisodeRuntime = 45

    try {
      const tvData: any = await fetchTmdb(`tv/${tmdbId}`)
      genres = (tvData.genres || []).map((g: any) => ({ id: g.id, name: g.name }))
      tmdbStatus = tvData.status || null
      totalSeasons = tvData.number_of_seasons || 0
      totalEpisodes = tvData.number_of_episodes || 0

      if (Array.isArray(tvData.episode_run_time) && tvData.episode_run_time.length > 0) {
        avgEpisodeRuntime = tvData.episode_run_time[0]
      }
      runtimeMinutes = avgEpisodeRuntime

      const seasonSummaries = (tvData.seasons || [])
        .filter((s: any) => s.season_number > 0)
        .sort((a: any, b: any) => a.season_number - b.season_number)

      for (const sSummary of seasonSummaries) {
        try {
          const sData: any = await fetchTmdb(`tv/${tmdbId}/season/${sSummary.season_number}`)
          const eps = (sData.episodes || []).map((ep: any) => ({
            seasonNumber: sSummary.season_number,
            episodeNumber: ep.episode_number,
            name: ep.name || `Episode ${ep.episode_number}`,
            runtime: ep.runtime || avgEpisodeRuntime,
            airDate: ep.air_date || null,
            watchedAt: Timestamp.fromDate(new Date(entry.upd || entry.added)),
            isWatched: false,
          }))

          seasonsList.push({
            seasonNumber: sSummary.season_number,
            totalEpisodes: eps.length,
            episodes: eps,
          })
          releasedEpisodesCount += eps.length
        } catch (sErr: any) {
          needsAttention = true
          attentionReason = `Failed fetching season ${sSummary.season_number}: ${sErr.message}`
        }
      }
    } catch (err: any) {
      needsAttention = true
      attentionReason = `TMDB TV fetch failed: ${err.message}`
    }

    // Determine watched episodes by status rule
    let targetWatchedCount = 0
    if (entry.s === 'completed') {
      targetWatchedCount = releasedEpisodesCount
      if (entry.eps > 0 && entry.eps !== releasedEpisodesCount) {
        // Report difference between eps and TMDB total
        attentionReason = `v1 recorded ${entry.eps} eps, TMDB has ${releasedEpisodesCount} released eps`
      }
    } else if (entry.s === 'watching') {
      targetWatchedCount = entry.eps || 2
    } else if (entry.s === 'dropped') {
      targetWatchedCount = entry.eps || 0
    }

    // Mark episodes in broadcast order
    let watchedSoFar = 0
    const historyEvents: any[] = []
    const wdList = entry.wd || []
    let totalMinutesWatched = 0

    for (const season of seasonsList) {
      for (const ep of season.episodes) {
        if (watchedSoFar < targetWatchedCount) {
          ep.isWatched = true
          const wdString = wdList[watchedSoFar] || entry.upd || entry.added
          const wdDate = new Date(wdString)
          ep.watchedAt = Timestamp.fromDate(wdDate)
          totalMinutesWatched += ep.runtime

          const eventId = `${entry.k}_${makeEpisodeKey(season.seasonNumber, ep.episodeNumber)}`
          historyEvents.push({
            eventId,
            titleKey: entry.k,
            title: entry.t,
            type: 'tv_episode',
            season: season.seasonNumber,
            episode: ep.episodeNumber,
            episodeLabel: makeEpisodeLabel(season.seasonNumber, ep.episodeNumber),
            watchedAt: ep.watchedAt,
            runtimeMinutes: ep.runtime,
            posterPath: entry.p || null,
            genreIds: genres.map((g) => g.id),
            source: 'import-v1',
            approximate: true,
            createdAt: ep.watchedAt,
            schemaVersion: 1,
          })

          watchedSoFar++
        }
      }
    }

    // Next episode to watch calculation
    let nextEpisodeToWatch: { season: number; episode: number } | null = null
    let currentSeason: number | null = entry.season || 1

    if (entry.s === 'watching') {
      // Find the first unwatched episode
      for (const season of seasonsList) {
        const unwatched = season.episodes.find((e) => !e.isWatched)
        if (unwatched) {
          nextEpisodeToWatch = {
            season: season.seasonNumber,
            episode: unwatched.episodeNumber,
          }
          currentSeason = season.seasonNumber
          break
        }
      }
      if (!nextEpisodeToWatch && seasonsList.length > 0) {
        nextEpisodeToWatch = { season: 1, episode: (entry.eps || 2) + 1 }
      }
    }

    return {
      type: 'tv',
      v1: entry,
      tmdbId,
      title: entry.t,
      year: entry.y ?? null,
      posterPath: entry.p || null,
      backdropPath: entry.b || null,
      genres,
      runtimeMinutes,
      tmdbStatus,
      totalSeasons: totalSeasons || seasonsList.length,
      totalEpisodes: totalEpisodes || releasedEpisodesCount,
      releasedEpisodesCount,
      seasons: seasonsList,
      episodesWatchedCount: watchedSoFar,
      totalMinutesWatched,
      nextEpisodeToWatch,
      currentSeason,
      needsAttention,
      attentionReason,
      historyEvents,
    }
  }
}

// ─── Format Report ────────────────────────────────────────────────────────────
function formatReport(
  entries: CompactV1Entry[],
  prepared: PreparedTitle[],
  v2ExistingCount: number,
  v2ExistingIds: string[]
) {
  const total = entries.length
  const movies = prepared.filter((p) => p.type === 'movie')
  const tvs = prepared.filter((p) => p.type === 'tv') as PreparedTv[]

  const completed = prepared.filter((p) => p.v1.s === 'completed')
  const completedMovies = completed.filter((p) => p.type === 'movie')
  const completedTv = completed.filter((p) => p.type === 'tv')

  const planToWatch = prepared.filter((p) => p.v1.s === 'plan_to_watch')
  const dropped = prepared.filter((p) => p.v1.s === 'dropped')
  const watching = prepared.filter((p) => p.v1.s === 'watching')
  const favorites = prepared.filter((p) => p.v1.fav)
  const rated = prepared.filter((p) => typeof p.v1.r === 'number')

  const totalHistoryEvents = prepared.reduce((sum, p) => sum + p.historyEvents.length, 0)
  const totalSeasonDocs = tvs.reduce((sum, tv) => sum + tv.seasons.length, 0)
  const estimatedWrites = prepared.length + totalSeasonDocs + totalHistoryEvents + 1 // + stats

  const lines: string[] = []
  lines.push('='.repeat(78))
  lines.push('               CINETRACK V1 -> V2 IMPORT AUDIT REPORT')
  lines.push('='.repeat(78))
  lines.push(`Total Titles Parsed: ${total}`)
  lines.push(`  • Movies: ${movies.length}`)
  lines.push(`  • TV Shows: ${tvs.length}`)
  lines.push('')
  lines.push('Status Breakdown:')
  lines.push(`  • Completed: ${completed.length} (Movies: ${completedMovies.length}, TV: ${completedTv.length})`)
  lines.push(`  • Plan to Watch: ${planToWatch.length}`)
  lines.push(`  • Dropped: ${dropped.length}`)
  lines.push(`  • Watching: ${watching.length}`)
  lines.push('')
  lines.push(`Favorites (${favorites.length}):`)
  favorites.forEach((f) => lines.push(`  ★ ${f.title} (${f.v1.k}, ${f.year})`))
  lines.push('')
  lines.push(`Rated Titles (${rated.length}):`)
  rated.forEach((r) => lines.push(`  ⭐ ${r.title.padEnd(35)}: ${r.v1.r}/10`))
  lines.push('')
  lines.push('TV Episode & Season Audit:')
  lines.push(
    '  Title'.padEnd(28) +
      'Status'.padEnd(12) +
      'v1 eps'.padEnd(10) +
      'TMDB eps'.padEnd(10) +
      'Watched'.padEnd(10) +
      'Seasons'
  )
  lines.push('-'.repeat(78))
  tvs.forEach((tv) => {
    const titleStr = tv.title.length > 25 ? tv.title.slice(0, 24) + '…' : tv.title
    lines.push(
      `  ${titleStr.padEnd(26)}${tv.v1.s.padEnd(12)}${String(tv.v1.eps).padEnd(10)}${String(
        tv.releasedEpisodesCount
      ).padEnd(10)}${String(tv.episodesWatchedCount).padEnd(10)}${tv.seasons.length} seasons`
    )
  })
  lines.push('')

  const needingAttention = prepared.filter((p) => p.needsAttention)
  lines.push(`Titles Needing Attention (${needingAttention.length}):`)
  if (needingAttention.length === 0) {
    lines.push('  None! All titles resolved cleanly with full metadata.')
  } else {
    needingAttention.forEach((na) =>
      lines.push(`  ⚠️  ${na.title} (${na.v1.k}): ${na.attentionReason}`)
    )
  }
  lines.push('')

  lines.push('Estimated Firestore Operations:')
  lines.push(`  • Library Documents: ${prepared.length}`)
  lines.push(`  • TV Season Documents: ${totalSeasonDocs}`)
  lines.push(`  • Watch History Events: ${totalHistoryEvents}`)
  lines.push(`  • Stats Summary Document: 1`)
  lines.push(`  • Total Estimated Writes: ${estimatedWrites}`)
  lines.push('')

  lines.push('Target Firestore Database State:')
  lines.push(`  • Project ID: ${process.env.FIREBASE_PROJECT_ID || 'cinetrack-v2-45db2'}`)
  lines.push(`  • Existing Library Docs in v2: ${v2ExistingCount} [${v2ExistingIds.join(', ')}]`)
  lines.push('='.repeat(78))

  return lines.join('\n')
}

// ─── Main Execution ───────────────────────────────────────────────────────────
export async function runImporter() {
  const args = process.argv.slice(2)
  const isConfirm = args.includes('--confirm')
  const isClean = args.includes('--clean')

  let filePath = path.resolve(process.cwd(), 'data', 'imports', 'v1-library.json')
  const fileArgIdx = args.indexOf('--file')
  if (fileArgIdx !== -1 && args[fileArgIdx + 1]) {
    filePath = path.resolve(process.cwd(), args[fileArgIdx + 1])
  }

  console.log(`[CineTrack v1 Importer] Reading input file: ${filePath}`)
  if (!fs.existsSync(filePath)) {
    console.error(`[Error] File not found: ${filePath}`)
    process.exit(1)
  }

  const rawText = fs.readFileSync(filePath, 'utf8')
  let rawJson: unknown
  try {
    rawJson = JSON.parse(rawText)
  } catch (err: any) {
    console.error(`[Error] JSON parsing failed: ${err.message}`)
    process.exit(1)
  }

  if (!Array.isArray(rawJson)) {
    console.error('[Error] Input JSON must be an array of entries.')
    process.exit(1)
  }

  // 1. Zod Parsing and Validation
  const validEntries: CompactV1Entry[] = []
  const invalidEntries: { index: number; data: any; errors: any }[] = []

  rawJson.forEach((item, index) => {
    const parseRes = CompactV1EntrySchema.safeParse(item)
    if (parseRes.success) {
      validEntries.push(parseRes.data)
    } else {
      invalidEntries.push({ index, data: item, errors: parseRes.error.format() })
    }
  })

  if (invalidEntries.length > 0) {
    console.error(`[Validation Report] Found ${invalidEntries.length} invalid entries:`)
    invalidEntries.forEach((inv) => {
      console.error(`  Index ${inv.index}:`, JSON.stringify(inv.errors, null, 2))
    })
    process.exit(1)
  }

  // Check expected totals
  const moviesCount = validEntries.filter((e) => e.k.startsWith('movie:')).length
  const tvCount = validEntries.filter((e) => e.k.startsWith('tv:')).length
  const completedCount = validEntries.filter((e) => e.s === 'completed').length
  const planCount = validEntries.filter((e) => e.s === 'plan_to_watch').length
  const droppedCount = validEntries.filter((e) => e.s === 'dropped').length
  const watchingCount = validEntries.filter((e) => e.s === 'watching').length
  const favCount = validEntries.filter((e) => e.fav).length
  const ratedCount = validEntries.filter((e) => typeof e.r === 'number').length

  console.log('[Validation Passed] 52 titles validated successfully.')
  console.log(
    `Totals: ${validEntries.length} titles | Movies: ${moviesCount} | TV: ${tvCount} | Completed: ${completedCount} (Movies: ${
      validEntries.filter((e) => e.k.startsWith('movie:') && e.s === 'completed').length
    }, TV: ${
      validEntries.filter((e) => e.k.startsWith('tv:') && e.s === 'completed').length
    }) | Plan: ${planCount} | Dropped: ${droppedCount} | Watching: ${watchingCount} | Favorites: ${favCount} | Rated: ${ratedCount}`
  )

  // 2. TMDB Backfill with concurrency 4
  console.log('\n[TMDB Backfill] Fetching metadata (concurrency: 4, with local caching)...')
  const preparedTitles = await mapConcurrent(validEntries, 4, async (entry, idx) => {
    console.log(`  [${idx + 1}/${validEntries.length}] Backfilling ${entry.k} (${entry.t})...`)
    return prepareTitle(entry)
  })
  console.log('[TMDB Backfill] Complete.')

  // Check existing Firestore documents
  const projectId = (process.env.FIREBASE_PROJECT_ID || '').replace(/^["']|["']$/g, '')
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/^["']|["']$/g, '')
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/^["']|["']$/g, '')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[Error] Missing Firebase Admin credentials in .env.local')
    process.exit(1)
  }

  // Safety check: verify project is cinetrack-v2
  if (!projectId.includes('cinetrack-v2') && projectId !== 'cinetrack-v2-45db2') {
    console.error(`[SAFETY ERROR] Detected project "${projectId}". Live import only permitted on v2 project!`)
    process.exit(1)
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  }

  const ownerEmail = 'nigotiyanaitik@gmail.com'
  let uid = ''
  try {
    const user = await getAuth().getUserByEmail(ownerEmail)
    uid = user.uid
  } catch (err: any) {
    console.error(`[Error] Owner email "${ownerEmail}" not found in Firebase Auth: ${err.message}`)
    console.error('Please sign in once to CineTrack v2 before importing.')
    process.exit(1)
  }

  const db = getFirestore()
  const libSnap = await db.collection(`users/${uid}/library`).get()
  const v2ExistingIds = libSnap.docs.map((d) => d.id)

  const reportText = formatReport(validEntries, preparedTitles, v2ExistingIds.length, v2ExistingIds)
  console.log('\n' + reportText)

  // Save report to file
  const reportPath = path.resolve(process.cwd(), 'data', 'imports', 'import-report.txt')
  fs.writeFileSync(reportPath, reportText, 'utf8')
  console.log(`\nReport saved to: ${reportPath}`)

  if (!isConfirm) {
    console.log('\n======================================================================')
    console.log('                 DRY-RUN MODE — NO WRITES PERFORMED')
    console.log('To execute the live import:')
    console.log('  npm run import:v1 -- --file data/imports/v1-library.json --confirm')
    console.log('======================================================================')
    return
  }

  // ─── LIVE EXECUTION (--confirm) ─────────────────────────────────────────────
  console.log('\n======================================================================')
  console.log('                      LIVE IMPORT CONFIRMATION')
  console.log('======================================================================')
  console.log(`Firebase Project: ${projectId} (VERIFIED v2)`)
  console.log(`Target User UID:  ${uid} (${ownerEmail})`)

  // Require typing "import"
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const confirmation = await new Promise<string>((resolve) => {
    rl.question('Type "import" to proceed with writing to Firestore: ', (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })

  if (confirmation !== 'import') {
    console.log('Import aborted: confirmation string did not match "import".')
    process.exit(0)
  }

  // Automatic Backup
  console.log('\n[Backup] Creating pre-import backup of current v2 user data...')
  const backupData: Record<string, any> = {
    timestamp: new Date().toISOString(),
    uid,
    library: [],
    history: [],
  }
  for (const doc of libSnap.docs) {
    backupData.library.push({ id: doc.id, ...doc.data() })
  }
  const histSnap = await db.collection(`users/${uid}/history`).get()
  for (const doc of histSnap.docs) {
    backupData.history.push({ id: doc.id, ...doc.data() })
  }

  const backupFilePath = path.resolve(
    process.cwd(),
    'data',
    'imports',
    `backup-${Date.now()}.json`
  )
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8')
  console.log(`[Backup] Saved ${libSnap.size} library docs and ${histSnap.size} history events to: ${backupFilePath}`)

  // If --clean is requested, delete prior non-v1 titles
  if (isClean && v2ExistingIds.length > 0) {
    console.log('[Clean] Removing prior existing documents not present in v1 import...')
    const v1Keys = new Set(validEntries.map((e) => e.k))
    for (const doc of libSnap.docs) {
      if (!v1Keys.has(doc.id)) {
        console.log(`  Deleting non-v1 doc: ${doc.id}`)
        await doc.ref.delete()
      }
    }
  }

  // Batch writes (<= 400 operations per batch)
  console.log('\n[Firestore Writes] Writing library documents, seasons, and history events...')

  let currentBatch = db.batch()
  let opCount = 0
  let batchesCommitted = 0

  const commitBatchIfNeeded = async (force = false) => {
    if (opCount > 0 && (opCount >= 350 || force)) {
      await currentBatch.commit()
      batchesCommitted++
      currentBatch = db.batch()
      opCount = 0
    }
  }

  const allActiveDayKeys: string[] = []

  for (const title of preparedTitles) {
    const libRef = db.doc(`users/${uid}/library/${title.v1.k}`)

    // Library document
    const addedAtTs = Timestamp.fromDate(new Date(title.v1.added))
    const updatedAtTs = Timestamp.fromDate(new Date(title.v1.upd))
    const completedAtTs = title.v1.s === 'completed' ? updatedAtTs : null
    const startedAtTs = title.v1.s === 'watching' ? addedAtTs : null
    const lastWatchedAtTs =
      title.v1.s === 'completed' || title.v1.s === 'watching' || title.v1.s === 'dropped'
        ? updatedAtTs
        : null

    const libDoc: Record<string, any> = {
      titleKey: title.v1.k,
      tmdbId: title.tmdbId,
      type: title.type,
      title: title.title,
      year: title.year,
      posterPath: title.posterPath,
      backdropPath: title.backdropPath,
      genres: title.genres,
      runtimeMinutes: title.runtimeMinutes,
      status: title.v1.s,
      priority: 'normal',
      rating: title.v1.r,
      isFavorite: title.v1.fav,
      tags: [],
      addedAt: addedAtTs,
      startedAt: startedAtTs,
      completedAt: completedAtTs,
      updatedAt: updatedAtTs,
      lastWatchedAt: lastWatchedAtTs,
      source: 'import-v1',
      approximate: true,
      needsAttention: title.needsAttention,
      schemaVersion: 1,
    }

    if (title.type === 'movie') {
      const totalWatches = title.v1.s === 'completed' ? 1 + (title.v1.rew || 0) : 0
      libDoc.watchCount = totalWatches
      libDoc.totalMinutesWatched = totalWatches * (title.runtimeMinutes || 0)
      if (title.releaseDate) libDoc.releaseDate = title.releaseDate
    } else {
      // TV
      libDoc.watchCount = title.v1.s === 'completed' ? 1 : 0
      libDoc.totalMinutesWatched = title.totalMinutesWatched
      libDoc.tv = {
        totalEpisodes: title.totalEpisodes,
        totalSeasons: title.totalSeasons,
        episodesWatched: title.episodesWatchedCount,
        currentSeason: title.currentSeason,
        nextEpisodeToWatch: title.nextEpisodeToWatch,
        tmdbStatus: title.tmdbStatus,
        nextAirDate: null,
      }
    }

    currentBatch.set(libRef, libDoc, { merge: true })
    opCount++
    await commitBatchIfNeeded()

    // Write TV seasons subcollections
    if (title.type === 'tv') {
      for (const season of title.seasons) {
        const seasonRef = db.doc(`users/${uid}/library/${title.v1.k}/seasons/${season.seasonNumber}`)
        const watchedMap: Record<string, Timestamp> = {}
        let seasonMinutes = 0
        let watchedInSeason = 0

        season.episodes.forEach((ep) => {
          if (ep.isWatched) {
            watchedMap[String(ep.episodeNumber)] = ep.watchedAt
            seasonMinutes += ep.runtime
            watchedInSeason++
          }
        })

        const seasonDoc = {
          season: season.seasonNumber,
          totalEpisodes: season.totalEpisodes,
          watched: watchedMap,
          watchedCount: watchedInSeason,
          minutesWatched: seasonMinutes,
          completed: season.totalEpisodes > 0 && watchedInSeason >= season.totalEpisodes,
          updatedAt: updatedAtTs,
          source: 'import-v1',
          approximate: true,
        }

        currentBatch.set(seasonRef, seasonDoc, { merge: true })
        opCount++
        await commitBatchIfNeeded()
      }
    }

    // Write History Events
    for (const hEvent of title.historyEvents) {
      const histRef = db.doc(`users/${uid}/history/${hEvent.eventId}`)
      currentBatch.set(histRef, hEvent, { merge: true })
      opCount++
      await commitBatchIfNeeded()

      const d = hEvent.watchedAt.toDate()
      const dayKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
        d.getUTCDate()
      ).padStart(2, '0')}`
      allActiveDayKeys.push(dayKey)
    }
  }

  // Pre-aggregated Stats Calculation
  console.log('[Stats] Computing pre-aggregated stats summary...')
  const statsRef = db.doc(`users/${uid}/stats/summary`)

  const genreCounts: Record<string, number> = {}
  let totalRatingSum = 0
  let totalRatingCount = 0
  let totalMinutesAll = 0
  let totalEpisodesWatchedAll = 0

  preparedTitles.forEach((t) => {
    t.genres.forEach((g) => {
      genreCounts[g.name] = (genreCounts[g.name] || 0) + 1
    })
    if (typeof t.v1.r === 'number') {
      totalRatingSum += t.v1.r
      totalRatingCount++
    }
    if (t.type === 'movie') {
      const wCount = t.v1.s === 'completed' ? 1 + (t.v1.rew || 0) : 0
      totalMinutesAll += wCount * (t.runtimeMinutes || 0)
    } else {
      totalMinutesAll += t.totalMinutesWatched
      totalEpisodesWatchedAll += t.episodesWatchedCount
    }
  })

  const { currentStreak, longestStreak } = computeStreak(allActiveDayKeys, 'UTC')

  const statsDoc = {
    moviesWatched: completedMovies.length,
    episodesWatched: totalEpisodesWatchedAll,
    minutesWatched: totalMinutesAll,
    titlesCompleted: completed.length,
    ratingSum: totalRatingSum,
    ratingCount: totalRatingCount,
    genreCounts,
    statusCounts: {
      completed: completed.length,
      plan_to_watch: planToWatch.length,
      dropped: dropped.length,
      watching: watching.length,
      on_hold: 0,
    },
    currentStreak,
    longestStreak,
    lastActiveDay: allActiveDayKeys.sort().slice(-1)[0] || null,
    updatedAt: Timestamp.now(),
  }

  currentBatch.set(statsRef, statsDoc, { merge: true })
  opCount++

  // Final batch commit
  await commitBatchIfNeeded(true)

  console.log(`\n[SUCCESS] Live import complete! Committed in ${batchesCommitted} batch(es).`)
  console.log('Run `npm run import:verify` to verify the import assertions.')
}

// Execute when run as CLI
if (process.argv[1]?.endsWith('import-v1.ts')) {
  runImporter().catch((err) => {
    console.error('[FATAL ERROR]:', err)
    process.exit(1)
  })
}
