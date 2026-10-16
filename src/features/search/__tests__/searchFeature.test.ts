import { describe, it, expect } from 'vitest'
import { parseSpecialSearchInput } from '../lib/searchResolver'

describe('Search Query Parser & Special Input Resolver', () => {
  it('parses valid TMDB movie URL to titleKey', () => {
    const input = 'https://www.themoviedb.org/movie/550-fight-club'
    const result = parseSpecialSearchInput(input)
    expect(result).not.toBeNull()
    if (result && result.kind === 'titleKey') {
      expect(result.titleKey).toBe('movie:550')
      expect(result.mediaType).toBe('movie')
      expect(result.id).toBe(550)
    }
  })

  it('parses valid TMDB TV URL to titleKey', () => {
    const input = 'https://www.themoviedb.org/tv/1396-breaking-bad'
    const result = parseSpecialSearchInput(input)
    expect(result).not.toBeNull()
    if (result && result.kind === 'titleKey') {
      expect(result.titleKey).toBe('tv:1396')
      expect(result.mediaType).toBe('tv')
      expect(result.id).toBe(1396)
    }
  })

  it('parses valid IMDb URL to imdbId', () => {
    const input = 'https://www.imdb.com/title/tt0137523/'
    const result = parseSpecialSearchInput(input)
    expect(result).not.toBeNull()
    if (result && result.kind === 'imdb') {
      expect(result.imdbId).toBe('tt0137523')
    }
  })

  it('parses raw IMDb ID (tt1234567) to imdbId', () => {
    const input = 'tt0903747'
    const result = parseSpecialSearchInput(input)
    expect(result).not.toBeNull()
    if (result && result.kind === 'imdb') {
      expect(result.imdbId).toBe('tt0903747')
    }
  })

  it('returns null for standard search keywords', () => {
    expect(parseSpecialSearchInput('Inception')).toBeNull()
    expect(parseSpecialSearchInput('Breaking Bad 2008')).toBeNull()
    expect(parseSpecialSearchInput('')).toBeNull()
  })
})
