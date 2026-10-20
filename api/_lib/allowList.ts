export type ProxyErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'PATH_NOT_ALLOWED'
  | 'BAD_PARAMS'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'TIMEOUT'

export interface RouteRule {
  pattern: RegExp
  allowedParams: readonly string[]
  cacheCategory: 'details' | 'lists' | 'search'
}

export const ROUTE_RULES: RouteRule[] = [
  // Search
  {
    pattern: /^search\/(multi|movie|tv|person|collection|company|keyword)$/,
    allowedParams: [
      'query',
      'year',
      'primary_release_year',
      'first_air_date_year',
      'region',
      'page',
      'language',
      'include_adult',
    ],
    cacheCategory: 'search',
  },
  {
    pattern: /^find\/[a-zA-Z0-9_-]+$/,
    allowedParams: ['external_source', 'language'],
    cacheCategory: 'search',
  },
  // Details & Seasons
  {
    pattern: /^movie\/\d+$/,
    allowedParams: ['append_to_response', 'language', 'include_image_language', 'region'],
    cacheCategory: 'details',
  },
  {
    pattern: /^tv\/\d+$/,
    allowedParams: ['append_to_response', 'language', 'include_image_language', 'region'],
    cacheCategory: 'details',
  },
  {
    pattern: /^tv\/\d+\/season\/\d+$/,
    allowedParams: ['append_to_response', 'language', 'include_image_language'],
    cacheCategory: 'details',
  },
  {
    pattern: /^tv\/\d+\/season\/\d+\/episode\/\d+$/,
    allowedParams: ['append_to_response', 'language', 'include_image_language'],
    cacheCategory: 'details',
  },
  // Sub-resources (credits, aggregate_credits, images, videos, etc.)
  {
    pattern: /^(movie|tv)\/\d+\/(recommendations|similar|videos|credits|aggregate_credits|watch\/providers|release_dates|external_ids|keywords|content_ratings)$/,
    allowedParams: ['page', 'language', 'region', 'watch_region'],
    cacheCategory: 'details',
  },
  {
    pattern: /^(movie|tv)\/\d+\/images$/,
    allowedParams: ['include_image_language', 'language'],
    cacheCategory: 'details',
  },
  {
    pattern: /^(movie|tv)\/\d+\/reviews$/,
    allowedParams: ['page', 'language'],
    cacheCategory: 'details',
  },
  // Person
  {
    pattern: /^person\/\d+$/,
    allowedParams: ['append_to_response', 'language'],
    cacheCategory: 'details',
  },
  {
    pattern: /^person\/\d+\/(movie_credits|tv_credits|combined_credits|images|external_ids|tagged_images)$/,
    allowedParams: ['language', 'page'],
    cacheCategory: 'details',
  },
  {
    pattern: /^person\/(popular|latest)$/,
    allowedParams: ['page', 'language'],
    cacheCategory: 'lists',
  },
  // Trending & Lists
  {
    pattern: /^trending\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/,
    allowedParams: ['page', 'language', 'region'],
    cacheCategory: 'lists',
  },
  {
    pattern: /^movie\/(popular|top_rated|upcoming|now_playing)$/,
    allowedParams: ['page', 'language', 'region'],
    cacheCategory: 'lists',
  },
  {
    pattern: /^tv\/(popular|top_rated|on_the_air|airing_today)$/,
    allowedParams: ['page', 'language', 'timezone'],
    cacheCategory: 'lists',
  },
  // Discover
  {
    pattern: /^discover\/movie$/,
    allowedParams: [
      'with_genres',
      'without_genres',
      'sort_by',
      'primary_release_date.gte',
      'primary_release_date.lte',
      'release_date.gte',
      'release_date.lte',
      'vote_average.gte',
      'vote_average.lte',
      'vote_count.gte',
      'with_original_language',
      'with_runtime.gte',
      'with_runtime.lte',
      'watch_region',
      'with_watch_providers',
      'page',
      'language',
      'region',
      'include_adult',
    ],
    cacheCategory: 'search',
  },
  {
    pattern: /^discover\/tv$/,
    allowedParams: [
      'with_genres',
      'without_genres',
      'sort_by',
      'first_air_date.gte',
      'first_air_date.lte',
      'air_date.gte',
      'air_date.lte',
      'vote_average.gte',
      'vote_average.lte',
      'vote_count.gte',
      'with_networks',
      'with_status',
      'with_type',
      'with_original_language',
      'with_runtime.gte',
      'with_runtime.lte',
      'watch_region',
      'with_watch_providers',
      'page',
      'language',
      'include_adult',
    ],
    cacheCategory: 'search',
  },
  // Meta & Configuration
  {
    pattern: /^genre\/(movie|tv)\/list$/,
    allowedParams: ['language'],
    cacheCategory: 'details',
  },
  {
    pattern: /^configuration(\/[a-zA-Z0-9_-]+)?$/,
    allowedParams: [],
    cacheCategory: 'details',
  },
  {
    pattern: /^watch\/providers\/(movie|tv|regions)$/,
    allowedParams: ['language', 'watch_region'],
    cacheCategory: 'details',
  },
]

export function matchRoute(path: string): RouteRule | null {
  const cleanPath = path.trim().replace(/^\/+|\/+$/g, '')
  // Reject path traversal attempts explicitly
  if (cleanPath.includes('..') || cleanPath.includes('//') || cleanPath.includes('\\')) {
    return null
  }

  for (const rule of ROUTE_RULES) {
    if (rule.pattern.test(cleanPath)) {
      return rule
    }
  }
  return null
}

export function sanitizeParams(
  rawParams: URLSearchParams,
  allowedParams: readonly string[]
): URLSearchParams {
  const cleanParams = new URLSearchParams()
  const allowedSet = new Set(allowedParams)

  rawParams.forEach((val, key) => {
    if (!allowedSet.has(key)) {
      return // Unknown params dropped
    }

    let cleanVal = val
    if (key === 'query' && cleanVal.length > 200) {
      cleanVal = cleanVal.slice(0, 200) // Cap query length at 200
    } else if (key === 'page') {
      const pageNum = parseInt(cleanVal, 10)
      if (isNaN(pageNum) || pageNum < 1) {
        cleanVal = '1'
      } else if (pageNum > 500) {
        cleanVal = '500' // Cap page at 1 to 500
      } else {
        cleanVal = pageNum.toString()
      }
    }

    cleanParams.set(key, cleanVal)
  })

  // Always force include_adult=false
  cleanParams.set('include_adult', 'false')

  return cleanParams
}

export function getCacheControlHeader(category: 'details' | 'lists' | 'search'): string {
  switch (category) {
    case 'details':
      return 'public, s-maxage=86400, stale-while-revalidate=604800'
    case 'lists':
      return 'public, s-maxage=900, stale-while-revalidate=3600'
    case 'search':
      return 'public, s-maxage=300, stale-while-revalidate=600'
  }
}
