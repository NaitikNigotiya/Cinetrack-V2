export type TmdbErrorCode =
  | 'UNAUTHENTICATED'
  | 'PATH_NOT_ALLOWED'
  | 'BAD_PARAMS'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

export const TMDB_USER_MESSAGES: Record<TmdbErrorCode, string> = {
  UNAUTHENTICATED: 'Please sign in to access TMDB data.',
  PATH_NOT_ALLOWED: 'The requested TMDB endpoint is not allowed.',
  BAD_PARAMS: 'Invalid search or filter parameters.',
  NOT_FOUND: 'The requested movie or TV show could not be found.',
  RATE_LIMITED: 'TMDB is busy right now. Please wait a moment and try again.',
  UPSTREAM_ERROR: 'TMDB service encountered an unexpected error. Please try again later.',
  TIMEOUT: 'TMDB request timed out. Please check your connection and retry.',
  NETWORK_ERROR: 'Unable to reach the server. Please check your network connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred while fetching TMDB data.',
}

export class TmdbError extends Error {
  readonly code: TmdbErrorCode
  readonly status: number
  readonly retryable: boolean
  readonly friendlyMessage: string

  constructor(
    code: TmdbErrorCode,
    status: number,
    customMessage?: string,
    retryable?: boolean
  ) {
    const message = customMessage || TMDB_USER_MESSAGES[code] || TMDB_USER_MESSAGES.UNKNOWN_ERROR
    super(message)
    this.name = 'TmdbError'
    this.code = code
    this.status = status
    this.friendlyMessage = message
    this.retryable =
      retryable ?? (code === 'RATE_LIMITED' || code === 'TIMEOUT' || code === 'NETWORK_ERROR' || status >= 500)
  }
}

export function parseTmdbError(error: unknown): TmdbError {
  if (error instanceof TmdbError) {
    return error
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new TmdbError('TIMEOUT', 0, 'Request was cancelled or timed out', false)
    }
    return new TmdbError('NETWORK_ERROR', 0, error.message, true)
  }

  return new TmdbError('UNKNOWN_ERROR', 0, 'An unknown error occurred', false)
}
