import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home,
  Search,
  Film,
  Calendar,
  MoreHorizontal,
  Compass,
  FolderHeart,
  History,
  Star,
  FileText,
  BarChart2,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { signOutUser } from '@/services/firebase/auth'
import clsx from 'clsx'
import styles from './MobileTabBar.module.css'

export function MobileTabBar() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <>
      <nav className={styles.tabBar} aria-label="Mobile Navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) => clsx(styles.tabItem, isActive && styles.tabItemActive)}
        >
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) => clsx(styles.tabItem, isActive && styles.tabItemActive)}
        >
          <Search size={20} />
          <span>Search</span>
        </NavLink>

        <NavLink
          to="/library"
          className={({ isActive }) => clsx(styles.tabItem, isActive && styles.tabItemActive)}
        >
          <Film size={20} />
          <span>Library</span>
        </NavLink>

        <NavLink
          to="/calendar"
          className={({ isActive }) => clsx(styles.tabItem, isActive && styles.tabItemActive)}
        >
          <Calendar size={20} />
          <span>Calendar</span>
        </NavLink>

        <button
          type="button"
          className={clsx(styles.tabItem, isSheetOpen && styles.tabItemActive)}
          onClick={() => setIsSheetOpen(!isSheetOpen)}
          aria-expanded={isSheetOpen}
          aria-label="More navigation options"
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* More Bottom Sheet */}
      {isSheetOpen && (
        <div className={styles.sheetBackdrop} onClick={() => setIsSheetOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dragHandle} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--font-size-md)' }}>Menu</span>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.sheetGrid}>
              <NavLink to="/discover" className={styles.sheetBtn ?? ''} onClick={() => setIsSheetOpen(false)}>
                <Compass size={24} color="var(--accent)" />
                <span>Discover</span>
              </NavLink>
              <NavLink to="/collections" className={styles.sheetBtn ?? ''} onClick={() => setIsSheetOpen(false)}>
                <FolderHeart size={24} color="var(--accent)" />
                <span>Collections</span>
              </NavLink>
              <NavLink to="/history" className={styles.sheetBtn ?? ''} onClick={() => setIsSheetOpen(false)}>
                <History size={24} color="var(--accent)" />
                <span>History</span>
              </NavLink>
              <NavLink to="/reviews" className={styles.sheetBtn ?? ''} onClick={() => setIsSheetOpen(false)}>
                <Star size={24} color="var(--star-filled)" />
                <span>Reviews</span>
              </NavLink>
              <NavLink to="/notes" className={styles.sheetBtn ?? ''} onClick={() => setIsSheetOpen(false)}>
                <FileText size={24} color="var(--info)" />
                <span>Notes</span>
              </NavLink>
              <NavLink to="/analytics" className={styles.sheetBtn ?? ''} onClick={() => setIsSheetOpen(false)}>
                <BarChart2 size={24} color="var(--success)" />
                <span>Analytics</span>
              </NavLink>
              <NavLink to="/settings" className={styles.sheetBtn ?? ''} onClick={() => setIsSheetOpen(false)}>
                <Settings size={24} color="var(--text-2)" />
                <span>Settings</span>
              </NavLink>
              <button
                type="button"
                className={styles.sheetBtn}
                onClick={() => {
                  setIsSheetOpen(false)
                  signOutUser()
                }}
              >
                <LogOut size={24} color="var(--danger)" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
