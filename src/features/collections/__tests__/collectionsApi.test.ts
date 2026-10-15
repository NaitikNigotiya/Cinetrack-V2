import { describe, it, expect, vi } from 'vitest'
import {
  saveCollection,
  deleteCollection,
  updateCollectionItems,
} from '../api/collectionsApi'

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    setDoc: vi.fn().mockResolvedValue(undefined),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    getDoc: vi.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({
        items: [],
        createdAt: { _methodName: 'serverTimestamp' },
      }),
    }),
    serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
  }
})

describe('collectionsApi', () => {
  it('saves a collection successfully', async () => {
    const id = await saveCollection('test-uid', {
      name: 'Nolan Favorites',
      description: 'Christopher Nolan films',
      emoji: '🎬',
    })
    expect(id).toBeDefined()
  })

  it('updates collection items order', async () => {
    await expect(
      updateCollectionItems('test-uid', 'col-123', [
        {
          titleKey: 'movie:550',
          title: 'Fight Club',
          posterPath: '/path.jpg',
          type: 'movie',
          addedAt: new Date(),
        },
      ])
    ).resolves.not.toThrow()
  })

  it('deletes a collection document', async () => {
    await expect(deleteCollection('test-uid', 'col-123')).resolves.not.toThrow()
  })
})
