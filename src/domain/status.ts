import type { CanonicalStatus } from './types'

export const CANONICAL_STATUSES: readonly CanonicalStatus[] = [
  'plan_to_watch',
  'watching',
  'completed',
  'on_hold',
  'dropped',
] as const

export function isValidCanonicalStatus(val: string): val is CanonicalStatus {
  return CANONICAL_STATUSES.includes(val as CanonicalStatus)
}

export type StatusTransitionAction =
  | 'add_to_library'
  | 'start_watching'
  | 'mark_movie_watched'
  | 'update_tv_progress'
  | 'watch_again'
  | 'unmark_watched'
  | 'put_on_hold'
  | 'drop'
  | 'resume'

export interface TransitionParams {
  currentStatus?: CanonicalStatus | undefined
  action: StatusTransitionAction
  mediaType: 'movie' | 'tv'
  defaultStatus?: CanonicalStatus | undefined
  // TV specific params
  episodesWatched?: number | undefined
  totalAiredEpisodes?: number | null | undefined
  tmdbStatus?: string | null | undefined
  // Movie unmark params
  remainingHistoryCount?: number | undefined
}

/**
 * Pure state machine implementing Section 4.1 Status Rules.
 */
export function transitionStatus(params: TransitionParams): CanonicalStatus {
  const { action, mediaType } = params

  switch (action) {
    case 'add_to_library':
      return params.defaultStatus && isValidCanonicalStatus(params.defaultStatus)
        ? params.defaultStatus
        : 'plan_to_watch'

    case 'start_watching':
      return 'watching'

    case 'mark_movie_watched':
      return 'completed'

    case 'watch_again':
      return 'completed'

    case 'put_on_hold':
      return 'on_hold'

    case 'drop':
      return 'dropped'

    case 'resume':
      return 'watching'

    case 'update_tv_progress': {
      const watched = params.episodesWatched ?? 0
      const total = params.totalAiredEpisodes
      const tmdbStatus = (params.tmdbStatus || '').toLowerCase()
      const isEndedOrCanceled =
        tmdbStatus.includes('ended') || tmdbStatus.includes('canceled') || tmdbStatus.includes('cancelled')

      if (watched <= 0) {
        return 'plan_to_watch'
      }

      if (total !== null && total !== undefined && total > 0 && watched >= total) {
        // If show is ended/canceled, it's completed; if still in production/airing, it stays watching (caught up)
        return isEndedOrCanceled ? 'completed' : 'watching'
      }

      return 'watching'
    }

    case 'unmark_watched': {
      if (mediaType === 'movie') {
        const remaining = params.remainingHistoryCount ?? 0
        return remaining > 0 ? 'completed' : 'plan_to_watch'
      }
      // TV
      const watched = params.episodesWatched ?? 0
      return watched > 0 ? 'watching' : 'plan_to_watch'
    }

    default:
      return params.currentStatus || 'plan_to_watch'
  }
}
