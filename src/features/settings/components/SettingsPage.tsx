import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Palette,
  Settings,
  Database,
  Bell,
  User,
  Info,
  LogOut,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/services/firebase/auth'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useLibrary } from '@/features/library/hooks/useLibrary'
import { toast } from '@/shared/ui'

import './SettingsPage.css'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { entries } = useLibrary('all')

  // Theme & Appearance State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('cinetrack-theme') as any) || 'dark'
  )
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem('cinetrack-accent-color') || '#E50914'
  )
  const [ratingSystem, setRatingSystem] = useState(
    () => localStorage.getItem('cinetrack-rating-system') || 'ten'
  )

  // General State
  const [dateFormat, setDateFormat] = useState(
    () => localStorage.getItem('cinetrack-date-format') || 'DD/MM/YYYY'
  )
  const [timeFormat, setTimeFormat] = useState(
    () => localStorage.getItem('cinetrack-time-format') || '12h'
  )
  const [defaultStatus, setDefaultStatus] = useState(
    () => localStorage.getItem('cinetrack-default-status') || 'plan_to_watch'
  )
  const [spoilerFree, setSpoilerFree] = useState(
    () => localStorage.getItem('cinetrack-spoiler-free') === 'true'
  )

  // Notifications State
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [episodeAlerts, setEpisodeAlerts] = useState(false)
  const [weeklyRecap, setWeeklyRecap] = useState(false)

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cinetrack-theme', theme)
  }, [theme])

  // Sync accent color
  useEffect(() => {
    document.documentElement.style.setProperty('--color-brand', accentColor)
    localStorage.setItem('cinetrack-accent-color', accentColor)
  }, [accentColor])

  const handleDateFormatChange = (val: string) => {
    setDateFormat(val)
    localStorage.setItem('cinetrack-date-format', val)
    toast.success('Date format updated.')
  }

  const handleTimeFormatChange = (val: string) => {
    setTimeFormat(val)
    localStorage.setItem('cinetrack-time-format', val)
    toast.success('Time format updated.')
  }

  const handleDefaultStatusChange = (val: string) => {
    setDefaultStatus(val)
    localStorage.setItem('cinetrack-default-status', val)
    toast.success('Default status updated.')
  }

  const handleSpoilerFreeChange = (val: boolean) => {
    setSpoilerFree(val)
    localStorage.setItem('cinetrack-spoiler-free', String(val))
    toast.success(val ? 'Spoiler-free mode enabled.' : 'Spoiler-free mode disabled.')
  }

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(entries, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cinetrack-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Backup JSON downloaded.')
    } catch {
      toast.error('Failed to export data.')
    }
  }

  const handleSignOutClick = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        await signOut(auth)
        navigate('/login')
      } catch {
        toast.error('Failed to sign out.')
      }
    }
  }

  return (
    <div className="unified-page-container settings-page">
      <header className="unified-page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your preferences, appearance, and account</p>
        </div>
      </header>

      {/* ─── APPEARANCE SECTION ─── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Palette size={18} color="var(--color-brand, #e50914)" />
          <span className="settings-card-title">Appearance</span>
        </div>

        {/* Row 1: Theme */}
        <div className="settings-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Theme
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {theme === 'light' && 'IMDb-inspired warm theme'}
              {theme === 'dark' && 'Netflix-inspired dark theme'}
              {theme === 'system' && 'Follows system device settings'}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              background: 'var(--bg-elevated, #1a1c28)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '3px',
              gap: '2px',
              border: '1px solid var(--border-default, #2a2c3d)',
            }}
          >
            {[
              { value: 'light', label: '☀️ Light' },
              { value: 'system', label: '🌓 System' },
              { value: 'dark', label: '🌙 Dark' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: theme === opt.value ? 'var(--color-brand, #e50914)' : 'transparent',
                  color: theme === opt.value ? '#ffffff' : 'var(--text-muted, #7c7e93)',
                  transition: 'all 150ms ease',
                  whiteSpace: 'nowrap',
                }}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Accent Color */}
        <div className="settings-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Accent Color
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Customize the app's brand theme color
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['#E50914', '#F5C518', '#8B5CF6', '#2ECC71', '#00B4D8', '#FF6B6B'].map((color) => {
              const isSelected = accentColor === color
              return (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: color,
                    border: 'none',
                    cursor: 'pointer',
                    outline: isSelected ? '2px solid var(--text-primary, #ffffff)' : 'none',
                    outlineOffset: isSelected ? '2px' : '0px',
                    transform: isSelected ? 'scale(1.2)' : 'none',
                    transition: 'all 150ms ease',
                  }}
                  type="button"
                  aria-label={`Select accent color ${color}`}
                />
              )
            })}
          </div>
        </div>

        {/* Row 3: Rating System */}
        <div className="settings-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Rating Scale
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              How ratings are displayed
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              background: 'var(--bg-elevated, #1a1c28)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '3px',
              gap: '2px',
              border: '1px solid var(--border-default, #2a2c3d)',
            }}
          >
            {[
              { value: 'ten', label: '/10' },
              { value: 'five', label: '/5' },
              { value: 'half', label: '/5½' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setRatingSystem(opt.value)
                  localStorage.setItem('cinetrack-rating-system', opt.value)
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  background:
                    ratingSystem === opt.value ? 'var(--color-brand, #e50914)' : 'transparent',
                  color: ratingSystem === opt.value ? '#ffffff' : 'var(--text-muted, #7c7e93)',
                  transition: 'all 150ms ease',
                }}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── GENERAL SECTION ─── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Settings size={18} color="var(--color-brand, #e50914)" />
          <span className="settings-card-title">General</span>
        </div>

        {/* Row 1: Date Format */}
        <div className="settings-row settings-desktop-only">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Date Format
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-elevated, #1a1c28)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '3px',
              gap: '2px',
              border: '1px solid var(--border-default, #2a2c3d)',
            }}
          >
            {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleDateFormatChange(fmt)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: dateFormat === fmt ? 'var(--color-brand, #e50914)' : 'transparent',
                  color: dateFormat === fmt ? '#ffffff' : 'var(--text-muted, #7c7e93)',
                  transition: 'all 150ms ease',
                }}
                type="button"
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Time Format */}
        <div className="settings-row settings-desktop-only">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Time Format
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-elevated, #1a1c28)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '3px',
              gap: '2px',
              border: '1px solid var(--border-default, #2a2c3d)',
            }}
          >
            {['12h', '24h'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleTimeFormatChange(fmt)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: timeFormat === fmt ? 'var(--color-brand, #e50914)' : 'transparent',
                  color: timeFormat === fmt ? '#ffffff' : 'var(--text-muted, #7c7e93)',
                  transition: 'all 150ms ease',
                }}
                type="button"
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Default Status */}
        <div className="settings-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Default Status
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Status selected when adding new titles to library
            </div>
          </div>
          <select
            value={defaultStatus}
            onChange={(e) => handleDefaultStatusChange(e.target.value)}
            className="cinetrack-select"
          >
            <option value="plan_to_watch">Plan to Watch</option>
            <option value="watching">Watching</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Row 4: Spoiler-Free Mode */}
        <div className="settings-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Spoiler-Free Mode
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Hides episode titles and synopses in the episode tracker
            </div>
          </div>
          <div
            onClick={() => handleSpoilerFreeChange(!spoilerFree)}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '999px',
              background: spoilerFree ? 'var(--color-brand, #e50914)' : 'var(--border-default, #2a2c3d)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 200ms ease',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: spoilerFree ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 200ms ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── DATA & SYNC SECTION ─── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Database size={18} color="var(--color-brand, #e50914)" />
          <span className="settings-card-title">Data & Sync</span>
        </div>

        {/* Row 1: Sync Status */}
        <div className="settings-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Cloud Sync Status
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Real-time synchronization with Firebase Firestore
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                background: '#2ECC71',
                borderRadius: '50%',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#2ECC71' }}>
              Connected
            </span>
          </div>
        </div>

        {/* Row 2: Export Data */}
        <div className="settings-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Export Data
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Download your complete library data as JSON
            </div>
          </div>
          <button
            onClick={handleExport}
            className="cinetrack-select"
            style={{ cursor: 'pointer' }}
            type="button"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* ─── NOTIFICATIONS SECTION ─── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Bell size={18} color="var(--color-brand, #e50914)" />
          <span className="settings-card-title">Notifications</span>
        </div>

        {/* Row 1: Push Notifications */}
        <div className="settings-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Push Notifications
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Receive browser alerts for scheduled watches
            </div>
          </div>
          <div
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '999px',
              background: notificationsEnabled ? 'var(--color-brand, #e50914)' : 'var(--border-default, #2a2c3d)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 200ms ease',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: notificationsEnabled ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 200ms ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>

        {/* Row 2: Episode Alerts */}
        <div
          className="settings-row"
          style={{
            opacity: notificationsEnabled ? 1 : 0.5,
            pointerEvents: notificationsEnabled ? 'auto' : 'none',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              New Episode Alerts
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Get notified when airing episodes become available
            </div>
          </div>
          <div
            onClick={() => setEpisodeAlerts(!episodeAlerts)}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '999px',
              background: episodeAlerts ? 'var(--color-brand, #e50914)' : 'var(--border-default, #2a2c3d)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 200ms ease',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: episodeAlerts ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 200ms ease',
              }}
            />
          </div>
        </div>

        {/* Row 3: Weekly Recap */}
        <div
          className="settings-row"
          style={{
            opacity: notificationsEnabled ? 1 : 0.5,
            pointerEvents: notificationsEnabled ? 'auto' : 'none',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Weekly Recap
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Summary of your viewing activity each week
            </div>
          </div>
          <div
            onClick={() => setWeeklyRecap(!weeklyRecap)}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '999px',
              background: weeklyRecap ? 'var(--color-brand, #e50914)' : 'var(--border-default, #2a2c3d)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 200ms ease',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: weeklyRecap ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 200ms ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── ACCOUNT SECTION ─── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <User size={18} color="var(--color-brand, #e50914)" />
          <span className="settings-card-title">Account</span>
        </div>

        <div className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--bg-elevated, #1a1c28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: 'var(--text-primary, #ffffff)',
                }}
              >
                {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.displayName || 'CineTrack User'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {user?.email || 'Anonymous Session'}
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOutClick}
            style={{
              padding: '10px 18px',
              background: 'rgba(229,9,20,0.1)',
              border: '1px solid rgba(229,9,20,0.3)',
              borderRadius: 'var(--radius-md, 8px)',
              color: 'var(--color-brand, #e50914)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            type="button"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {/* ─── ABOUT SECTION ─── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Info size={18} color="var(--color-brand, #e50914)" />
          <span className="settings-card-title">About</span>
        </div>

        <div className="settings-row">
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Version
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Cinetrack V2.0</div>
        </div>

        <div className="settings-row">
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Tech Stack
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            React 19 · TypeScript · Firebase · TMDb · Vite PWA
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: '1.6',
              margin: 0,
            }}
          >
            This product uses the TMDB API but is not endorsed or certified by TMDB. All movie and TV show data & imagery are provided by TMDB.
          </p>
        </div>
      </div>
    </div>
  )
}
