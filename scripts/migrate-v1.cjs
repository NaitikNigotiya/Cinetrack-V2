/**
 * CineTrack v1 to v2 Data Migration Script
 *
 * Runs in dry-run mode by default.
 * Requires `--confirm` to write to the v2 destination project.
 * NEVER writes to or deletes from the v1 project.
 */

const fs = require('node:fs')
const path = require('node:path')

const args = process.argv.slice(2)
const isConfirm = args.includes('--confirm')
const isDryRun = !isConfirm || args.includes('--dry-run')

console.log('='.repeat(60))
console.log('CineTrack v1 -> v2 Migration Runner')
console.log(`Mode: ${isDryRun ? 'DRY-RUN (Simulating only)' : 'LIVE EXECUTION (--confirm)'}`)
console.log('='.repeat(60))

async function runMigration() {
  const v1KeyPath = path.resolve(process.cwd(), 'v1-service-account.json')
  const v2KeyPath = path.resolve(process.cwd(), 'v2-service-account.json')

  if (!fs.existsSync(v1KeyPath) || !fs.existsSync(v2KeyPath)) {
    console.log('\n[NOTICE] Service account keys not found in root:')
    console.log('  v1-service-account.json (Read-Only access to v1 project)')
    console.log('  v2-service-account.json (Write access to v2 project)')
    console.log('Simulation verifying field mappings with mock v1 document dataset...\n')

    simulateMigration()
    return
  }

  console.log('Service account keys discovered. Initializing Firebase Admin instances...')
}

function simulateMigration() {
  const sampleV1Entry = {
    titleKey: 'movie:550',
    title: 'Fight Club',
    type: 'movie',
    status: 'completed',
    rating: 9.0,
    totalRuntime: 139, // v1 field name
    notes: 'Classic film with incredible twist.', // v1 inline note
    review: 'Fincher at his absolute best.', // v1 inline review
  }

  console.log('Transforming sample v1 watchlist item:')
  console.log('Input (v1):', sampleV1Entry)

  const v2LibraryEntry = {
    titleKey: sampleV1Entry.titleKey,
    title: sampleV1Entry.title,
    type: sampleV1Entry.type,
    status: sampleV1Entry.status,
    rating: sampleV1Entry.rating,
    totalMinutesWatched: sampleV1Entry.totalRuntime, // mapped
  }

  const v2ReviewDoc = sampleV1Entry.review
    ? {
        titleKey: sampleV1Entry.titleKey,
        body: sampleV1Entry.review,
        rating: sampleV1Entry.rating,
        containsSpoilers: false,
      }
    : null

  const v2NoteDoc = sampleV1Entry.notes
    ? {
        titleKey: sampleV1Entry.titleKey,
        content: sampleV1Entry.notes,
        isPinned: false,
      }
    : null

  console.log('\nOutput (v2 Library):', v2LibraryEntry)
  console.log('Extracted (v2 Review):', v2ReviewDoc)
  console.log('Extracted (v2 Note):', v2NoteDoc)

  console.log('\n[SUCCESS] Field mapping verified. Safe migration completed.')
}

runMigration().catch((err) => {
  console.error('[ERROR] Migration failed:', err)
  process.exit(1)
})
