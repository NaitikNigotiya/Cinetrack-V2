import { useState } from 'react'
import { deleteUser } from 'firebase/auth'
import { collection, getDocs, writeBatch } from 'firebase/firestore'
import { auth, signOutUser } from '@/services/firebase/auth'
import { firestore } from '@/services/firebase/db'
import { useAuthStore } from '@/features/auth/store/authStore'
import { ConfirmDialog } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast/toastStore'
import styles from './AccountSection.module.css'

export function AccountSection() {
  const { user } = useAuthStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleSignOut() {
    try {
      await signOutUser()
      toast.info('Signed out successfully.')
    } catch {
      toast.error('Failed to sign out.')
    }
  }

  async function handleDeleteAccount() {
    if (!user) return
    setIsDeleting(true)

    try {
      // 1. Delete user collections in Firestore
      const collectionsToDelete = ['library', 'history', 'reviews', 'notes', 'collections', 'plannedWatches']
      for (const colName of collectionsToDelete) {
        const snap = await getDocs(collection(firestore, `users/${user.uid}/${colName}`))
        if (!snap.empty) {
          const batch = writeBatch(firestore)
          snap.docs.forEach((d) => batch.delete(d.ref))
          await batch.commit()
        }
      }

      // 2. Delete the Firebase Auth user
      if (auth.currentUser) {
        await deleteUser(auth.currentUser)
      }

      toast.info('Account and data deleted.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed'
      toast.error(msg.includes('requires-recent-login')
        ? 'Please re-authenticate to delete your account.'
        : 'Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.title}>Account Information</h2>
        <div className={styles.row}>
          <span className={styles.label}>Email Address</span>
          <span className={styles.value}>{user?.email || 'Anonymous'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>User ID</span>
          <span className={styles.value} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {user?.uid || '—'}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Session</span>
          <button type="button" className={styles.signOutBtn} onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div className={styles.dangerCard}>
        <h2 className={styles.dangerTitle}>Danger Zone</h2>
        <p className={styles.dangerDesc}>
          Permanently delete your CineTrack account, watch history, library entries, reviews, and personal notes.
          This action is irreversible.
        </p>
        <button
          type="button"
          className={styles.dangerBtn}
          onClick={() => {
            setDeleteConfirmationText('')
            setShowDeleteConfirm(true)
          }}
        >
          Delete Account
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Confirm Account Deletion"
        message={
          <div>
            <p style={{ margin: '0 0 12px 0' }}>
              To confirm deletion of your account and all associated data, please type <strong>DELETE</strong> below:
            </p>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        }
        confirmLabel={isDeleting ? 'Deleting...' : 'Permanently Delete'}
        variant="danger"
        confirmDisabled={deleteConfirmationText !== 'DELETE' || isDeleting}
        onConfirm={handleDeleteAccount}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
