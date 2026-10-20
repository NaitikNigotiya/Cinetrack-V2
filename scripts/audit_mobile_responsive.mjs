import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const TARGET_WIDTHS = [
  { name: '320', width: 320, height: 600 },
  { name: '360', width: 360, height: 740 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1440', width: 1440, height: 900 }
]

const ROUTES = [
  { id: 'home', path: '/' },
  { id: 'discover', path: '/discover' },
  { id: 'search', path: '/search' },
  { id: 'library', path: '/library' },
  { id: 'watchlist', path: '/watchlist' },
  { id: 'watching', path: '/watching' },
  { id: 'completed', path: '/completed' },
  { id: 'favorites', path: '/favorites' },
  { id: 'collections', path: '/collections' },
  { id: 'history', path: '/history' },
  { id: 'reviews', path: '/reviews' },
  { id: 'notes', path: '/notes' },
  { id: 'analytics', path: '/analytics' },
  { id: 'calendar', path: '/calendar' },
  { id: 'title-detail', path: '/title/movie:936075' },
  { id: 'settings', path: '/settings' }
]

const outDir = path.resolve('docs/responsive')
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true })
  const report = []

  console.log('🚀 Starting CineTrack v2 Fast Mobile Responsive Audit...')

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

  for (const route of ROUTES) {
    console.log(`\nAuditing route: ${route.id} (${route.path})`)
    const routeIssues = []

    try {
      await page.goto(`http://localhost:5173${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      }).catch(() => {})

      // Wait a short moment for initial render
      await page.waitForTimeout(600)

      for (const preset of TARGET_WIDTHS) {
        await page.setViewportSize({ width: preset.width, height: preset.height })
        await page.waitForTimeout(150)

        // Evaluate layout metrics
        const metrics = await page.evaluate((width) => {
          const docScrollWidth = document.documentElement.scrollWidth
          const winInnerWidth = window.innerWidth
          const hasHorizontalOverflow = docScrollWidth > winInnerWidth + 1

          // Find overflowing elements
          const overflowingElements = []
          const allEls = document.querySelectorAll('*')
          allEls.forEach(el => {
            const style = window.getComputedStyle(el)
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              style.opacity === '0'
            ) return

            // If it is inside or is an authorized horizontal scroll container, skip
            if (
              el.closest('[role="tablist"]') ||
              el.closest('.tabList') ||
              el.closest('.segmentedControl') ||
              el.closest('.carousel') ||
              el.closest('[class*="Carousel"]') ||
              el.closest('[class*="carousel"]') ||
              style.overflowX === 'auto' ||
              style.overflowX === 'scroll'
            ) {
              return
            }

            const rect = el.getBoundingClientRect()
            if (rect.width > 0 && rect.right > winInnerWidth + 2) {
              const tag = el.tagName.toLowerCase()
              const cls = el.className ? `.${String(el.className).trim().split(/\s+/).slice(0, 2).join('.')}` : ''
              overflowingElements.push(`${tag}${cls} (right: ${Math.round(rect.right)}px > ${winInnerWidth}px)`)
            }
          })

          // Touch target checks for mobile (< 768px)
          const smallTargets = []
          if (width < 768) {
            const interactives = document.querySelectorAll('button, a, select, input[type="button"], input[type="submit"]')
            interactives.forEach(btn => {
              const rect = btn.getBoundingClientRect()
              const style = window.getComputedStyle(btn)
              if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                style.opacity === '0' ||
                rect.width === 0 ||
                rect.height === 0
              ) return

              // Only visible in current viewport
              if (rect.bottom < 0 || rect.top > window.innerHeight) return

              if (rect.width < 43 || rect.height < 43) {
                const text = (btn.textContent || btn.getAttribute('aria-label') || btn.getAttribute('title') || '').trim().slice(0, 20)
                const cls = btn.className ? `.${String(btn.className).trim().split(/\s+/).slice(0, 2).join('.')}` : ''
                smallTargets.push(`${btn.tagName.toLowerCase()}${cls} "${text}" (${Math.round(rect.width)}x${Math.round(rect.height)}px)`)
              }
            })
          }

          // Bottom bar overlap check
          let bottomNavOverlap = false
          const bottomBar = document.querySelector('nav[aria-label="Mobile Navigation"]')
          if (bottomBar && width < 1024) {
            const barRect = bottomBar.getBoundingClientRect()
            const main = document.querySelector('main')
            if (main) {
              const paddingBottom = parseFloat(window.getComputedStyle(main).paddingBottom || '0')
              if (paddingBottom < barRect.height) {
                bottomNavOverlap = true
              }
            }
          }

          return {
            docScrollWidth,
            winInnerWidth,
            hasHorizontalOverflow,
            overflowingElements: overflowingElements.slice(0, 5),
            smallTargets: smallTargets.slice(0, 8),
            bottomNavOverlap
          }
        }, preset.width)

        // Save screenshot
        const screenshotPath = path.join(outDir, `${route.id}-${preset.name}.png`)
        await page.screenshot({ path: screenshotPath, fullPage: false })

        if (metrics.hasHorizontalOverflow || metrics.overflowingElements.length > 0 || metrics.smallTargets.length > 0 || metrics.bottomNavOverlap) {
          routeIssues.push({
            width: preset.width,
            ...metrics
          })
        }

        console.log(`  ✓ ${preset.name}px: ${metrics.hasHorizontalOverflow ? '❌ HORIZONTAL OVERFLOW (' + metrics.docScrollWidth + 'px)' : 'OK'}`)
      }
    } catch (err) {
      console.error(`  ❌ Error testing ${route.id}:`, err.message)
    }

    report.push({
      route: route.id,
      path: route.path,
      issues: routeIssues
    })
  }

  await browser.close()

  const summaryFile = path.join(outDir, 'audit_report.json')
  fs.writeFileSync(summaryFile, JSON.stringify(report, null, 2), 'utf8')
  console.log(`\nAudit completed! Report saved to ${summaryFile}`)
}

runAudit().catch(console.error)
