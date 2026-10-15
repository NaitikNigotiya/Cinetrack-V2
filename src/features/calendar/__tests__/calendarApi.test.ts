import { describe, it, expect, vi } from 'vitest'
import {
  savePlannedWatch,
  togglePlannedWatchDone,
  deletePlannedWatch,
} from '../api/calendarApi'

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    setDoc: vi.fn().mockResolvedValue(undefined),
    updateDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
  }
})

describe('calendarApi', () => {
  it('saves a planned watch schedule', async () => {
    const id = await savePlannedWatch('test-uid', {
      titleKey: 'movie:550',
      title: 'Fight Club',
      posterPath: '/path.jpg',
      type: 'movie',
      plannedFor: '2026-10-31',
      plannedTime: '21:00',
      note: 'Halloween movie night',
      reminder: true,
    })
    expect(id).toBeDefined()
  })

  it('toggles done state of planned watch', async () => {
    await expect(
      togglePlannedWatchDone('test-uid', 'watch-123', true)
    ).resolves.not.toThrow()
  })

  it('deletes planned watch document', async () => {
    await expect(deletePlannedWatch('test-uid', 'watch-123')).resolves.not.toThrow()
  })
})
