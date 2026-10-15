import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Trash2, Smartphone } from 'lucide-react'
import { POPULAR_GENRES } from '@/features/discover/constants/genres'
import {
  fetchPushPreferences,
  updatePushPreferences,
  fetchRegisteredTokens,
  unregisterPushToken,
} from '@/features/notifications/api/pushApi'
import { toast } from '@/shared/ui/Toast/toastStore'
import styles from './NotificationSettingsSection.module.css'

interface NotificationSettingsSectionProps {
  uid: string
}

export function NotificationSettingsSection({ uid }: NotificationSettingsSectionProps) {
  const queryClient = useQueryClient()
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  const prefsQuery = useQuery({
    queryKey: ['settings', 'push', uid],
    queryFn: () => fetchPushPreferences(uid),
    enabled: Boolean(uid),
  })

  const tokensQuery = useQuery({
    queryKey: ['settings', 'pushTokens', uid],
    queryFn: () => fetchRegisteredTokens(uid),
    enabled: Boolean(uid),
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Parameters<typeof updatePushPreferences>[1]) =>
      updatePushPreferences(uid, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'push', uid] })
      toast.success('Notification preferences updated.')
    },
    onError: () => {
      toast.error('Failed to update notification preferences.')
    },
  })

  const deleteTokenMutation = useMutation({
    mutationFn: (tokenHash: string) => unregisterPushToken(uid, tokenHash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'pushTokens', uid] })
      toast.info('Device unregistered.')
    },
  })

  async function handleMasterToggle() {
    if (!prefsQuery.data) return
    const currentState = prefsQuery.data.pushEnabled

    if (!currentState) {
      if (typeof Notification !== 'undefined') {
        setIsRequestingPermission(true)
        const permission = await Notification.requestPermission()
        setIsRequestingPermission(false)
        if (permission === 'denied') {
          toast.warning('Notifications are blocked by your browser. Please enable them in site settings.')
          return
        }
      }
    }

    updateMutation.mutate({ pushEnabled: !currentState })
  }

  function handleGenreToggle(genreId: number) {
    if (!prefsQuery.data) return
    const current = prefsQuery.data.genres
    const next = current.includes(genreId)
      ? current.filter((id) => id !== genreId)
      : [...current, genreId]
    updateMutation.mutate({ genres: next })
  }

  function sendTestNotification() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('CineTrack Test Notification', {
        body: 'Push notifications are successfully configured on this device!',
        icon: '/pwa-192x192.svg',
      })
      toast.success('Test notification sent!')
    } else {
      toast.info('Please enable notifications to receive desktop/mobile alerts.')
    }
  }

  const prefs = prefsQuery.data

  return (
    <div className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.title}>Release Notifications</h2>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.label}>Enable New Release Digests</div>
            <div className={styles.sublabel}>
              Receive daily notifications about new releases matching your favourite genres
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={prefs?.pushEnabled ?? false}
            className={`${styles.switch} ${prefs?.pushEnabled ? styles.switchActive : ''}`}
            onClick={handleMasterToggle}
            disabled={isRequestingPermission}
          >
            <div className={styles.switchThumb} />
          </button>
        </div>

        {prefs?.pushEnabled && (
          <>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.label}>Include TV Show Airings</div>
                <div className={styles.sublabel}>
                  Get alerted when shows in your "Currently Watching" list air a new episode
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={prefs.includeTv}
                className={`${styles.switch} ${prefs.includeTv ? styles.switchActive : ''}`}
                onClick={() => updateMutation.mutate({ includeTv: !prefs.includeTv })}
              >
                <div className={styles.switchThumb} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="digest-hour-select" className={styles.label}>
                Preferred Delivery Time (Local Time)
              </label>
              <select
                id="digest-hour-select"
                className={styles.select}
                value={prefs.digestHourLocal}
                onChange={(e) =>
                  updateMutation.mutate({ digestHourLocal: parseInt(e.target.value, 10) })
                }
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00 {h < 12 ? 'AM' : 'PM'}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.label}>Notification Genres</div>
              <div className={styles.sublabel}>
                Select the genres you want to be alerted about
              </div>

              <div className={styles.genreGrid}>
                {POPULAR_GENRES.map((g) => {
                  const isSelected = prefs.genres.includes(g.id)
                  return (
                    <button
                      key={g.id}
                      type="button"
                      className={`${styles.genreChip} ${isSelected ? styles.genreSelected : ''}`}
                      onClick={() => handleGenreToggle(g.id)}
                    >
                      {g.emoji} {g.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={styles.formGroup}>
              <button type="button" className={styles.testBtn} onClick={sendTestNotification}>
                <Bell size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Send Me a Test Notification
              </button>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.label}>Registered Devices</div>
              <div className={styles.sublabel}>
                Active browsers registered to receive push updates
              </div>

              <div className={styles.deviceList}>
                {tokensQuery.data?.length === 0 ? (
                  <div className={styles.sublabel}>No registered devices found.</div>
                ) : (
                  tokensQuery.data?.map((dev) => (
                    <div key={dev.tokenHash} className={styles.deviceItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Smartphone size={16} />
                        <span>{dev.deviceLabel}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.removeDeviceBtn}
                        onClick={() => deleteTokenMutation.mutate(dev.tokenHash)}
                        aria-label="Remove device"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
