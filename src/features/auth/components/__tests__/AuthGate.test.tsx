import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthGate } from '../AuthGate'
import { useAuthStore } from '../../store/authStore'
import * as authService from '@/services/firebase/auth'
import * as cacheService from '@/shared/lib/cacheCleanup'

/**
 * Fixture variables for component testing
 */
const TEST_OWNER_EMAIL = 'nigotiyanaitik@gmail.com'
const NON_OWNER_EMAIL = 'imposter@example.com'

vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>()
  return {
    ...actual,
    onAuthStateChanged: vi.fn(),
  }
})

vi.mock('@/services/firebase/auth', () => ({
  signOutUser: vi.fn(async () => {}),
  signInWithGoogle: vi.fn(),
  auth: {},
}))

vi.mock('@/shared/lib/cacheCleanup', () => ({
  clearAppCaches: vi.fn(async () => {}),
}))

describe('AuthGate Single-Owner Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    import.meta.env.VITE_OWNER_EMAIL = TEST_OWNER_EMAIL
    useAuthStore.setState({
      user: null,
      profile: null,
      preferences: null,
      isLoading: false,
      isInitialized: true,
    })
  })

  it('non-owner login shows denied screen, immediately signs out, and purges caches without rendering children', async () => {
    useAuthStore.setState({
      user: {
        uid: 'attacker-123',
        email: NON_OWNER_EMAIL,
        emailVerified: true,
      } as any,
      isLoading: false,
      isInitialized: true,
    })

    render(
      <MemoryRouter>
        <AuthGate>
          <div data-testid="protected-dashboard">Secret Owner Dashboard</div>
        </AuthGate>
      </MemoryRouter>
    )

    // Verify denied screen is shown
    expect(await screen.findByText('Access Denied')).toBeDefined()
    expect(screen.getByText('This is a private app. Access denied.')).toBeDefined()
    expect(screen.getByRole('button', { name: /use a different account/i })).toBeDefined()

    // Protected content MUST NOT render
    expect(screen.queryByTestId('protected-dashboard')).toBeNull()

    // Sign out and cache purge must have been executed immediately
    await waitFor(() => {
      expect(authService.signOutUser).toHaveBeenCalledTimes(1)
      expect(cacheService.clearAppCaches).toHaveBeenCalledTimes(1)
    })
  })

  it('owner login reaches the dashboard and does not trigger sign out or cache purge', async () => {
    useAuthStore.setState({
      user: {
        uid: 'owner-uid-123',
        email: TEST_OWNER_EMAIL,
        emailVerified: true,
      } as any,
      isLoading: false,
      isInitialized: true,
    })

    render(
      <MemoryRouter>
        <AuthGate>
          <div data-testid="protected-dashboard">Secret Owner Dashboard</div>
        </AuthGate>
      </MemoryRouter>
    )

    // Protected dashboard MUST render
    expect(await screen.findByTestId('protected-dashboard')).toBeDefined()
    expect(screen.getByText('Secret Owner Dashboard')).toBeDefined()

    // Access denied elements must not be present
    expect(screen.queryByText('Access Denied')).toBeNull()
    expect(screen.queryByText('This is a private app. Access denied.')).toBeNull()

    // Sign out and cache purge must NOT be called
    expect(authService.signOutUser).not.toHaveBeenCalled()
    expect(cacheService.clearAppCaches).not.toHaveBeenCalled()
  })
})
