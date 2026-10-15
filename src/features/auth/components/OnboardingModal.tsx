import { useState } from 'react'
import { setDoc, serverTimestamp } from 'firebase/firestore'
import {
  getUserDocRef,
  getPreferencesDocRef,
  getStatsSummaryDocRef,
} from '@/services/firebase/collections'
import { useAuthStore } from '../store/authStore'
import { Dialog, Button } from '@/shared/ui'
import { Film } from 'lucide-react'
import styles from './OnboardingModal.module.css'

export function OnboardingModal({ isOpen }: { isOpen: boolean }) {
  const { user, fetchUserData } = useAuthStore()
  const [step, setStep] = useState(1)
  const [defaultStatus, setDefaultStatus] = useState<'plan_to_watch' | 'watching'>('plan_to_watch')
  const [ratingScale, setRatingScale] = useState<'ten' | 'five' | 'fivehalf'>('ten')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFinish = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      const now = serverTimestamp()
      const userRef = getUserDocRef(user.uid)
      const prefRef = getPreferencesDocRef(user.uid)
      const statsRef = getStatsSummaryDocRef(user.uid)

      await Promise.all([
        setDoc(userRef, {
          displayName: user.displayName || user.email?.split('@')[0] || 'Movie Enthusiast',
          email: user.email || '',
          photoURL: user.photoURL || null,
          region: 'US',
          language: 'en-US',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          onboarded: true,
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
        }),
        setDoc(prefRef, {
          theme: 'dark',
          ratingScale,
          defaultStatus,
          compactCards: false,
          showSpoilers: false,
          weekStartsOn: 0,
          hiddenTmdbKeys: [],
          updatedAt: now,
        }),
        setDoc(statsRef, {
          moviesWatched: 0,
          episodesWatched: 0,
          minutesWatched: 0,
          titlesCompleted: 0,
          ratingSum: 0,
          ratingCount: 0,
          genreCounts: {},
          statusCounts: {},
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDay: null,
          updatedAt: now,
        }),
      ])

      await fetchUserData(user.uid)
    } catch (err) {
      console.error('Failed to complete onboarding:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {}}
      closeOnBackdropClick={false}
      title={step === 1 ? 'Viewing Preferences' : 'All Set!'}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < 2 ? (
            <Button variant="primary" onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" onClick={handleFinish} isLoading={isSubmitting}>
              Start Tracking
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.content}>
        {step === 1 && (
          <div className={styles.formGroup}>
            <p className={styles.description}>Customize how CineTrack rates and organizes titles.</p>
            <div className={styles.field}>
              <label className={styles.label}>Default Watchlist Status</label>
              <div className={styles.optionsRow}>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${defaultStatus === 'plan_to_watch' ? styles.optionActive : ''}`}
                  onClick={() => setDefaultStatus('plan_to_watch')}
                >
                  Plan to Watch
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${defaultStatus === 'watching' ? styles.optionActive : ''}`}
                  onClick={() => setDefaultStatus('watching')}
                >
                  Watching
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Rating Scale</label>
              <div className={styles.optionsRow}>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${ratingScale === 'ten' ? styles.optionActive : ''}`}
                  onClick={() => setRatingScale('ten')}
                >
                  10-point (0.5 - 10)
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${ratingScale === 'fivehalf' ? styles.optionActive : ''}`}
                  onClick={() => setRatingScale('fivehalf')}
                >
                  5-star (with halves)
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${ratingScale === 'five' ? styles.optionActive : ''}`}
                  onClick={() => setRatingScale('five')}
                >
                  5-star (integers)
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.readyBox}>
            <div className={styles.iconCircle}>
              <Film size={36} color="var(--accent)" />
            </div>
            <h3>Ready for the Ultimate Watchlist</h3>
            <p className={styles.description}>
              Your account is configured with your tracking preferences.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  )
}
