import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sun, Moon, Bell, HelpCircle } from 'lucide-react'
import { IconButton } from '@/shared/ui'
import styles from './TopBar.module.css'

interface TopBarProps {
  onOpenShortcuts: () => void
}

export function TopBar({ onOpenShortcuts }: TopBarProps) {
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
    }
    return 'dark'
  })
  const [searchVal, setSearchVal] = useState('')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('cinetrack_theme', next)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`)
    }
  }

  // Keyboard shortcut listener for '/' to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  return (
    <header className={styles.topBar}>
      <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
        <span className={styles.searchIcon} aria-hidden="true">
          <Search size={16} />
        </span>
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Search movies, TV shows..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className={styles.searchInput}
          aria-label="Search titles"
        />
        <kbd className={styles.shortcutKbd} aria-hidden="true">/</kbd>
      </form>

      <div className={styles.actions}>
        <IconButton
          icon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
        />

        <IconButton
          icon={<Bell size={18} />}
          aria-label="Notifications"
          variant="ghost"
          size="sm"
          onClick={() => navigate('/settings')}
        />

        <IconButton
          icon={<HelpCircle size={18} />}
          aria-label="Keyboard shortcuts"
          variant="ghost"
          size="sm"
          onClick={onOpenShortcuts}
        />
      </div>
    </header>
  )
}
