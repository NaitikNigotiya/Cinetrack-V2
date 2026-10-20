/**
 * CineTrack v1 Import Rollback Script
 *
 * Removes ONLY documents with source === 'import-v1' created by the v1 import.
 * Runs in dry-run mode by default.
 *
 * Usage:
 *   npm run import:rollback
 *   npm run import:rollback -- --confirm
 */

import fs from 'node:fs'
import path from 'node:path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Load Environment Variables
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const idx = trimmed.indexOf('=')
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}
loadEnv()

async function runRollback() {
  const args = process.argv.slice(2)
  const isConfirm = args.includes('--confirm')

  console.log('='.repeat(60))
  console.log('CineTrack v1 Import Rollback')
  console.log(`Mode: ${isConfirm ? 'LIVE DELETION (--confirm)' : 'DRY-RUN (Simulating only)'}`)
  console.log('='.repeat(60))

  const projectId = (process.env.FIREBASE_PROJECT_ID || '').replace(/^["']|["']$/g, '')
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/^["']|["']$/g, '')
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/^["']|["']$/g, '')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[Error] Missing Firebase Admin credentials in .env.local')
    process.exit(1)
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  }

  const ownerEmail = 'nigotiyanaitik@gmail.com'
  const user = await getAuth().getUserByEmail(ownerEmail)
  const uid = user.uid
  console.log(`Target User: ${uid} (${ownerEmail})`)

  const db = getFirestore()

  // 1. Find library entries with source === 'import-v1'
  const libCol = db.collection(`users/${uid}/library`)
  const libSnap = await libCol.where('source', '==', 'import-v1').get()
  console.log(`\nFound ${libSnap.size} library documents with source === 'import-v1'`)

  // 2. Find history events with source === 'import-v1'
  const histCol = db.collection(`users/${uid}/history`)
  const histSnap = await histCol.where('source', '==', 'import-v1').get()
  console.log(`Found ${histSnap.size} history events with source === 'import-v1'`)

  // 3. Find TV season documents under those library entries
  const seasonDocsToDelete: FirebaseFirestore.DocumentReference[] = []
  for (const libDoc of libSnap.docs) {
    if (libDoc.id.startsWith('tv:')) {
      const seasonsCol = db.collection(`users/${uid}/library/${libDoc.id}/seasons`)
      const seasonsSnap = await seasonsCol.get()
      seasonsSnap.docs.forEach((s) => {
        if (s.data().source === 'import-v1') {
          seasonDocsToDelete.push(s.ref)
        }
      })
    }
  }
  console.log(`Found ${seasonDocsToDelete.length} season documents with source === 'import-v1'`)

  const totalToDelete = libSnap.size + histSnap.size + seasonDocsToDelete.length
  console.log(`\nTotal documents to remove: ${totalToDelete}`)

  if (!isConfirm) {
    console.log('\n[DRY RUN] No documents were deleted. Pass --confirm to execute deletion.')
    return
  }

  // Live deletion in batches
  console.log('\n[Deleting] Committing document deletions...')
  let batch = db.batch()
  let count = 0
  let batchesCommitted = 0

  const commitBatch = async (force = false) => {
    if (count > 0 && (count >= 350 || force)) {
      await batch.commit()
      batchesCommitted++
      batch = db.batch()
      count = 0
    }
  }

  for (const ref of seasonDocsToDelete) {
    batch.delete(ref)
    count++
    await commitBatch()
  }

  for (const doc of histSnap.docs) {
    batch.delete(doc.ref)
    count++
    await commitBatch()
  }

  for (const doc of libSnap.docs) {
    batch.delete(doc.ref)
    count++
    await commitBatch()
  }

  await commitBatch(true)
  console.log(`[SUCCESS] Rollback complete! Deleted ${totalToDelete} docs in ${batchesCommitted} batch(es).`)
}

runRollback().catch((err) => {
  console.error('[Rollback Error]:', err)
  process.exit(1)
})
