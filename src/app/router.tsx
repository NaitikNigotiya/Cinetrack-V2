import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AuthGate } from '@/features/auth/components/AuthGate'
import { AppShell } from '@/app/shell/AppShell'

// Lazy-loaded route chunks to minimize initial JavaScript bundle size
const LoginPage = lazy(() => import('@/features/auth/components/LoginPage'))
const UiPlayground = lazy(() => import('@/features/dev/UiPlayground'))
const HomePage = lazy(() => import('@/features/home/components/HomePage'))
const SearchPage = lazy(() => import('@/features/search/components/SearchPage'))
const TitleDetailPage = lazy(() => import('@/features/title/components/TitleDetailPage'))
const EpisodeTrackerPage = lazy(() => import('@/features/episodes/components/EpisodeTrackerPage'))
const DiscoverPage = lazy(() => import('@/features/discover/components/DiscoverPage'))
const LibraryPage = lazy(() => import('@/features/library/components/LibraryPage'))
const WatchlistPage = lazy(() => import('@/features/library/components/WatchlistPage'))
const WatchingPage = lazy(() => import('@/features/library/components/WatchingPage'))
const CompletedPage = lazy(() => import('@/features/library/components/CompletedPage'))
const FavoritesPage = lazy(() => import('@/features/library/components/FavoritesPage'))
const CollectionsPage = lazy(() => import('@/features/collections/components/CollectionsPage'))
const HistoryPage = lazy(() => import('@/features/history/components/HistoryPage'))
const CalendarPage = lazy(() => import('@/features/calendar/components/CalendarPage'))
const ReviewsPage = lazy(() => import('@/features/reviews/components/ReviewsPage'))
const NotesPage = lazy(() => import('@/features/notes/components/NotesPage'))
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/components/AnalyticsPage').then((m) => ({
    default: m.AnalyticsPage,
  }))
)
const OfflinePage = lazy(() => import('@/features/offline/components/OfflinePage'))
const SettingsPage = lazy(() => import('@/features/settings/components/SettingsPage'))
const NotFoundPage = lazy(() => import('@/features/notfound/components/NotFoundPage'))

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/_ui',
    element: <UiPlayground />,
  },
  {
    path: '/',
    element: (
      <AuthGate>
        <AppShell />
      </AuthGate>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'title/:titleKey',
        element: <TitleDetailPage />,
      },
      {
        path: 'title/:titleKey/episodes',
        element: <EpisodeTrackerPage />,
      },
      {
        path: 'discover',
        element: <DiscoverPage />,
      },
      {
        path: 'library',
        element: <LibraryPage />,
      },
      {
        path: 'watchlist',
        element: <WatchlistPage />,
      },
      {
        path: 'watching',
        element: <WatchingPage />,
      },
      {
        path: 'completed',
        element: <CompletedPage />,
      },
      {
        path: 'favorites',
        element: <FavoritesPage />,
      },
      {
        path: 'collections',
        element: <CollectionsPage />,
      },
      {
        path: 'collections/:id',
        element: <CollectionsPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'reviews',
        element: <ReviewsPage />,
      },
      {
        path: 'notes',
        element: <NotesPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'offline',
        element: <OfflinePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
