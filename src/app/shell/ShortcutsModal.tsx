import { Dialog } from '@/shared/ui'

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: '/', description: 'Focus search bar' },
  { key: 'g h', description: 'Go to Home' },
  { key: 'g l', description: 'Go to Library' },
  { key: 'g s', description: 'Go to Search' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close modals & dialogs' },
]

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {SHORTCUTS.map((s) => (
          <div
            key={s.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ color: 'var(--text-2)', fontSize: 'var(--font-size-sm)' }}>
              {s.description}
            </span>
            <kbd
              style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--surface-overlay)',
                border: '1px solid var(--border-strong)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-1)',
                fontWeight: 600,
              }}
            >
              {s.key}
            </kbd>
          </div>
        ))}
      </div>
    </Dialog>
  )
}
