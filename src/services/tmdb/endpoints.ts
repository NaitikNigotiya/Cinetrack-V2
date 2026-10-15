import {
  searchMulti,
  searchMovie,
  searchTv,
  findByExternalId,
} from './endpoints/search'
import {
  getMovieDetails,
  getTvDetails,
  getTvSeason,
  getTvEpisode,
} from './endpoints/details'
import {
  getTrending,
  getPopular,
  getTopRated,
  getNowPlaying,
  getUpcoming,
  getOnTheAir,
  getAiringToday,
  discoverMovies,
  discoverTv,
  discoverByGenre,
  getRecommendations,
  getSimilar,
} from './endpoints/lists'
import {
  getGenreList,
  getConfiguration,
  getWatchProvidersCatalog,
} from './endpoints/meta'
import { fetchMergedGenreMap } from './genres'

export * from './endpoints/search'
export * from './endpoints/details'
export * from './endpoints/lists'
export * from './endpoints/meta'

export const tmdbClient = {
  searchMulti,
  searchMovie,
  searchTv,
  findByExternalId,
  getMovieDetails,
  getTvDetails,
  getTvSeason,
  getTvEpisode,
  getTrending,
  getPopular,
  getTopRated,
  getNowPlaying,
  getUpcoming,
  getOnTheAir,
  getAiringToday,
  discoverMovies,
  discoverTv,
  discoverByGenre,
  getRecommendations,
  getSimilar,
  getGenreList,
  getMergedGenreMap: fetchMergedGenreMap,
  getConfiguration,
  getWatchProvidersCatalog,
}
