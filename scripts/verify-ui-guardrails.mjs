import fs from 'node:fs'
import path from 'node:path'

/**
 * CI Guardrail: Ensures pages and feature stylesheets adhere to CineTrack v2 tokens
 * - No dashed borders anywhere in the app
 * - No page-level max-width property outside PageShell
 */

const FEATURES_DIR = path.resolve('src/features')
const SHARED_DIR = path.resolve('src/shared')

let errors = []

function scanFile(filePath) {
  // PageShell.module.css defines the canonical page width
  if (filePath.endsWith('PageShell.module.css')) return

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    const lineNum = index + 1
    const trimmed = line.trim()

    // Skip comments
    if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) {
      return
    }

    // 1. Check dashed borders anywhere
    if (/border(-[a-z]+)?\s*:[^;]*\bdashed\b/i.test(line)) {
      errors.push({
        file: filePath,
        line: lineNum,
        rule: 'no-dashed-borders',
        message: 'Dashed borders are disallowed. Use solid borders with design tokens.',
        snippet: trimmed,
      })
    }

    // 2. Check property max-width: 1100-1600px (container width) outside PageShell (not media queries)
    if (/^\s*max-width\s*:\s*(1140px|1200px|1280px|1100px|1150px|1400px|1600px)/i.test(line)) {
      errors.push({
        file: filePath,
        line: lineNum,
        rule: 'no-page-max-width',
        message: 'Page max-width must only be controlled by PageShell (--page-max).',
        snippet: trimmed,
      })
    }
  })
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(fullPath)
    } else if (entry.name.endsWith('.css')) {
      scanFile(fullPath)
    }
  }
}

walkDir(FEATURES_DIR)
walkDir(SHARED_DIR)

console.log('--- CineTrack UI Guardrails Check ---')
if (errors.length === 0) {
  console.log('✅ UI Guardrails Passed: 0 dashed borders, 0 unauthorized container max-widths across all stylesheets.')
  process.exit(0)
} else {
  console.log(`Found ${errors.length} UI guardrail violation(s):`)
  errors.forEach((err) => {
    console.log(`[${err.rule}] ${err.file}:${err.line} - ${err.message}`)
    console.log(`    > ${err.snippet}`)
  })
  process.exit(1)
}
