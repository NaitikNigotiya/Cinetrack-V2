import { Database } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'

interface SettingsDataCardProps {
  onExport: () => void
  onRepairData: () => void
  isRepairing: boolean
}

export function SettingsDataCard({
  onExport,
  onRepairData,
  isRepairing,
}: SettingsDataCardProps) {
  return (
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
  )
}

