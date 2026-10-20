import { auth } from '@/services/firebase/auth'
import { useAuthStore } from '@/features/auth/store/authStore'
import { makeTitleKey } from '@/shared/lib/ids'
import type { TmdbMediaItem } from './tmdb.schema'

export const PROXY_BASE = '/api/tmdb'

export function getUserLocale(): { language: string; region: string } {
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

export function dedupeByTitleKey(items: TmdbMediaItem[]): TmdbMediaItem[] {
  const seen = new Set<string>()
  const deduped: TmdbMediaItem[] = []
  for (const item of items) {
    const type = item.media_type || (item.title ? 'movie' : 'tv')
    const key = makeTitleKey(type, item.id)
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push({ ...item, media_type: type })
    }
  }
  return deduped
}

export async function fetchFromProxy<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(path, window.location.origin)
  const locale = getUserLocale()

  if (!params['language']) url.searchParams.set('language', locale.language)
  if (!params['region']) url.searchParams.set('region', locale.region)

  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v)
  })

  const headers: HeadersInit = { Accept: 'application/json' }
  let currentUser = auth.currentUser
  if (!currentUser && typeof auth.authStateReady === 'function') {
    try {
      await auth.authStateReady()
      currentUser = auth.currentUser
    } catch {
      // Continue without token
    }
  }

  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken()
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`
      }
    } catch {
      // Continue without token
    }
  }

  let response = await fetch(url.toString(), { headers })
  if (response.status === 401 && currentUser) {
    try {
      const refreshed = await currentUser.getIdToken(true)
      if (refreshed) {
        headers['Authorization'] = `Bearer ${refreshed}`
        response = await fetch(url.toString(), { headers })
      }
    } catch {
      // Ignore retry error
    }
  }

  if (!response.ok) {
    throw new Error(`TMDB Proxy error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}
