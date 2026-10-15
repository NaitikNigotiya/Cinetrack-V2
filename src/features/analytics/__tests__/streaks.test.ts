import { describe, it, expect } from 'vitest'
import { calculateStreaks } from '../lib/streaks'

describe('calculateStreaks', () => {
  it('returns zeros for empty active days', () => {
    const res = calculateStreaks([], '2026-10-15')
    expect(res).toEqual({ currentStreak: 0, longestStreak: 0 })
  })

  it('calculates continuous streak ending today', () => {
    const active = ['2026-10-13', '2026-10-14', '2026-10-15']
    const res = calculateStreaks(active, '2026-10-15')
    expect(res).toEqual({ currentStreak: 3, longestStreak: 3 })
  })

  it('keeps streak alive if last active was yesterday', () => {
    const active = ['2026-10-13', '2026-10-14']
    const res = calculateStreaks(active, '2026-10-15')
    expect(res).toEqual({ currentStreak: 2, longestStreak: 2 })
  })

  it('resets current streak to 0 if last active was 2+ days ago, preserving longest', () => {
    const active = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-10']
    const res = calculateStreaks(active, '2026-10-15')
    expect(res).toEqual({ currentStreak: 0, longestStreak: 4 })
  })

  it('handles duplicate dates and unsorted input', () => {
    const active = ['2026-10-15', '2026-10-14', '2026-10-15', '2026-10-13']
    const res = calculateStreaks(active, '2026-10-15')
    expect(res).toEqual({ currentStreak: 3, longestStreak: 3 })
  })
})
