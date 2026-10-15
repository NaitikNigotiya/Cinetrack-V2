import { NavLink } from 'react-router-dom'
import {
  Home,
  Search,
  Compass,
  Film,
  FolderHeart,
  History,
  Calendar,
  Star,
  FileText,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { signOutUser } from '@/services/firebase/auth'
import { IconButton } from '@/shared/ui'
import clsx from 'clsx'
import styles from './Sidebar.module.css'

interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user, profile } = useAuthStore()

  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <aside className={clsx(styles.sidebar, isCollapsed && styles.sidebarCollapsed)}>
      <div className={styles.brand}>
        {!isCollapsed && <span className={styles.logo}>CineTrack</span>}
        <IconButton
          icon={isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
        />
      </div>

      <nav className={styles.nav} aria-label="Main Navigation">
        {/* MAIN GROUP */}
        <div className={styles.group}>
          {!isCollapsed && <span className={styles.groupTitle}>Main</span>}
          <NavLink
            to="/"
            end
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
            title="Home"
          >
            <Home size={18} />
            {!isCollapsed && <span>Home</span>}
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
            title="Search"
          >
            <Search size={18} />
            {!isCollapsed && <span>Search</span>}
          </NavLink>
          <NavLink
            to="/discover"
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
            title="Discover"
          >
            <Compass size={18} />
            {!isCollapsed && <span>Discover</span>}
          </NavLink>
        </div>

        {/* LIBRARY GROUP */}
        <div className={styles.group}>
          {!isCollapsed && <span className={styles.groupTitle}>Library</span>}
          <NavLink
            to="/library"
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
            title="Library"
          >
            <Film size={18} />
            {!isCollapsed && <span>Library</span>}
          </NavLink>
          <NavLink
            to="/collections"
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
            title="Collections"
          >
            <FolderHeart size={18} />
            {!isCollapsed && <span>Collections</span>}
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
            title="History"
          >
            <History size={18} />
            {!isCollapsed && <span>History</span>}
          </NavLink>
        </div>

        {/* TRACK GROUP */}
        <div className={styles.group}>
          {!isCollapsed && <span className={styles.groupTitle}>Track</span>}
          <NavLink
            to="/calendar"
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
            title="Calendar"
          >
            <Calendar size={18} />
            {!isCollapsed && <span>Calendar</span>}
          </NavLink>
          <NavLink
            to="/reviews"
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
            title="Reviews"
          >
            <Star size={18} />
            {!isCollapsed && <span>Reviews</span>}
          </NavLink>
          <NavLink
            to="/notes"
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
            title="Notes"
          >
            <FileText size={18} />
            {!isCollapsed && <span>Notes</span>}
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
            title="Analytics"
          >
            <BarChart2 size={18} />
            {!isCollapsed && <span>Analytics</span>}
          </NavLink>
        </div>
      </nav>

      {/* FOOTER */}
      <div className={styles.footer}>
        <NavLink
          to="/settings"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
          title="Settings"
        >
          <Settings size={18} />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>

        <div className={styles.userProfile}>
          <div className={styles.avatar}>{initials}</div>
          {!isCollapsed && (
            <div className={styles.userInfo}>
              <div className={styles.userName}>{displayName}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          )}
          {!isCollapsed && (
            <IconButton
              icon={<LogOut size={16} />}
              aria-label="Sign out"
              variant="ghost"
              size="sm"
              onClick={() => signOutUser()}
            />
          )}
        </div>
      </div>
    </aside>
  )
}
