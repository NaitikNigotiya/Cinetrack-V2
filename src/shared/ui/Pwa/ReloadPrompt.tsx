import { useRegisterSW } from 'virtual:pwa-register/react'
import { Sparkles, X } from 'lucide-react'
import styles from './ReloadPrompt.module.css'

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Check for updates immediately upon load
        r.update().catch(() => {})

        // Check for updates when user returns to / refocuses tab
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            r.update().catch(() => {})
          }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Check for updates periodically (every 60 seconds)
        const interval = setInterval(() => {
          r.update().catch(() => {})
        }, 60 * 1000)

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          clearInterval(interval)
        }
      }
    },
    onRegisterError(err) {
      console.warn('[PWA] Service worker registration failed:', err)
    },
  })

  if (!needRefresh) return null

  return (
    <div className={styles.container} role="alert" aria-live="assertive">
      <div className={styles.toast}>
        <Sparkles size={20} className={styles.icon} />
        <div className={styles.content}>
          <span className={styles.title}>Update Available</span>
          <span className={styles.desc}>A new version of CineTrack is ready.</span>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.reloadBtn}
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setNeedRefresh(false)}
            aria-label="Dismiss update notification"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
