import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const CANONICAL_STATUSES = new Set([
  'plan_to_watch',
  'watching',
  'completed',
  'on_hold',
  'dropped',
])

const STATUS_MAPPINGS: Record<string, string> = {
  watched: 'completed',
  Completed: 'completed',
  Watching: 'watching',
  planToWatch: 'plan_to_watch',
  'plan to watch': 'plan_to_watch',
  onHold: 'on_hold',
  'on hold': 'on_hold',
  Dropped: 'dropped',
}

async function run() {
  const isConfirm = process.argv.includes('--confirm')
  console.log(`[CineTrack Status Migration] Mode: ${isConfirm ? 'WRITE (--confirm)' : 'DRY-RUN'}`)

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin environment variables in .env.local')
    process.exit(1)
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })

  const ownerEmail = 'nigotiyanaitik@gmail.com'
  const user = await getAuth().getUserByEmail(ownerEmail)
  const uid = user.uid
  console.log(`Owner UID: ${uid} (${ownerEmail})`)

  const db = getFirestore()
  const libCol = db.collection(`users/${uid}/library`)
  const histCol = db.collection(`users/${uid}/history`)

  const snap = await libCol.get()
  console.log(`Total library documents: ${snap.size}`)

  let needsUpdateCount = 0
  const batch = db.batch()

  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    const id = docSnap.id
    const currentStatus = data.status
    let newStatus = currentStatus

    if (typeof currentStatus === 'string' && !CANONICAL_STATUSES.has(currentStatus)) {
      newStatus = STATUS_MAPPINGS[currentStatus] || 'plan_to_watch'
    }

    const updates: Record<string, any> = {}

    if (newStatus !== currentStatus) {
      updates.status = newStatus
      console.log(`[Fix Status] ${id}: "${currentStatus}" -> "${newStatus}"`)
    }

    // Specific repair for Memories of Murder (movie:11423)
    if (id === 'movie:11423') {
      if (data.runtimeMinutes !== 132) updates.runtimeMinutes = 132
      if (data.totalMinutesWatched !== 132) updates.totalMinutesWatched = 132
      if (data.watchCount !== 1) updates.watchCount = 1
      if (data.status !== 'completed') updates.status = 'completed'
      if (data.isFavorite !== true) updates.isFavorite = true
    }

    if (Object.keys(updates).length > 0) {
      needsUpdateCount++
      updates.updatedAt = FieldValue.serverTimestamp()
      console.log(`[Proposed Update] ${id}:`, updates)
      if (isConfirm) {
        batch.update(docSnap.ref, updates)
      }
    }
  }

  // Also check history for Memories of Murder to ensure runtimeMinutes = 132
  const histSnap = await histCol.where('titleKey', '==', 'movie:11423').get()
  for (const hDoc of histSnap.docs) {
    const hData = hDoc.data()
    if (hData.runtimeMinutes !== 132) {
      console.log(`[Fix History Runtime] ${hDoc.id}: runtimeMinutes ${hData.runtimeMinutes} -> 132`)
      needsUpdateCount++
      if (isConfirm) {
        batch.update(hDoc.ref, { runtimeMinutes: 132 })
      }
    }
  }

  if (isConfirm && needsUpdateCount > 0) {
    await batch.commit()
    console.log(`Successfully committed updates for ${needsUpdateCount} items.`)
  } else {
    console.log(`Dry-run finished. ${needsUpdateCount} item(s) would be updated. Run with --confirm to apply.`)
  }
}

run().catch((err) => {
  console.error('[Error]:', err)
  process.exit(1)
})
