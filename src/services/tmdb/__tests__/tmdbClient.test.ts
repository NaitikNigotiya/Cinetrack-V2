import { describe, it, expect, vi } from 'vitest'
import { tmdbClient } from '../tmdbClient'
import { tmdbKeys } from '../queryKeys'
import {
  TmdbSearchResponseSchema,
  TmdbMovieDetailsSchema,
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
  })

  it('returns empty search response for empty query', async () => {
    const res = await tmdbClient.searchMulti('')
    expect(res.results).toEqual([])
    expect(res.total_results).toBe(0)
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

  it('fetches tv details with parsed schemas', async () => {
    const tv = await tmdbClient.getTvDetails(1396)
    expect(tv.id).toBe(1396)
    expect(tv.name).toBe('Breaking Bad')
    expect(tv.number_of_episodes).toBe(62)
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
    // unknown field is not in schema
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
