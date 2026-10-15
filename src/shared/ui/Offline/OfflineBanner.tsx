import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'
import styles from './OfflineBanner.module.css'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  )

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
    }
    function handleOffline() {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <WifiOff size={16} className={styles.icon} />
      <span className={styles.text}>
        You are offline. Your library and watch history remain available from local cache.
      </span>
    </div>
  )
}
