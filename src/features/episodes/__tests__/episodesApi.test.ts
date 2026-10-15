import { describe, it, expect } from 'vitest'
import { makeEpisodeEventId, makeEpisodeLabel } from '@/shared/lib/ids'

describe('episodes tracking logic', () => {
  it('generates deterministic event IDs avoiding duplicate logs', () => {
    const id1 = makeEpisodeEventId('tv:1396', 1, 3)
    const id2 = makeEpisodeEventId('tv:1396', 1, 3)
    expect(id1).toBe('tv:1396_s01e03')
    expect(id1).toBe(id2)
  })

  it('formats episode labels with standard padding', () => {
    expect(makeEpisodeLabel(1, 1)).toBe('S01E01')
    expect(makeEpisodeLabel(5, 16)).toBe('S05E16')
  })
})
