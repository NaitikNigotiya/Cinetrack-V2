import { describe, it, expect } from 'vitest'
import { tmdbClient } from '../tmdbClient'
import { tmdbKeys } from '../queryKeys'

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
})
