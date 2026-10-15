import { describe, it, expect } from 'vitest'
import { makeTitleKey, parseTitleKey, makeEpisodeKey, makeEpisodeLabel, makeEpisodeEventId } from '../ids'

describe('ids module', () => {
  it('makes valid title keys', () => {
    expect(makeTitleKey('movie', 550)).toBe('movie:550')
    expect(makeTitleKey('tv', '1396')).toBe('tv:1396')
  })

  it('throws on invalid TMDB id', () => {
    expect(() => makeTitleKey('movie', -1)).toThrow()
    expect(() => makeTitleKey('tv', 'invalid')).toThrow()
  })

  it('parses valid title keys', () => {
    expect(parseTitleKey('movie:550')).toEqual({ type: 'movie', tmdbId: 550 })
    expect(parseTitleKey('tv:1396')).toEqual({ type: 'tv', tmdbId: 1396 })
  })

  it('returns null on invalid title keys', () => {
    expect(parseTitleKey('')).toBeNull()
    expect(parseTitleKey('anime:123')).toBeNull()
    expect(parseTitleKey('movie:-5')).toBeNull()
    expect(parseTitleKey('movie:abc')).toBeNull()
  })

  it('formats episode keys and labels correctly', () => {
    expect(makeEpisodeKey(1, 3)).toBe('s01e03')
    expect(makeEpisodeKey(12, 24)).toBe('s12e24')
    expect(makeEpisodeLabel(1, 3)).toBe('S01E03')
    expect(makeEpisodeEventId('tv:1396', 1, 3)).toBe('tv:1396_s01e03')
  })
})
