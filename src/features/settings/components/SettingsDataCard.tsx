import { Database, Bell } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'

interface SettingsDataCardProps {
  onExport: () => void
  onRepairData: () => void
  isRepairing: boolean
  notificationsEnabled: boolean
  onToggleNotifications: () => void
  episodeAlerts: boolean
  onToggleEpisodeAlerts: () => void
  weeklyRecap: boolean
  onToggleWeeklyRecap: () => void
}

export function SettingsDataCard({
  onExport,
  onRepairData,
  isRepairing,
  notificationsEnabled,
  onToggleNotifications,
  episodeAlerts,
  onToggleEpisodeAlerts,
  weeklyRecap,
  onToggleWeeklyRecap,
}: SettingsDataCardProps) {
  return (
    <>
      <Card variant="default">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Database size={18} color="var(--brand-primary)" />
          <span style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>Data & Sync</span>
        </div>

        <div className="settings-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Cloud Sync Status</div>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
              Real-time synchronization with Firebase Firestore
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', background: '#2ECC71', borderRadius: '50%' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#2ECC71' }}>Connected</span>
          </div>
        </div>

        <div className="settings-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Repair My Data</div>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
              Recompute watch counts, total minutes, and statuses from watch journal events
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onRepairData} disabled={isRepairing}>
            {isRepairing ? 'Repairing...' : 'Repair my data'}
          </Button>
        </div>

        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Export Data</div>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
              Download your complete library data as JSON
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onExport}>
            Export JSON
          </Button>
        </div>
      </Card>

      <Card variant="default">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Bell size={18} color="var(--brand-primary)" />
          <span style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>Notifications</span>
        </div>

        <div className="settings-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Push Notifications</div>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
              Receive browser alerts for scheduled watches
            </div>
          </div>
          <div
            onClick={onToggleNotifications}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '999px',
              background: notificationsEnabled ? 'var(--brand-primary)' : 'var(--border-subtle)',
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

        <div
          className="settings-row"
          style={{
            opacity: notificationsEnabled ? 1 : 0.5,
            pointerEvents: notificationsEnabled ? 'auto' : 'none',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>New Episode Alerts</div>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
              Get notified when airing episodes become available
            </div>
          </div>
          <div
            onClick={onToggleEpisodeAlerts}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '999px',
              background: episodeAlerts ? 'var(--brand-primary)' : 'var(--border-subtle)',
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

        <div
          className="settings-row"
          style={{
            opacity: notificationsEnabled ? 1 : 0.5,
            pointerEvents: notificationsEnabled ? 'auto' : 'none',
            borderBottom: 'none',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Weekly Recap</div>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
              Summary of your viewing activity each week
            </div>
          </div>
          <div
            onClick={onToggleWeeklyRecap}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '999px',
              background: weeklyRecap ? 'var(--brand-primary)' : 'var(--border-subtle)',
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
      </Card>
    </>
  )
}
