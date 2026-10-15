import { useState } from 'react'
import { Download, Upload, RefreshCw, FileText } from 'lucide-react'
import {
  exportCinetrackJson,
  exportLibraryCsv,
  exportHistoryCsv,
} from '@/features/dataTools/export/exportApi'
import { recomputeStats } from '@/features/analytics/api/analyticsApi'
import { ImportWizardDialog } from '@/features/dataTools/import/components/ImportWizardDialog'
import { toast } from '@/shared/ui/Toast/toastStore'
import styles from './DataToolsSection.module.css'

interface DataToolsSectionProps {
  uid: string
}

export function DataToolsSection({ uid }: DataToolsSectionProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isRepairing, setIsRepairing] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  async function handleExportJson() {
    if (!uid) return
    setIsExporting(true)
    try {
      await exportCinetrackJson(uid)
      toast.success('CineTrack backup downloaded.')
    } catch {
      toast.error('Failed to export data backup.')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportLibraryCsv() {
    if (!uid) return
    setIsExporting(true)
    try {
      await exportLibraryCsv(uid)
      toast.success('Library CSV downloaded.')
    } catch {
      toast.error('Failed to export library CSV.')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportHistoryCsv() {
    if (!uid) return
    setIsExporting(true)
    try {
      await exportHistoryCsv(uid)
      toast.success('Watch history CSV downloaded.')
    } catch {
      toast.error('Failed to export watch history CSV.')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleRepairData() {
    if (!uid) return
    setIsRepairing(true)
    try {
      await recomputeStats(uid)
      toast.success('Database counters and streaks successfully repaired!')
    } catch {
      toast.error('Failed to repair data counters.')
    } finally {
      setIsRepairing(false)
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.title}>Export Your Data</h2>
        <p className={styles.desc}>
          Download a complete, offline-readable backup of your CineTrack data.
          JSON backups are fully round-trippable and can be re-imported anytime.
        </p>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.btn}
            onClick={handleExportJson}
            disabled={isExporting}
          >
            <Download size={16} />
            <span>Full Backup (JSON)</span>
          </button>

          <button
            type="button"
            className={styles.btn}
            onClick={handleExportLibraryCsv}
            disabled={isExporting}
          >
            <FileText size={16} />
            <span>Library (CSV)</span>
          </button>

          <button
            type="button"
            className={styles.btn}
            onClick={handleExportHistoryCsv}
            disabled={isExporting}
          >
            <FileText size={16} />
            <span>Watch History (CSV)</span>
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title}>Import Data</h2>
        <p className={styles.desc}>
          Import watch data from a CineTrack JSON backup or a Letterboxd export
          (watched.csv, ratings.csv, or diary.csv).
        </p>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => setIsImportOpen(true)}
          >
            <Upload size={16} />
            <span>Launch Import Wizard</span>
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title}>Repair &amp; Sync Counters</h2>
        <p className={styles.desc}>
          If you ever suspect counter drift or broken streaks, this function rebuilds your
          denormalized statistics directly from your raw library and watch history documents.
        </p>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.btn}
            onClick={handleRepairData}
            disabled={isRepairing}
          >
            <RefreshCw size={16} className={isRepairing ? styles.spin : undefined} />
            <span>{isRepairing ? 'Repairing...' : 'Repair My Data'}</span>
          </button>
        </div>
      </div>

      <ImportWizardDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        uid={uid}
      />
    </div>
  )
}
