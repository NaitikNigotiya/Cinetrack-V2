import { describe, it, expect, vi, beforeEach } from 'vitest'
import { request } from '../client'
import { TmdbError } from '../errors'
import {
  normaliseMediaItem,
  normaliseMovieDetails,
  normaliseTvDetails,
  normaliseTvSeason,
} from '../normalize'
import {
  getPosterUrl,
  getPosterSrcSet,
  getBackdropUrl,
  getBackdropSrcSet,
  getProfileUrl,
  getStillUrl,
} from '../images'
import {
  getGenreName,
  getGenreId,
  getGenreNames,
  formatGenreNames,
} from '../genres'
import { TMDB_CACHE_RULES } from '../hooks/cacheRules'

vi.mock('@/services/firebase/auth', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn(async () => 'fresh-mock-firebase-token'),
    },
  },
}))

vi.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      profile: {
        language: 'en-US',
        region: 'IN',
      },
    })),
  },
}))

describe('TMDB Client Layer - client.ts', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('injects fresh Firebase ID token, user locale, and returns parsed JSON', async () => {
    const mockData = { id: 550, title: 'Fight Club' }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await request<typeof mockData>('movie/550', {
      params: { append_to_response: 'credits' },
    })

    expect(result).toEqual(mockData)
    expect(fetchMock).toHaveBeenCalled()

    const [calledUrl, calledInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toContain('/api/tmdb/movie/550')
    expect(calledUrl).toContain('language=en-US')
    expect(calledUrl).toContain('region=IN')
    expect(calledUrl).toContain('append_to_response=credits')
    expect(calledInit.headers).toMatchObject({
      Accept: 'application/json',
      Authorization: 'Bearer fresh-mock-firebase-token',
    })
  })

  it('maps HTTP 404 to TmdbError with NOT_FOUND code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Title not found' } }), {
        status: 404,
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(request('movie/999999')).rejects.toThrow(TmdbError)
    await expect(request('movie/999999')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
      retryable: false,
    })
  })

  it('maps HTTP 429 to retryable TmdbError with RATE_LIMITED code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'RATE_LIMITED' } }), {
        status: 429,
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(request('trending/all/day')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      status: 429,
      retryable: true,
    })
  })

  it('passes through AbortSignal and throws AbortError cleanly', async () => {
    const controller = new AbortController()
    controller.abort()

    const fetchMock = vi.fn().mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      request('search/multi', { params: { query: 'test' }, signal: controller.signal })
    ).rejects.toThrow('The operation was aborted')
  })
})

