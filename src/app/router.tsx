import { createBrowserRouter, Navigate } from 'react-router-dom'
import UiPlayground from '@/features/dev/UiPlayground'

export const router = createBrowserRouter([
  {
    path: '/_ui',
    element: <UiPlayground />,
  },
  {
    path: '/',
    element: <Navigate to="/_ui" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/_ui" replace />,
  },
])
