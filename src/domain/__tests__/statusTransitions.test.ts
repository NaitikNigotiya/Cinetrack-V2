import { describe, it, expect } from 'vitest'
import { transitionStatus, type TransitionParams } from '../status'
import type { CanonicalStatus } from '../types'

describe('Table-driven Status Transitions (Section 4.1)', () => {
  const cases: Array<{
    name: string
    params: TransitionParams
    expected: CanonicalStatus
  }> = [
    {
      name: 'Add to library defaults to plan_to_watch',
      params: { action: 'add_to_library', mediaType: 'movie' },
      expected: 'plan_to_watch',
    },
    {
      name: 'Add to library with custom default status',
      params: { action: 'add_to_library', mediaType: 'movie', defaultStatus: 'watching' },
      expected: 'watching',
    },
    {
      name: 'Start watching movie sets watching',
      params: { action: 'start_watching', mediaType: 'movie', currentStatus: 'plan_to_watch' },
      expected: 'watching',
    },
    {
      name: 'Mark movie as watched sets completed',
      params: { action: 'mark_movie_watched', mediaType: 'movie', currentStatus: 'watching' },
      expected: 'completed',
    },
    {
      name: 'Mark movie as watched from plan_to_watch sets completed',
      params: { action: 'mark_movie_watched', mediaType: 'movie', currentStatus: 'plan_to_watch' },
      expected: 'completed',
    },
    {
      name: 'Watch again stays completed',
      params: { action: 'watch_again', mediaType: 'movie', currentStatus: 'completed' },
      expected: 'completed',
    },
    {
      name: 'Put on hold sets on_hold',
      params: { action: 'put_on_hold', mediaType: 'movie', currentStatus: 'watching' },
      expected: 'on_hold',
    },
    {
      name: 'Drop sets dropped',
      params: { action: 'drop', mediaType: 'tv', currentStatus: 'watching' },
      expected: 'dropped',
    },
    {
      name: 'Resume sets watching',
      params: { action: 'resume', mediaType: 'movie', currentStatus: 'on_hold' },
      expected: 'watching',
    },
    {
      name: 'TV: all episodes watched on Ended show moves to completed',
      params: {
        action: 'update_tv_progress',
        mediaType: 'tv',
        episodesWatched: 10,
        totalAiredEpisodes: 10,
        tmdbStatus: 'Ended',
      },
      expected: 'completed',
    },
    {
      name: 'TV: all episodes watched on Canceled show moves to completed',
      params: {
        action: 'update_tv_progress',
        mediaType: 'tv',
        episodesWatched: 8,
        totalAiredEpisodes: 8,
        tmdbStatus: 'Canceled',
      },
      expected: 'completed',
    },
    {
      name: 'TV: all episodes watched on Returning Series stays watching (caught up)',
      params: {
        action: 'update_tv_progress',
        mediaType: 'tv',
        episodesWatched: 10,
        totalAiredEpisodes: 10,
        tmdbStatus: 'Returning Series',
      },
      expected: 'watching',
    },
    {
      name: 'TV: partial episodes watched stays watching',
      params: {
        action: 'update_tv_progress',
        mediaType: 'tv',
        episodesWatched: 4,
        totalAiredEpisodes: 10,
        tmdbStatus: 'Ended',
      },
      expected: 'watching',
    },
    {
      name: 'TV: 0 episodes watched resets to plan_to_watch',
      params: {
        action: 'update_tv_progress',
        mediaType: 'tv',
        episodesWatched: 0,
        totalAiredEpisodes: 10,
        tmdbStatus: 'Ended',
      },
      expected: 'plan_to_watch',
    },
    {
      name: 'Movie unmark watched with 0 remaining events goes back to plan_to_watch',
      params: {
        action: 'unmark_watched',
        mediaType: 'movie',
        currentStatus: 'completed',
        remainingHistoryCount: 0,
      },
      expected: 'plan_to_watch',
    },
    {
      name: 'Movie unmark watched with >0 remaining events stays completed',
      params: {
        action: 'unmark_watched',
        mediaType: 'movie',
        currentStatus: 'completed',
        remainingHistoryCount: 1,
      },
      expected: 'completed',
    },
    {
      name: 'TV unmark watched with >0 remaining episodes stays watching',
      params: {
        action: 'unmark_watched',
        mediaType: 'tv',
        currentStatus: 'completed',
        episodesWatched: 3,
      },
      expected: 'watching',
    },
    {
      name: 'TV unmark watched with 0 remaining episodes goes back to plan_to_watch',
      params: {
        action: 'unmark_watched',
        mediaType: 'tv',
        currentStatus: 'watching',
        episodesWatched: 0,
      },
      expected: 'plan_to_watch',
    },
  ]

  for (const tc of cases) {
    it(tc.name, () => {
      expect(transitionStatus(tc.params)).toBe(tc.expected)
    })
  }
})
