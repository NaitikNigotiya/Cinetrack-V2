import { useSearchParams } from 'react-router-dom'
import {
  User,
  Palette,
  Film,
  Database,
  Info,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { AccountSection } from './AccountSection'
import { AppearanceSection } from './AppearanceSection'
import { LibrarySettingsSection } from './LibrarySettingsSection'
import { DataToolsSection } from './DataToolsSection'
import { AboutSection } from './AboutSection'
import styles from './SettingsPage.module.css'

type SettingsTab = 'account' | 'appearance' | 'library' | 'data' | 'about'

interface TabDefinition {
  id: SettingsTab
  label: string
  icon: typeof User
}

const TABS: TabDefinition[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'library', label: 'Library', icon: Film },
  { id: 'data', label: 'Data & Backup', icon: Database },
  { id: 'about', label: 'About', icon: Info },
]

export default function SettingsPage() {
  const { user } = useAuthStore()
  const uid = user?.uid ?? ''
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = (searchParams.get('tab') as SettingsTab) || 'account'

  function handleTabChange(tab: SettingsTab) {
    setSearchParams({ tab })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Manage your account profile, visual themes and data backups
        </p>
      </div>

      <nav className={styles.tabsWrapper} role="tablist" aria-label="Settings categories">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <div className={styles.tabContent} role="tabpanel">
        {activeTab === 'account' && <AccountSection />}
        {activeTab === 'appearance' && <AppearanceSection />}
        {activeTab === 'library' && <LibrarySettingsSection />}
        {activeTab === 'data' && <DataToolsSection uid={uid} />}
        {activeTab === 'about' && <AboutSection />}
      </div>
    </div>
  )
}
