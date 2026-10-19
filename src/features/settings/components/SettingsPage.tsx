import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/services/firebase/auth'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useAppStore } from '@/domain/store'
import { repairAllLibraryData } from '@/domain/operations'
import { toast } from '@/shared/ui'
import { PageShell } from '@/shared/ui/layout/PageShell'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { SettingsAppearanceCard } from './SettingsAppearanceCard'
import { SettingsGeneralCard } from './SettingsGeneralCard'
import { SettingsDataCard } from './SettingsDataCard'
import { SettingsAccountCard } from './SettingsAccountCard'

import './SettingsPage.css'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const entries = useAppStore((state) => state.library)

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('cinetrack-theme') as any) || 'dark'
  )
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem('cinetrack-accent-color') || '#E50914'
  )
  const [ratingSystem, setRatingSystem] = useState(
    () => localStorage.getItem('cinetrack-rating-system') || 'ten'
  )

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

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [episodeAlerts, setEpisodeAlerts] = useState(false)
  const [weeklyRecap, setWeeklyRecap] = useState(false)
  const [isRepairing, setIsRepairing] = useState(false)

  const handleRepairData = async () => {
    if (!user?.uid) return
    setIsRepairing(true)
    try {
      const repairedCount = await repairAllLibraryData(user.uid)
      toast.success(`Data repair complete! Recomputed ${repairedCount} library titles.`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to repair data')
    } finally {
      setIsRepairing(false)
    }
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cinetrack-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', accentColor)
    localStorage.setItem('cinetrack-accent-color', accentColor)
  }, [accentColor])

  useEffect(() => {
    localStorage.setItem('cinetrack-rating-system', ratingSystem)
  }, [ratingSystem])

  const handleDateFormatChange = (val: string) => {
    setDateFormat(val)
    localStorage.setItem('cinetrack-date-format', val)
    toast.success(`Date format updated to ${val}`)
  }

  const handleTimeFormatChange = (val: string) => {
    setTimeFormat(val)
    localStorage.setItem('cinetrack-time-format', val)
    toast.success(`Time format updated to ${val}`)
  }

  const handleDefaultStatusChange = (val: string) => {
    setDefaultStatus(val)
    localStorage.setItem('cinetrack-default-status', val)
    toast.success('Default watch status updated')
  }

  const handleSpoilerFreeChange = (val: boolean) => {
    setSpoilerFree(val)
    localStorage.setItem('cinetrack-spoiler-free', String(val))
    toast.success(val ? 'Spoiler-free mode enabled' : 'Spoiler-free mode disabled')
  }

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `cinetrack-library-backup-${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    toast.success('Library data downloaded as JSON')
  }

  const handleSignOutClick = async () => {
    try {
      await signOut(auth)
      toast.success('Signed out')
      navigate('/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="PREFERENCES"
        title="Settings"
        subtitle="Manage your preferences, appearance, and account"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
        <SettingsAppearanceCard
          theme={theme}
          setTheme={setTheme}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          ratingSystem={ratingSystem}
          setRatingSystem={setRatingSystem}
        />

        <SettingsGeneralCard
          dateFormat={dateFormat}
          onDateFormatChange={handleDateFormatChange}
          timeFormat={timeFormat}
          onTimeFormatChange={handleTimeFormatChange}
          defaultStatus={defaultStatus}
          onDefaultStatusChange={handleDefaultStatusChange}
          spoilerFree={spoilerFree}
          onSpoilerFreeChange={handleSpoilerFreeChange}
        />

        <SettingsDataCard
          onExport={handleExport}
          onRepairData={handleRepairData}
          isRepairing={isRepairing}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)}
          episodeAlerts={episodeAlerts}
          onToggleEpisodeAlerts={() => setEpisodeAlerts(!episodeAlerts)}
          weeklyRecap={weeklyRecap}
          onToggleWeeklyRecap={() => setWeeklyRecap(!weeklyRecap)}
        />

        <SettingsAccountCard
          user={user}
          onSignOut={handleSignOutClick}
        />
      </div>
    </PageShell>
  )
}
