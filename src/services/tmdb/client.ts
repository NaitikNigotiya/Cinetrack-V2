import type { User } from 'firebase/auth'
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

let sharedAuthPromise: Promise<User | null> | null = null

/**
 * Resolves current authenticated user, waiting for auth state resolution if needed.
 * Shares a single pending promise among all concurrent callers to prevent request waterfalls.
 */
async function resolveCurrentUser(timeoutMs = 800): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser
  }

  if (sharedAuthPromise) {
    return sharedAuthPromise
  }

  sharedAuthPromise = (async () => {
    // 1. Wait for authStateReady if supported
    if (typeof auth.authStateReady === 'function') {
      try {
        await auth.authStateReady()
      } catch {
        // Continue
      }
    }

    if (auth.currentUser) {
      return auth.currentUser
    }

    // 2. Check auth store
    const storeUser = useAuthStore.getState().user
    if (storeUser) {
      return storeUser
    }

    // 3. Wait for store initialization if still loading
    if (!useAuthStore.getState().isInitialized) {
      await new Promise<void>((resolve) => {
        let resolved = false
        const timer = setTimeout(() => {
          if (!resolved) {
            resolved = true
            resolve()
          }
        }, timeoutMs)

        const unsub = useAuthStore.subscribe((state) => {
          if (state.isInitialized && !resolved) {
            resolved = true
            clearTimeout(timer)
            unsub()
            resolve()
          }
        })
      })
    }

    return auth.currentUser || useAuthStore.getState().user
  })().finally(() => {
    setTimeout(() => {
      sharedAuthPromise = null
    }, 500)
  })

  return sharedAuthPromise
}

/**
 * Dispatches an authenticated request to the TMDB server proxy.
 * - Injects fresh Firebase ID token (waits for auth state on first load).
 * - Retries once with getIdToken(true) on a 401 response.
 * - Passes AbortSignal for query cancellation.
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

  // Obtain Firebase ID token, waiting for auth state if not yet ready
  const user = await resolveCurrentUser()
  if (user && typeof user.getIdToken === 'function') {
    try {
      const idToken = await user.getIdToken()
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`
      }
    } catch {
      // Continue; proxy will return 401 if token is required and missing
    }
  }

  const doFetch = async (currentHeaders: HeadersInit): Promise<Response> => {
    const init: RequestInit = {
      method: 'GET',
      headers: currentHeaders,
    }
    if (options.signal) {
      init.signal = options.signal
    }
    return fetch(url.toString(), init)
  }

  let response: Response
  try {
    response = await doFetch(headers)
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

  // Handle 401: retry once with forced token refresh getIdToken(true)
  if (response.status === 401) {
    const activeUser = auth.currentUser || user
    if (activeUser && typeof activeUser.getIdToken === 'function') {
      try {
        const refreshedToken = await activeUser.getIdToken(true)
        if (refreshedToken) {
          const retryHeaders: HeadersInit = {
            ...headers,
            Authorization: `Bearer ${refreshedToken}`,
          }
          response = await doFetch(retryHeaders)
        }
      } catch (refreshErr) {
        console.warn('[TMDB Client] 401 token refresh retry failed:', refreshErr)
      }
    }
  }

  if (!response.ok) {
    let errorCode: TmdbErrorCode = 'UPSTREAM_ERROR'
    let errorMessage = `HTTP ${response.status}`

    try {
      const errorJson = await response.json()
      if (errorJson?.code) {
        errorCode = errorJson.code as TmdbErrorCode
      } else if (errorJson?.error?.code) {
        errorCode = errorJson.error.code as TmdbErrorCode
      }
      if (errorJson?.message) {
        errorMessage = errorJson.message
      } else if (errorJson?.error?.message) {
        errorMessage = errorJson.error.message
      }
    } catch {
      // Non-JSON response body
    }

    if (response.status === 401 && errorCode === 'UPSTREAM_ERROR') errorCode = 'UNAUTHENTICATED'
    else if (response.status === 403 && errorCode === 'UPSTREAM_ERROR') errorCode = 'NOT_OWNER'
    else if (response.status === 404 && errorCode === 'UPSTREAM_ERROR') errorCode = 'NOT_FOUND'
    else if (response.status === 429 && errorCode === 'UPSTREAM_ERROR') errorCode = 'RATE_LIMITED'
    else if (response.status === 504 && errorCode === 'UPSTREAM_ERROR') errorCode = 'TIMEOUT'

    console.warn(`[CineTrack TMDB Proxy Error ${response.status}]: ${errorMessage} (${cleanPath})`)

    throw new TmdbError(errorCode, response.status, errorMessage)
  }

  return response.json() as Promise<T>
}
