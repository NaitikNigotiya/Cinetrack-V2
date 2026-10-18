import { createBrowserRouter } from 'react-router-dom'
import { AuthGate } from '@/features/auth/components/AuthGate'
import LoginPage from '@/features/auth/components/LoginPage'
import { AppShell } from '@/app/shell/AppShell'
import SearchPage from '@/features/search/components/SearchPage'
import TitleDetailPage from '@/features/title/components/TitleDetailPage'
import EpisodeTrackerPage from '@/features/episodes/components/EpisodeTrackerPage'
import HistoryPage from '@/features/history/components/HistoryPage'
import LibraryPage from '@/features/library/components/LibraryPage'
import WatchlistPage from '@/features/library/components/WatchlistPage'
import WatchingPage from '@/features/library/components/WatchingPage'
import CompletedPage from '@/features/library/components/CompletedPage'
import FavoritesPage from '@/features/library/components/FavoritesPage'
import HomePage from '@/features/home/components/HomePage'
import DiscoverPage from '@/features/discover/components/DiscoverPage'
import CollectionsPage from '@/features/collections/components/CollectionsPage'
import CalendarPage from '@/features/calendar/components/CalendarPage'
import ReviewsPage from '@/features/reviews/components/ReviewsPage'
import NotesPage from '@/features/notes/components/NotesPage'
import { AnalyticsPage } from '@/features/analytics/components/AnalyticsPage'
import OfflinePage from '@/features/offline/components/OfflinePage'
import SettingsPage from '@/features/settings/components/SettingsPage'
import NotFoundPage from '@/features/notfound/components/NotFoundPage'
import UiPlayground from '@/features/dev/UiPlayground'

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
