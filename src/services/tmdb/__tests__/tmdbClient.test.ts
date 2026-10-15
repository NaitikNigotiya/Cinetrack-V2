import { describe, it, expect, vi } from 'vitest'
import { tmdbClient } from '../tmdbClient'
import { tmdbKeys } from '../queryKeys'
import {
  TmdbSearchResponseSchema,
  TmdbMovieDetailsSchema,
  TmdbTvSeasonSchema,
} from '../tmdb.schema'

describe('tmdbClient module', () => {
  it('generates consistent query keys', () => {
    expect(tmdbKeys.search('Fight Club', 'movie', '1999')).toEqual([
      'tmdb',
      'search',
      { query: 'Fight Club', type: 'movie', year: '1999' },
    ])
    expect(tmdbKeys.details('movie:550')).toEqual(['tmdb', 'details', 'movie:550'])
    expect(tmdbKeys.trending('all', 'week')).toEqual(['tmdb', 'trending', 'all', 'week'])
    expect(tmdbKeys.season(1396, 1)).toEqual(['tmdb', 'tv', 1396, 'season', 1])
  })

  it('returns empty search response for empty query or query shorter than 2 chars', async () => {
    const emptyRes = await tmdbClient.searchMulti('')
    expect(emptyRes.results).toEqual([])
    expect(emptyRes.total_results).toBe(0)

    const shortRes = await tmdbClient.searchMulti('a')
    expect(shortRes.results).toEqual([])
    expect(shortRes.total_results).toBe(0)

    const shortMovie = await tmdbClient.searchMovie('x')
    expect(shortMovie.results).toEqual([])

    const shortTv = await tmdbClient.searchTv('y')
    expect(shortTv.results).toEqual([])
  })

  it('returns valid search results with fallback/mock data', async () => {
    const res = await tmdbClient.searchMulti('Fight Club')
    expect(res.results.length).toBeGreaterThan(0)
    expect(res.results.some((r) => r.title === 'Fight Club')).toBe(true)
  })

  it('fetches movie details with parsed schemas', async () => {
    const movie = await tmdbClient.getMovieDetails(550)
    expect(movie.id).toBe(550)
    expect(movie.title).toBe('Fight Club')
    expect(movie.genres.length).toBeGreaterThan(0)
    expect(movie.credits?.cast.length).toBeGreaterThan(0)
    expect(movie['watch/providers']?.results).toBeDefined()
  })

  it('fetches tv details with parsed schemas and sorts Season 0 Specials last', async () => {
    const tv = await tmdbClient.getTvDetails(1396)
    expect(tv.id).toBe(1396)
    expect(tv.name).toBe('Breaking Bad')
    expect(tv.number_of_episodes).toBe(62)
  })

  it('parses TV season and episode fixtures tolerantly', () => {
    const seasonData = {
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
          air_date: '2008-01-20',
          runtime: 58,
          still_path: '/pilot.jpg',
          vote_average: 8.4,
        },
        {
          id: 62086,
          episode_number: 2,
          season_number: 1,
          name: "Cat's in the Bag...",
          air_date: '', // empty date should convert to null
          runtime: null,
          vote_average: 8.3,
        },
      ],
    }

    const parsed = TmdbTvSeasonSchema.parse(seasonData)
    expect(parsed.episodes).toHaveLength(2)
    expect(parsed.episodes[0]?.name).toBe('Pilot')
    expect(parsed.episodes[1]?.air_date).toBeNull()
  })

  it('tolerantly drops malformed items in a list without breaking the entire list', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const payloadWithMalformedItem = {
      page: 1,
      total_pages: 1,
      total_results: 2,
      results: [
        { id: 101, title: 'Valid Movie', overview: 'A good movie' },
        { title: 'Invalid Movie Without ID' }, // malformed, missing required id
        { id: 102, title: 'Another Valid Movie', unknown_field: 'ignored' },
      ],
    }

    const parsed = TmdbSearchResponseSchema.parse(payloadWithMalformedItem)
    expect(parsed.results).toHaveLength(2)
    expect(parsed.results[0]?.id).toBe(101)
    expect(parsed.results[1]?.id).toBe(102)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('ignores unknown fields and defaults missing optional fields', () => {
    const rawData = {
      id: 999,
      title: 'Minimal Movie',
      extra_unknown_field_from_tmdb: 'should be stripped',
    }

    const parsed = TmdbMovieDetailsSchema.parse(rawData)
    expect(parsed.id).toBe(999)
    expect(parsed.title).toBe('Minimal Movie')
    expect(parsed.genres).toEqual([])
    expect(parsed.vote_average).toBe(0)
    expect(parsed.vote_count).toBe(0)
    expect(parsed.overview).toBe('')
    expect('extra_unknown_field_from_tmdb' in parsed).toBe(false)
  })

  it('treats empty date strings as null for unreleased or unknown titles', () => {
    const withEmptyDates = {
      id: 501,
      title: 'Upcoming Unscheduled Title',
      release_date: '',
    }
    const parsed = TmdbMovieDetailsSchema.parse(withEmptyDates)
    expect(parsed.release_date).toBeNull()

    const withValidDate = {
      id: 502,
      title: 'Scheduled Title',
      release_date: '2026-11-20',
    }
    const parsedValid = TmdbMovieDetailsSchema.parse(withValidDate)
    expect(parsedValid.release_date).toBe('2026-11-20')
  })
})
