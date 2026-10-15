import styles from './AboutSection.module.css'

export function AboutSection() {
  return (
    <div className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.title}>About CineTrack</h2>
        <p className={styles.desc}>
          Track. Rate. Remember. CineTrack v2 is a rebuilt-from-scratch personal movie and TV tracking
          Progressive Web App designed for speed, privacy, and full offline resilience.
        </p>

        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Version</span>
          <span className={styles.metaValue}>2.0.0</span>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Framework</span>
          <span className={styles.metaValue}>React 19 &amp; Vite</span>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Database &amp; Sync</span>
          <span className={styles.metaValue}>Firebase Firestore Multi-Tab Cache</span>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Licence</span>
          <span className={styles.metaValue}>MIT</span>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title}>Attribution &amp; Data Sources</h2>
        
        <div className={styles.tmdbBadge}>
          <div className={styles.tmdbTitle}>The Movie Database (TMDB)</div>
          <p className={styles.tmdbDesc}>
            This product uses the TMDB API but is not endorsed or certified by TMDB.
            All movie and television metadata, posters, cast photos, and provider links
            are supplied through TMDB.
          </p>
        </div>
      </div>
    </div>
  )
}
