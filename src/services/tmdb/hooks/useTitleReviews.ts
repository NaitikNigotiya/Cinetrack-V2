import { useQuery } from '@tanstack/react-query'
import { getMovieReviews, getTvReviews } from '../endpoints'
import { tmdbKeys } from '../keys'
import type { CommunityReview } from '@/features/title/components/TitleReviewsTab'

export function useTitleReviews(type: 'movie' | 'tv', tmdbId: number) {
  return useQuery<CommunityReview[]>({
    queryKey: [...tmdbKeys.all, 'reviews', `${type}:${tmdbId}`],
    queryFn: async ({ signal }) => {
      if (!tmdbId) return []
      try {
        const data = type === 'movie'
          ? await getMovieReviews(tmdbId, 1, signal)
          : await getTvReviews(tmdbId, 1, signal)

        return (data.results || []).map((r) => ({
          id: r.id,
          author: r.author || 'Anonymous',
          rating: typeof r.author_details?.rating === 'number' ? r.author_details.rating : null,
          content: r.content || '',
          createdAt: r.created_at || null,
          url: r.url || null,
        }))
      } catch (err) {
        console.warn('Failed to fetch TMDB reviews:', err)
        return []
      }
    },
    enabled: Boolean(tmdbId),
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
