import { useState } from 'react'
import { setDoc, serverTimestamp } from 'firebase/firestore'
import {
  getUserDocRef,
  getPreferencesDocRef,
  getPushSettingsDocRef,
  getStatsSummaryDocRef,
} from '@/services/firebase/collections'
import { useAuthStore } from '../store/authStore'
import { Dialog, Button } from '@/shared/ui'
import { Film, Check } from 'lucide-react'
import styles from './OnboardingModal.module.css'

const POPULAR_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
]

export function OnboardingModal({ isOpen }: { isOpen: boolean }) {
  const { user, fetchUserData } = useAuthStore()
  const [step, setStep] = useState(1)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([28, 878, 18])
  const [defaultStatus, setDefaultStatus] = useState<'plan_to_watch' | 'watching'>('plan_to_watch')
  const [ratingScale, setRatingScale] = useState<'ten' | 'five' | 'fivehalf'>('ten')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    )
  }

  const handleFinish = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      const now = serverTimestamp()
      const userRef = getUserDocRef(user.uid)
      const prefRef = getPreferencesDocRef(user.uid)
      const pushRef = getPushSettingsDocRef(user.uid)
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
        setDoc(pushRef, {
          pushEnabled: false,
          tokens: {},
          favoriteGenreIds: selectedGenres,
          includeTv: true,
          digestHourLocal: 20,
          lastSentAt: null,
          recentlyNotifiedKeys: [],
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
      title={step === 1 ? 'Pick Your Genres' : step === 2 ? 'Viewing Preferences' : 'All Set!'}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < 3 ? (
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
          <div>
            <p className={styles.description}>
              Select the genres you love. We'll curate recommendations and release alerts for you.
            </p>
            <div className={styles.genreGrid}>
              {POPULAR_GENRES.map((g) => {
                const isSelected = selectedGenres.includes(g.id)
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGenre(g.id)}
                    className={`${styles.genreChip} ${isSelected ? styles.genreChipSelected : ''}`}
                  >
                    {isSelected && <Check size={14} />}
                    {g.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
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

        {step === 3 && (
          <div className={styles.readyBox}>
            <div className={styles.iconCircle}>
              <Film size={36} color="var(--accent)" />
            </div>
            <h3>Ready for the Ultimate Watchlist</h3>
            <p className={styles.description}>
              Your account is configured with your selected genres and tracking preferences.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  )
}
