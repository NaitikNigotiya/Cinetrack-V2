import { Settings as SettingsIcon } from 'lucide-react'
import { Card } from '@/shared/ui/layout/Card'
import { Button } from '@/shared/ui/Button/Button'

interface SettingsGeneralCardProps {
  dateFormat: string
  onDateFormatChange: (fmt: string) => void
  timeFormat: string
  onTimeFormatChange: (fmt: string) => void
  defaultStatus: string
  onDefaultStatusChange: (status: string) => void
  spoilerFree: boolean
  onSpoilerFreeChange: (val: boolean) => void
}

export function SettingsGeneralCard({
  dateFormat,
  onDateFormatChange,
  timeFormat,
  onTimeFormatChange,
  defaultStatus,
  onDefaultStatusChange,
  spoilerFree,
  onSpoilerFreeChange,
}: SettingsGeneralCardProps) {
  return (
    <Card variant="default">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <SettingsIcon size={18} color="var(--brand-primary)" />
        <span style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700 }}>General</span>
      </div>

      {/* Row 1: Date Format */}
      <div className="settings-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Date Format</div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((fmt) => (
            <Button
              key={fmt}
              variant={dateFormat === fmt ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onDateFormatChange(fmt)}
            >
              {fmt}
            </Button>
          ))}
        </div>
      </div>

      {/* Row 2: Time Format */}
      <div className="settings-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Time Format</div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['12h', '24h'].map((fmt) => (
            <Button
              key={fmt}
              variant={timeFormat === fmt ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onTimeFormatChange(fmt)}
            >
              {fmt}
            </Button>
          ))}
        </div>
      </div>

      {/* Row 3: Default Status */}
      <div className="settings-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Default Status</div>
          <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
            Status selected when adding new titles to library
          </div>
        </div>
        <select
          value={defaultStatus}
          onChange={(e) => onDefaultStatusChange(e.target.value)}
          className="cinetrack-select"
        >
          <option value="plan_to_watch">Plan to Watch</option>
          <option value="watching">Watching</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Row 4: Spoiler-Free Mode */}
      <div className="settings-row" style={{ borderBottom: 'none' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Spoiler-Free Mode</div>
          <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginTop: '2px' }}>
            Hides episode titles and synopses in the episode tracker
          </div>
        </div>
        <div
          onClick={() => onSpoilerFreeChange(!spoilerFree)}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '999px',
            background: spoilerFree ? 'var(--brand-primary)' : 'var(--border-subtle)',
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
    </Card>
  )
}
