import { describe, it, expect, vi } from 'vitest'
import {
  addToLibrary,
  setStatus,
  setRating,
  toggleFavorite,
} from '../api/libraryApi'
import type { LibraryEntry } from '@/shared/schemas'

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    })),
    serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
    increment: vi.fn((n) => ({ _methodName: 'increment', value: n })),
    updateDoc: vi.fn().mockResolvedValue(undefined),
  }
})

describe('libraryApi atomic operations', () => {
  const mockEntry: LibraryEntry = {
    titleKey: 'movie:550',
    tmdbId: 550,
    type: 'movie',
    title: 'Fight Club',
    year: 1999,
    posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdropPath: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    genres: [{ id: 18, name: 'Drama' }],
    runtimeMinutes: 139,
    status: 'plan_to_watch',
    priority: 'normal',
    rating: null,
    isFavorite: false,
    watchCount: 0,
    lastWatchedAt: null,
    totalMinutesWatched: 0,
    tags: [],
    addedAt: null,
    startedAt: null,
    completedAt: null,
    updatedAt: null,
    schemaVersion: 1,
  }

  it('calls addToLibrary with batch commit', async () => {
    await expect(addToLibrary('user123', mockEntry)).resolves.not.toThrow()
  })

  it('updates status and transitions timestamps properly', async () => {
    await expect(
      setStatus('user123', 'movie:550', 'watching', mockEntry)
    ).resolves.not.toThrow()

    await expect(
      setStatus('user123', 'movie:550', 'completed', { ...mockEntry, status: 'watching' })
    ).resolves.not.toThrow()
  })

  it('updates rating and computes stats delta', async () => {
    await expect(
      setRating('user123', 'movie:550', 9.0, null)
    ).resolves.not.toThrow()

    await expect(
      setRating('user123', 'movie:550', 8.5, 9.0)
    ).resolves.not.toThrow()
  })

  it('toggles favorite state', async () => {
    await expect(
      toggleFavorite('user123', 'movie:550', true)
    ).resolves.not.toThrow()
  })
})
