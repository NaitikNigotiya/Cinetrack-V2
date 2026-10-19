import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileTabBar } from './MobileTabBar'
import { ShortcutsModal } from './ShortcutsModal'
import { ToastContainer } from '@/shared/ui'
import { OfflineBanner } from '@/shared/ui/Offline/OfflineBanner'
import { ReloadPrompt } from '@/shared/ui/Pwa/ReloadPrompt'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useAppStore, subscribeUserData } from '@/domain/store'
import styles from './AppShell.module.css'

export function AppShell() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { error } = useAppStore()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)

  // Real-time user data subscription (single source of truth for library, history, collections)
  useEffect(() => {
    if (!user?.uid) return
    const unsub = subscribeUserData(user.uid)
    return () => unsub()
  }, [user?.uid])

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
      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--status-dropped, #ef4444)',
            color: '#fff',
            padding: '8px 16px',
            fontSize: 'var(--fs-small, 13px)',
            fontWeight: 600,
            textAlign: 'center',
            zIndex: 1000,
          }}
        >
          Data synchronization issue: {error.message}. Please check your connection.
        </div>
      )}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={styles.mainWrapper}>
        <TopBar onOpenShortcuts={() => setIsShortcutsOpen(true)} />
        <main id="main-content" className={styles.content}>
          <Outlet />
        </main>
      </div>

      <MobileTabBar />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <ToastContainer />
      <ReloadPrompt />
    </div>
  )
}
