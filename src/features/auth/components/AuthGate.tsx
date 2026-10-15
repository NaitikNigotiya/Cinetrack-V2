import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { OnboardingModal } from './OnboardingModal'
import styles from './AuthGate.module.css'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className={styles.splash} role="status" aria-label="Loading CineTrack">
        <div className={styles.logo}>CineTrack</div>
        <div className={styles.spinner} aria-hidden="true" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const needsOnboarding = !profile || !profile.onboarded

  return (
    <>
      {children}
      <OnboardingModal isOpen={needsOnboarding} />
    </>
  )
}
