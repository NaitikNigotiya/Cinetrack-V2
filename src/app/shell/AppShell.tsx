import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileTabBar } from './MobileTabBar'
import { ShortcutsModal } from './ShortcutsModal'
import { ToastContainer } from '@/shared/ui'
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
    </div>
  )
}
