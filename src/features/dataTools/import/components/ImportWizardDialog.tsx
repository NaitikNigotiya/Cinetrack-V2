import { useState, useRef } from 'react'
import { X, UploadCloud, CheckCircle2, Film } from 'lucide-react'
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { firestore } from '@/services/firebase/db'
import { recomputeStats } from '@/features/analytics/api/analyticsApi'
import { toast } from '@/shared/ui/Toast/toastStore'
import { parseCinetrackJson } from '../parsers/cinetrackJsonParser'
import { parseLetterboxdCsv } from '../parsers/letterboxdCsvParser'
import type { ParsedImportPayload } from '../importTypes'
import styles from './ImportWizardDialog.module.css'

interface ImportWizardDialogProps {
  isOpen: boolean
  onClose: () => void
  uid: string
  onImportComplete?: () => void
}

type Step = 'select' | 'preview' | 'importing' | 'complete'

export function ImportWizardDialog({
  isOpen,
  onClose,
  uid,
  onImportComplete,
}: ImportWizardDialogProps) {
  const [step, setStep] = useState<Step>('select')
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<ParsedImportPayload | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  async function handleFile(file: File) {
    setError(null)
    try {
      const text = await file.text()
      if (file.name.endsWith('.json') || text.trim().startsWith('{')) {
        const parsed = parseCinetrackJson(text)
        setPayload(parsed)
        setStep('preview')
      } else {
        const items = parseLetterboxdCsv(text)
        setPayload({
          format: 'letterboxd_csv',
          titles: items,
          reviewsCount: 0,
          notesCount: 0,
          collectionsCount: 0,
        })
        setStep('preview')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file format'
      setError(msg)
    }
  }

  async function executeImport() {
    if (!payload || !uid) return
    setStep('importing')
    setProgress(10)

    try {
      const titles = payload.titles
      const batchSize = 250

      for (let i = 0; i < titles.length; i += batchSize) {
        const chunk = titles.slice(i, i + batchSize)
        const batch = writeBatch(firestore)

        chunk.forEach((item, idx) => {
          // Generate deterministic key based on title & year
          const slug = item.title.toLowerCase().replace(/[^a-z0-9]/g, '')
          const titleKey = `${item.type}:${slug}_${item.year || 'na'}_${i + idx}`
          const ref = doc(firestore, `users/${uid}/library/${titleKey}`)

          batch.set(
            ref,
            {
              titleKey,
              title: item.title,
              type: item.type,
              status: item.status,
              year: item.year,
              rating: item.rating ?? null,
              favorite: false,
              watchedAt: item.watchedAt ?? null,
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
            },
            { merge: true }
          )
        })

        await batch.commit()
        setProgress(Math.round(((i + chunk.length) / titles.length) * 80) + 10)
      }

      // Repair and sync statistics after import
      await recomputeStats(uid)
      setProgress(100)
      setStep('complete')
      toast.success(`Successfully imported ${titles.length} titles!`)
      if (onImportComplete) onImportComplete()
    } catch {
      setError('An error occurred during database writing. Please retry.')
      setStep('preview')
    }
  }

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {step === 'complete' ? 'Import Complete' : 'Import Watch Data'}
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {error && <div className={styles.errorText}>{error}</div>}

          {step === 'select' && (
            <div
              className={styles.dropzone}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
              }}
              tabIndex={0}
              role="button"
              aria-label="Upload data file"
            >
              <UploadCloud size={44} className={styles.dropIcon} />
              <span className={styles.dropTitle}>Click to choose or drag a file here</span>
              <span className={styles.dropSubtitle}>
                Supports CineTrack backup JSON or Letterboxd CSV (watched.csv, ratings.csv)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                className={styles.fileInput}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
            </div>
          )}

          {step === 'preview' && payload && (
            <>
              <div className={styles.previewGrid}>
                <div className={styles.previewBox}>
                  <span className={styles.boxVal}>{payload.titles.length}</span>
                  <span className={styles.boxLabel}>Titles</span>
                </div>
                <div className={styles.previewBox}>
                  <span className={styles.boxVal}>
                    {payload.titles.filter((t) => t.rating != null).length}
                  </span>
                  <span className={styles.boxLabel}>Ratings</span>
                </div>
                <div className={styles.previewBox}>
                  <span className={styles.boxVal}>{payload.reviewsCount}</span>
                  <span className={styles.boxLabel}>Reviews</span>
                </div>
                <div className={styles.previewBox}>
                  <span className={styles.boxVal}>{payload.notesCount}</span>
                  <span className={styles.boxLabel}>Notes</span>
                </div>
              </div>

              <span className={styles.dropSubtitle}>Preview of first titles:</span>
              <table className={styles.sampleTable}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.titles.slice(0, 5).map((t, idx) => (
                    <tr key={`${t.title}-${idx}`}>
                      <td>{t.title}</td>
                      <td>{t.year || '—'}</td>
                      <td>{t.status}</td>
                      <td>{t.rating != null ? `${t.rating}★` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Film size={36} className={styles.dropIcon} style={{ animation: 'pulse 1.5s infinite' }} />
              <div className={styles.dropTitle} style={{ marginTop: '12px' }}>
                Importing data ({progress}%)...
              </div>
              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto' }} />
              <div className={styles.title} style={{ marginTop: '12px' }}>
                All Data Successfully Imported!
              </div>
              <p className={styles.dropSubtitle} style={{ marginTop: '6px' }}>
                Your library and analytics have been updated with your imported titles.
              </p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step === 'preview' && (
            <>
              <button type="button" className={styles.cancelBtn} onClick={() => setStep('select')}>
                Back
              </button>
              <button type="button" className={styles.confirmBtn} onClick={executeImport}>
                Confirm &amp; Import ({payload?.titles.length} titles)
              </button>
            </>
          )}
          {step === 'complete' && (
            <button type="button" className={styles.confirmBtn} onClick={onClose}>
              Done
            </button>
          )}
          {step === 'select' && (
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
