import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGate } from '@/features/auth/components/AuthGate'
import LoginPage from '@/features/auth/components/LoginPage'
import { AppShell } from '@/app/shell/AppShell'
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
        element: <UiPlayground />, // Will be replaced by HomePage in Phase 5
      },
      {
        path: 'search',
        element: <div>Search Route (Scaffolded)</div>,
      },
      {
        path: 'discover',
        element: <div>Discover Route (Scaffolded)</div>,
      },
      {
        path: 'library',
        element: <div>Library Route (Scaffolded)</div>,
      },
      {
        path: 'collections',
        element: <div>Collections Route (Scaffolded)</div>,
      },
      {
        path: 'history',
        element: <div>History Route (Scaffolded)</div>,
      },
      {
        path: 'calendar',
        element: <div>Calendar Route (Scaffolded)</div>,
      },
      {
        path: 'reviews',
        element: <div>Reviews Route (Scaffolded)</div>,
      },
      {
        path: 'notes',
        element: <div>Notes Route (Scaffolded)</div>,
      },
      {
        path: 'analytics',
        element: <div>Analytics Route (Scaffolded)</div>,
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
