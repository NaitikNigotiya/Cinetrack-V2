import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import styles from './AppearanceSection.module.css'

export type ThemeChoice = 'dark' | 'light' | 'system'

export function AppearanceSection() {
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    if (typeof localStorage === 'undefined') return 'dark'
    const saved = localStorage.getItem('cinetrack_theme')
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    return 'dark'
  })

  const [compactCards, setCompactCards] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem('cinetrack_compact') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('cinetrack_theme', theme)
    let appliedTheme = theme
    if (theme === 'system') {
      appliedTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    document.documentElement.setAttribute('data-theme', appliedTheme)
    const meta = document.getElementById('theme-color-meta')
    if (meta) {
      meta.setAttribute('content', appliedTheme === 'dark' ? '#121214' : '#f5f5f7')
    }
  }, [theme])

  function handleCompactToggle() {
    const next = !compactCards
    setCompactCards(next)
    localStorage.setItem('cinetrack_compact', String(next))
  }

  return (
    <div className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.title}>Theme &amp; Appearance</h2>

        <div className={styles.themeGrid}>
          <button
            type="button"
            className={`${styles.themeOption} ${theme === 'dark' ? styles.selected : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={22} />
            <span className={styles.themeLabel}>Dark</span>
          </button>

          <button
            type="button"
            className={`${styles.themeOption} ${theme === 'light' ? styles.selected : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={22} />
            <span className={styles.themeLabel}>Light</span>
          </button>

          <button
            type="button"
            className={`${styles.themeOption} ${theme === 'system' ? styles.selected : ''}`}
            onClick={() => setTheme('system')}
          >
            <Monitor size={22} />
            <span className={styles.themeLabel}>System</span>
          </button>
        </div>

        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <span className={styles.toggleTitle}>Compact Poster Cards</span>
            <span className={styles.toggleDesc}>Display denser poster grid with smaller card padding</span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={compactCards}
            className={`${styles.switch} ${compactCards ? styles.switchActive : ''}`}
            onClick={handleCompactToggle}
          >
            <div className={styles.switchThumb} />
          </button>
        </div>
      </div>
    </div>
  )
}
