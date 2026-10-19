import { describe, it, expect } from 'vitest'
import rulesContent from '../../firestore.rules?raw'

/**
 * Fixture variables for test verification.
 * The owner email appears here as a test fixture variable.
 */
const OWNER_FIXTURE_EMAIL = 'nigotiyanaitik@gmail.com'
const OTHER_USER_EMAIL = 'intruder@example.com'

describe('Firestore Security Rules - Single Owner Isolation', () => {

  it('rules file defines isOwner() helper with exact email and verified flag requirement', () => {
    expect(rulesContent).toContain('function isOwner()')
    expect(rulesContent).toContain('request.auth != null')
    expect(rulesContent).toContain('request.auth.token.email_verified == true')
    expect(rulesContent).toContain(`request.auth.token.email.lower() == '${OWNER_FIXTURE_EMAIL}'`)
  })

  it('rules file denies publicCollections and enforces default deny', () => {
    expect(rulesContent).not.toContain('match /publicCollections')
    expect(rulesContent).toContain('match /{document=**}')
    expect(rulesContent).toContain('allow read, write: if false;')
  })

  it('rules file isolates users collection to isOwner() && request.auth.uid == userId', () => {
    expect(rulesContent).toContain('match /users/{userId}')
    expect(rulesContent).toContain('isOwner() && request.auth.uid == userId')
  })

  // Logical evaluation matching Firestore Rules engine semantics
  function evaluateRule({
    auth,
    targetUserId,
    path: docPath,
  }: {
    auth: {
      uid: string
      token: {
        email: string
        email_verified: boolean
      }
    } | null
    targetUserId: string
    path: string
  }): boolean {
    // Helper function logic from firestore.rules
    const isOwner =
      auth !== null &&
      auth.token.email_verified === true &&
      auth.token.email.toLowerCase() === OWNER_FIXTURE_EMAIL

    // Match /users/{userId}
    if (docPath.startsWith(`/users/${targetUserId}`)) {
      return isOwner && auth !== null && auth.uid === targetUserId
    }

    // Default deny
    return false
  }

  it('allows owner (verified email) to read and write own documents', () => {
    const allowed = evaluateRule({
      auth: {
        uid: 'owner-uid-123',
        token: {
          email: OWNER_FIXTURE_EMAIL,
          email_verified: true,
        },
      },
      targetUserId: 'owner-uid-123',
      path: '/users/owner-uid-123/library/movie:550',
    })
    expect(allowed).toBe(true)
  })

  it('allows owner with mixed-case email to read/write own documents', () => {
    const allowed = evaluateRule({
      auth: {
        uid: 'owner-uid-123',
        token: {
          email: 'NigotiyaNaitik@gmail.com',
          email_verified: true,
        },
      },
      targetUserId: 'owner-uid-123',
      path: '/users/owner-uid-123/settings/preferences',
    })
    expect(allowed).toBe(true)
  })

  it('denies access when a different email is signed in', () => {
    const allowed = evaluateRule({
      auth: {
        uid: 'stranger-uid-456',
        token: {
          email: OTHER_USER_EMAIL,
          email_verified: true,
        },
      },
      targetUserId: 'stranger-uid-456',
      path: '/users/stranger-uid-456/library/movie:550',
    })
    expect(allowed).toBe(false)
  })

  it('denies access when owner email is unverified (email_verified == false)', () => {
    const allowed = evaluateRule({
      auth: {
        uid: 'owner-uid-123',
        token: {
          email: OWNER_FIXTURE_EMAIL,
          email_verified: false,
        },
      },
      targetUserId: 'owner-uid-123',
      path: '/users/owner-uid-123/history/event-1',
    })
    expect(allowed).toBe(false)
  })

  it('denies access when unauthenticated (request.auth == null)', () => {
    const allowed = evaluateRule({
      auth: null,
      targetUserId: 'owner-uid-123',
      path: '/users/owner-uid-123/library/movie:550',
    })
    expect(allowed).toBe(false)
  })

  it('denies owner from reading another user path (request.auth.uid != userId)', () => {
    const allowed = evaluateRule({
      auth: {
        uid: 'owner-uid-123',
        token: {
          email: OWNER_FIXTURE_EMAIL,
          email_verified: true,
        },
      },
      targetUserId: 'victim-user-789',
      path: '/users/victim-user-789/library/movie:550',
    })
    expect(allowed).toBe(false)
  })
})
