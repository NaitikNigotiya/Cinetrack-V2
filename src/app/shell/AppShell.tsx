import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileTabBar } from './MobileTabBar'
import { ShortcutsModal } from './ShortcutsModal'
import { ToastContainer } from '@/shared/ui'
import { OfflineBanner } from '@/shared/ui/Offline/OfflineBanner'
import { ReloadPrompt } from '@/shared/ui/Pwa/ReloadPrompt'
import styles from './AppShell.module.css'

export function AppShell() {
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)

  // Global key combo listeners: 'g h', 'g l', 'g s', '?'
  useEffect(() => {
    let lastKey = ''
    let lastKeyTime = 0

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const now = Date.now()

      if (e.key === '?') {
        e.preventDefault()
        setIsShortcutsOpen((prev) => !prev)
        return
      }

      if (lastKey === 'g' && now - lastKeyTime < 1000) {
        if (e.key === 'h') {
          e.preventDefault()
          navigate('/')
        } else if (e.key === 'l') {
          e.preventDefault()
          navigate('/library')
        } else if (e.key === 's') {
          e.preventDefault()
          navigate('/search')
        }
        lastKey = ''
        return
      }

      lastKey = e.key
      lastKeyTime = now
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return (
    <div className={styles.shell}>
      <OfflineBanner />
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={styles.mainWrapper}>
        <TopBar onOpenShortcuts={() => setIsShortcutsOpen(true)} />
        <main id="main-content" className={styles.content}>
          <Outlet />
        </main>
        <footer className={styles.footer} role="contentinfo">
          <div className={styles.footerContent}>
            <div className={styles.footerAttribution}>
              <img src="/tmdb-logo.svg" alt="TMDB Logo" style={{ height: '14px', opacity: 0.85 }} />
              <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
            </div>
            <div className={styles.footerMeta}>
              <span>CineTrack v2.0 • Offline Ready</span>
            </div>
          </div>
        </footer>
      </div>

      <MobileTabBar />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <ToastContainer />
      <ReloadPrompt />
    </div>
  )
}
