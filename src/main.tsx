import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from './app/providers/QueryProvider'
import { router } from './app/router'
import { useAuthStore } from './features/auth/store/authStore'
import './shared/styles/base.css'
import './shared/styles/motion.css'

if (import.meta.env.DEV) {
  // @ts-expect-error dev debug helper
  window.__authStore = useAuthStore
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element not found')
}

createRoot(rootEl).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>
)
