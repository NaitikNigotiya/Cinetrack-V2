import React, { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { signOutUser } from '@/services/firebase/auth'
import { clearAppCaches } from '@/shared/lib/cacheCleanup'
import { Button } from '@/shared/ui'
import { ShieldAlert } from 'lucide-react'
import styles from './AuthGate.module.css'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isDenied, setIsDenied] = useState(false)
  const [isCheckingOwner, setIsCheckingOwner] = useState(true)

  const configuredOwnerEmail = (import.meta.env.VITE_OWNER_EMAIL || '').trim().toLowerCase()
  const userEmail = (user?.email || '').trim().toLowerCase()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      setIsCheckingOwner(false)
      return
    }

    // Single-owner security check
    const isOwner = Boolean(
      configuredOwnerEmail &&
      userEmail &&
      userEmail === configuredOwnerEmail
    )

    if (!isOwner) {
      setIsDenied(true)
      setIsCheckingOwner(false)
      // Immediately sign out and purge all client caches
      void (async () => {
        try {
          await signOutUser()
          await clearAppCaches()
        } catch (err) {
          console.warn('Error clearing caches on access denial:', err)
        }
      })()
    } else {
      setIsDenied(false)
      setIsCheckingOwner(false)
    }
  }, [user, userEmail, configuredOwnerEmail, isLoading])

  const handleUseDifferentAccount = async () => {
    try {
      await signOutUser()
      await clearAppCaches()
    } catch {
      // Ignore
    }
    setIsDenied(false)
    navigate('/login', { replace: true })
  }

  if (isLoading || (user && isCheckingOwner)) {
    return (
      <div className={styles.splash} role="status" aria-label="Loading CineTrack">
        <div className={styles.logo}>CineTrack</div>
        <div className={styles.spinner} aria-hidden="true" />
      </div>
    )
  }

  if (isDenied) {
    return (
      <div className={styles.deniedContainer}>
        <div className={styles.deniedCard} role="alert" aria-live="assertive">
          <div className={styles.deniedIconWrap}>
            <ShieldAlert size={28} />
          </div>
          <h1 className={styles.deniedTitle}>Access Denied</h1>
          <p className={styles.deniedMessage}>This is a private app. Access denied.</p>
          {configuredOwnerEmail ? (
            <p className={styles.deniedSubtext}>
              This personal library is private to its owner.
            </p>
          ) : null}
          <Button
            variant="primary"
            className={styles.switchButton}
            onClick={handleUseDifferentAccount}
          >
            Use a different account
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