describe('TMDB Image and Genre Utilities', () => {
  it('constructs correct poster and backdrop URLs and responsive srcSets', () => {
    expect(getPosterUrl('/poster.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/poster.jpg')
    expect(getPosterUrl(null)).toBeNull()

    const posterSrcSet = getPosterSrcSet('/poster.jpg')
    expect(posterSrcSet).toContain('w185/poster.jpg 185w')
    expect(posterSrcSet).toContain('w780/poster.jpg 780w')

    expect(getBackdropUrl('/backdrop.jpg', 'w1280')).toBe('https://image.tmdb.org/t/p/w1280/backdrop.jpg')
    const backdropSrcSet = getBackdropSrcSet('/backdrop.jpg')
    expect(backdropSrcSet).toContain('w780/backdrop.jpg 780w')
    expect(backdropSrcSet).toContain('w1280/backdrop.jpg 1280w')

    expect(getProfileUrl('/actor.jpg')).toBe('https://image.tmdb.org/t/p/w185/actor.jpg')
    expect(getStillUrl('/episode.jpg')).toBe('https://image.tmdb.org/t/p/w300/episode.jpg')
  })

  it('resolves genre IDs and names bi-directionally', () => {
    expect(getGenreName(28)).toBe('Action')
    expect(getGenreName(18)).toBe('Drama')
    expect(getGenreId('Action')).toBe(28)
    expect(getGenreId('action')).toBe(28)
    expect(getGenreNames([28, 18])).toEqual(['Action', 'Drama'])
    expect(formatGenreNames([28, 18])).toBe('Action, Drama')
  })
})

describe('TMDB Normalization Logic', () => {
  it('normalises raw media items consistently with titleKey, year, and image URLs', () => {
    const raw = {
      id: 550,
      title: 'Fight Club',
      release_date: '1999-10-15',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      overview: 'Test overview',
      vote_average: 8.4,
      vote_count: 25000,
      genre_ids: [18],
    }

    const normalised = normaliseMediaItem(raw, 'movie')
    expect(normalised.id).toBe(550)
    expect(normalised.titleKey).toBe('movie:550')
    expect(normalised.type).toBe('movie')
    expect(normalised.title).toBe('Fight Club')
    expect(normalised.year).toBe(1999)
    expect(normalised.posterUrl).toBe('https://image.tmdb.org/t/p/w342/poster.jpg')
    expect(normalised.backdropUrl).toBe('https://image.tmdb.org/t/p/w1280/backdrop.jpg')
  })

  it('normalises movie details with cast, videos, and recommendations', () => {
    const rawMovie = {
      id: 550,
      title: 'Fight Club',
      overview: 'Soap salesman',
      release_date: '1999-10-15',
      runtime: 139,
      vote_average: 8.4,
      vote_count: 25000,
      genres: [{ id: 18, name: 'Drama' }],
      credits: {
        cast: [{ id: 1, name: 'Brad Pitt', character: 'Tyler Durden', profile_path: '/brad.jpg' }],
      },
      videos: {
        results: [{ id: 'v1', key: 'trailer123', name: 'Trailer', site: 'YouTube', type: 'Trailer' }],
      },
    }

    const normalised = normaliseMovieDetails(rawMovie)
    expect(normalised.titleKey).toBe('movie:550')
    expect(normalised.runtimeMinutes).toBe(139)
    expect(normalised.cast[0]?.name).toBe('Brad Pitt')
    expect(normalised.cast[0]?.profileUrl).toBe('https://image.tmdb.org/t/p/w185/brad.jpg')
    expect(normalised.videos[0]?.key).toBe('trailer123')
  })

  it('normalises TV details and sorts Season 0 Specials to the end', () => {
    const rawTv = {
      id: 1396,
      name: 'Breaking Bad',
      first_air_date: '2008-01-20',
      episode_run_time: [47],
      number_of_episodes: 62,
      number_of_seasons: 5,
      genres: [{ id: 18, name: 'Drama' }],
      overview: 'Walter White chemistry teacher turns kingpin',
      vote_average: 9.5,
      vote_count: 14000,
      seasons: [
        { id: 1, name: '', season_number: 0, episode_count: 5 },
        { id: 2, name: 'Season 1', season_number: 1, episode_count: 7 },
      ],
    }

    const normalised = normaliseTvDetails(rawTv)
    expect(normalised.titleKey).toBe('tv:1396')
    expect(normalised.type).toBe('tv')
    expect(normalised.title).toBe('Breaking Bad')
    expect(normalised.year).toBe(2008)
    expect(normalised.runtimeMinutes).toBe(47)
    // Season 1 should be before Season 0 Specials
    expect(normalised.seasons?.[0]?.seasonNumber).toBe(1)
    expect(normalised.seasons?.[1]?.seasonNumber).toBe(0)
    expect(normalised.seasons?.[1]?.name).toBe('Specials')
  })

  it('normalises TV season with episode still images', () => {
    const rawSeason = {
      id: 3572,
      season_number: 1,
      name: 'Season 1',
      overview: 'First season',
      episodes: [
        {
          id: 62085,
          episode_number: 1,
          season_number: 1,
          name: 'Pilot',
          overview: 'The pilot episode',
          air_date: '2008-01-20',
          runtime: 58,
          still_path: '/still.jpg',
          vote_average: 8.4,
        },
      ],
    }

    const normalised = normaliseTvSeason(rawSeason)
    expect(normalised.episodes).toHaveLength(1)
    expect(normalised.episodes[0]?.runtimeMinutes).toBe(58)
    expect(normalised.episodes[0]?.stillUrl).toBe('https://image.tmdb.org/t/p/w300/still.jpg')
  })

  it('verifies cache rules specifications for TanStack Query', () => {
    expect(TMDB_CACHE_RULES.configuration.staleTime).toBe(7 * 24 * 60 * 60 * 1000)
    expect(TMDB_CACHE_RULES.titleDetails.staleTime).toBe(24 * 60 * 60 * 1000)
    expect(TMDB_CACHE_RULES.lists.staleTime).toBe(15 * 60 * 1000)
    expect(TMDB_CACHE_RULES.search.staleTime).toBe(5 * 60 * 1000)

    // Retry rule for titleDetails: should not retry on 404
    const titleRetry = TMDB_CACHE_RULES.titleDetails.retry
    const notFoundError = new TmdbError('NOT_FOUND', 404)
    expect(titleRetry(0, notFoundError)).toBe(false)

    const serverError = new TmdbError('UPSTREAM_ERROR', 500)
    expect(titleRetry(0, serverError)).toBe(true)
    expect(titleRetry(2, serverError)).toBe(false)
  })
})
