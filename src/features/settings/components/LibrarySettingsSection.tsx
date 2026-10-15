import { useState, useEffect } from 'react'
import type { RatingScale } from '@/shared/lib/rating'
import { toast } from '@/shared/ui/Toast/toastStore'
import styles from './LibrarySettingsSection.module.css'

export function LibrarySettingsSection() {
  const [scale, setScale] = useState<RatingScale>(() => {
    if (typeof localStorage === 'undefined') return 'ten'
    const saved = localStorage.getItem('cinetrack_rating_scale')
    if (saved === 'ten' || saved === 'five' || saved === 'fivehalf') return saved
    return 'ten'
  })

  const [defaultStatus, setDefaultStatus] = useState<string>(() => {
    if (typeof localStorage === 'undefined') return 'plan_to_watch'
    return localStorage.getItem('cinetrack_default_status') || 'plan_to_watch'
  })

  const [showSpoilers, setShowSpoilers] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem('cinetrack_show_spoilers') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('cinetrack_rating_scale', scale)
    localStorage.setItem('cinetrack_default_status', defaultStatus)
    localStorage.setItem('cinetrack_show_spoilers', String(showSpoilers))
  }, [scale, defaultStatus, showSpoilers])

  function handleSpoilersToggle() {
    const next = !showSpoilers
    setShowSpoilers(next)
    toast.info(next ? 'Spoilers will be shown automatically' : 'Spoilers blurred by default')
  }

  return (
    <div className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.title}>Library &amp; Rating Preferences</h2>

        <div className={styles.formGroup}>
          <label htmlFor="rating-scale-select" className={styles.label}>
            Rating Scale
          </label>
          <span className={styles.sublabel}>
            Choose how ratings are formatted throughout your library and detail views
          </span>
          <select
            id="rating-scale-select"
            className={styles.select}
            value={scale}
            onChange={(e) => setScale(e.target.value as RatingScale)}
          >
            <option value="ten">10-Point Scale (0.5 – 10.0)</option>
            <option value="fivehalf">5-Point Scale with Half Stars (0.5 – 5.0)</option>
            <option value="five">5-Point Scale Whole Stars (1 – 5)</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="default-status-select" className={styles.label}>
            Default Watch Status
          </label>
          <span className={styles.sublabel}>
            Initial status applied when clicking "Add to Library" from Search or Discover
          </span>
          <select
            id="default-status-select"
            className={styles.select}
            value={defaultStatus}
            onChange={(e) => setDefaultStatus(e.target.value)}
          >
            <option value="plan_to_watch">Plan to Watch</option>
            <option value="watching">Currently Watching</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.label}>Reveal Spoilers Automatically</div>
            <div className={styles.sublabel}>
              Disable blur scrim over reviews marked with spoilers
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={showSpoilers}
            className={`${styles.switch} ${showSpoilers ? styles.switchActive : ''}`}
            onClick={handleSpoilersToggle}
          >
            <div className={styles.switchThumb} />
          </button>
        </div>
      </div>
    </div>
  )
}
