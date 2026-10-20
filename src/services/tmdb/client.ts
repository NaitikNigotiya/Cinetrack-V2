import { auth } from '@/services/firebase/auth'
import { useAuthStore } from '@/features/auth/store/authStore'
import { TmdbError, type TmdbErrorCode } from './errors'

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined | null> | undefined
  signal?: AbortSignal | undefined
  language?: string | undefined
  region?: string | undefined
}

const PROXY_BASE = '/api/tmdb'

/**
 * Reads default language and region from user profile store safely.
 */
function getUserLocale(): { language: string; region: string } {
  try {
    const profile = useAuthStore.getState().profile
    return {
      language: profile?.language || 'en-US',
      region: profile?.region || 'US',
    }
  } catch {
    return { language: 'en-US', region: 'US' }
  }
}

/**
 * Dispatches an authenticated request to the TMDB server proxy.
 * - Injects fresh Firebase ID token (refreshes if expired).
 * - Passes AbortSignal for React Query query cancellation.
 * - Merges user locale (language/region).
 * - Maps upstream proxy error responses to typed TmdbError instances.
 * - Never logs tokens or sensitive URLs.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const cleanPath = path.replace(/^\/+/, '').replace(/^api\/tmdb\/?/, '')
  const url = new URL(`${PROXY_BASE}/${cleanPath}`, window.location.origin)
  const locale = getUserLocale()

  const language = options.language ?? options.params?.['language']?.toString() ?? locale.language
  const region = options.region ?? options.params?.['region']?.toString() ?? locale.region

  if (language) url.searchParams.set('language', language)
  if (region) url.searchParams.set('region', region)

  if (options.params) {
    for (const [key, val] of Object.entries(options.params)) {
      if (val !== undefined && val !== null && key !== 'language' && key !== 'region') {
        url.searchParams.set(key, String(val))
      }
    }
  }

  const headers: HeadersInit = {
    Accept: 'application/json',
  }

  // Ensure Firebase Auth state is resolved before reading currentUser
  if (typeof auth.authStateReady === 'function') {
    try {
      await auth.authStateReady()
    } catch {
      // Continue if authStateReady fails
    }
  }

  // Obtain fresh Firebase ID token if user is signed in
  const currentUser = auth.currentUser
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken()
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`
      }
    } catch {
      // Continue; proxy will return 401 if token is required and missing
    }
  }

  let response: Response
  try {
    const init: RequestInit = {
      method: 'GET',
      headers,
    }
    if (options.signal) {
      init.signal = options.signal
    }
    response = await fetch(url.toString(), init)
  } catch (err: unknown) {
    const isAbort =
      options.signal?.aborted ||
      (typeof err === 'object' &&
        err !== null &&
        ('name' in err || 'message' in err) &&
        ((err as { name?: string }).name === 'AbortError' ||
          (err as { message?: string }).message?.toLowerCase().includes('abort')))

    if (isAbort) {
      throw err // Let TanStack Query handle cancelled requests
    }
    throw new TmdbError(
      'NETWORK_ERROR',
      0,
      'Failed to communicate with TMDB proxy. Check your connection.'
    )
  }

  if (!response.ok) {
    let errorCode: TmdbErrorCode = 'UPSTREAM_ERROR'
    let errorMessage = `HTTP ${response.status}`

    try {
      const errorJson = await response.json()
      if (errorJson?.error?.code) {
        errorCode = errorJson.error.code as TmdbErrorCode
      }
      if (errorJson?.error?.message) {
        errorMessage = errorJson.error.message
      }
    } catch {
      // Non-JSON response body
    }

    if (response.status === 401) errorCode = 'UNAUTHENTICATED'
    else if (response.status === 404) errorCode = 'NOT_FOUND'
    else if (response.status === 429) errorCode = 'RATE_LIMITED'
    else if (response.status === 504) errorCode = 'TIMEOUT'

    console.warn(`[CineTrack TMDB Proxy Error ${response.status}]: ${errorMessage} (${cleanPath})`)

    throw new TmdbError(errorCode, response.status, errorMessage)
  }

  return response.json() as Promise<T>
}
