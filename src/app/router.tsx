import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGate } from '@/features/auth/components/AuthGate'
import LoginPage from '@/features/auth/components/LoginPage'
import { AppShell } from '@/app/shell/AppShell'
import SearchPage from '@/features/search/components/SearchPage'
import TitleDetailPage from '@/features/title/components/TitleDetailPage'
import EpisodeTrackerPage from '@/features/episodes/components/EpisodeTrackerPage'
import HistoryPage from '@/features/history/components/HistoryPage'
import LibraryPage from '@/features/library/components/LibraryPage'
import HomePage from '@/features/home/components/HomePage'
import DiscoverPage from '@/features/discover/components/DiscoverPage'
import CollectionsPage from '@/features/collections/components/CollectionsPage'
import CollectionDetailPage from '@/features/collections/components/CollectionDetailPage'
import CalendarPage from '@/features/calendar/components/CalendarPage'
import ReviewsPage from '@/features/reviews/components/ReviewsPage'
import NotesPage from '@/features/notes/components/NotesPage'
import { AnalyticsPage } from '@/features/analytics/components/AnalyticsPage'
import OfflinePage from '@/features/offline/components/OfflinePage'
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
        path: 'collections',
        element: <CollectionsPage />,
      },
      {
        path: 'collections/:id',
        element: <CollectionDetailPage />,
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
        element: <div>Settings Route (Scaffolded)</div>,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
])
