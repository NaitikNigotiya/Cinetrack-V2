import { Link } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import styles from './OfflinePage.module.css'

export default function OfflinePage() {
  function handleRetry() {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.iconCircle}>
        <WifiOff size={36} />
      </div>

      <h1 className={styles.title}>You are Offline</h1>
      <p className={styles.description}>
        CineTrack is currently operating in offline mode. While you are disconnected from the network,
        you can still view your saved library and track episodes locally.
      </p>

      <div className={styles.tipsBox}>
        <div className={styles.tipsTitle}>What Works Offline:</div>
        <ul className={styles.tipsList}>
          <li>Browsing your personal watchlist &amp; completed titles</li>
          <li>Viewing and checking off TV episodes (syncs automatically upon reconnect)</li>
          <li>Reviewing past watch history and personal notes</li>
        </ul>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.retryBtn} onClick={handleRetry}>
          Try Reconnecting
        </button>
        <Link to="/library" className={styles.secondaryLink}>
          Go to Library
        </Link>
        <Link to="/history" className={styles.secondaryLink}>
          View History
        </Link>
      </div>
    </div>
  )
}
