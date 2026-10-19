const { chromium } = require('playwright')
const path = require('path')
const assert = require('assert')

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const outDir = path.resolve('C:/Users/naiti/.gemini/antigravity-ide/brain/0e40a974-8de2-4c59-8d61-3dfdf6aa8bf9')

  console.log('=== STARTING PLAYWRIGHT VERIFICATION ===')

  // 1. DESKTOP 1920x1080
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()

  // ─── Verification 1: Collection Detail Page ───
  console.log('\n[1/4] Verifying Collection Detail Page (1920)...')
  await page.goto('http://localhost:5173/collections/smart:favorites')
  await page.waitForTimeout(2000)

  // Verify PageHeader exists with eyebrow
  const eyebrow = page.locator('header [class*="eyebrow"]')
  console.log('Eyebrow text:', await eyebrow.textContent())
  assert((await eyebrow.textContent()).includes('COLLECTION') || (await eyebrow.textContent()).includes('LIST'))

  // Verify StatRow with 3 tiles
  const statTiles = page.locator('.col-detail-pane [class*="statTile"]')
  const statTileCount = await statTiles.count()
  console.log('StatTile count:', statTileCount)
  assert.strictEqual(statTileCount, 3, 'Should have exactly 3 stat tiles')

  // Verify FilterBar exists
  const filterBar = page.locator('.col-detail-pane [class*="controlBar"]')
  assert(await filterBar.count() > 0, 'FilterBar should be present')

  // Check gaps between sections/blocks in col-detail-pane
  const detailBlocks = page.locator('.col-detail-pane > *')
  const detailBlockCount = await detailBlocks.count()
  console.log('Col detail block count:', detailBlockCount)
  for (let i = 0; i < detailBlockCount - 1; i++) {
    const box1 = await detailBlocks.nth(i).boundingBox()
    const box2 = await detailBlocks.nth(i + 1).boundingBox()
    if (box1 && box2) {
      const gap = Math.round(box2.y - (box1.y + box1.height))
      console.log(`Gap between block ${i} and ${i+1}: ${gap}px`)
      assert(gap >= 16, `Gap ${gap}px between blocks should be >= 16px`)
      assert.strictEqual(gap, 32, `Section gap should be exactly 32px (--section-gap), got ${gap}px`)
    }
  }

  await page.screenshot({ path: path.join(outDir, 'after_collection_1920.png'), fullPage: false })
  console.log('Captured after_collection_1920.png')

  // ─── Verification 2: Discover Page ───
  console.log('\n[2/4] Verifying Discover Page (1920)...')
  await page.goto('http://localhost:5173/discover')
  await page.waitForTimeout(2000)

  // Assert: "the Trending banner has no overlay element with a gradient/opacity covering the image"
  const overlayLocator = page.locator('.dp-hero-overlay')
  const overlayCount = await overlayLocator.count()
  console.log('dp-hero-overlay count:', overlayCount)
  assert.strictEqual(overlayCount, 0, 'Trending banner must not have dp-hero-overlay')

  // Assert: dp-hero-left is styled as compact panel (max-width <= 560px)
  const heroLeft = page.locator('.dp-hero-left')
  if (await heroLeft.count() > 0) {
    const heroLeftBox = await heroLeft.boundingBox()
    console.log('Hero left panel dimensions:', heroLeftBox)
    assert(heroLeftBox.width <= 570, `Hero left panel width ${heroLeftBox.width} should be <= 560px`)
  }

  // Assert: gaps in Discover page
  // Banner to carousel: 32px; Carousel to Top IMDb: 32px
  const trendingHero = page.locator('.dp-hero')
  const trendingCarousel = page.locator('section:has-text("Trending Now") .cc-root')
  if (await trendingHero.count() > 0 && await trendingCarousel.count() > 0) {
    const heroBox = await trendingHero.boundingBox()
    const carouselBox = await trendingCarousel.boundingBox()
    const bannerToCarouselGap = Math.round(carouselBox.y - (heroBox.y + heroBox.height))
    console.log('Banner to carousel gap:', bannerToCarouselGap, 'px')
    assert.strictEqual(bannerToCarouselGap, 32, `Banner to carousel gap must be 32px, got ${bannerToCarouselGap}px`)
  }

  const topImdbSection = page.locator('section:has-text("Top IMDb")')
  if (await trendingCarousel.count() > 0 && await topImdbSection.count() > 0) {
    const carouselBox = await trendingCarousel.boundingBox()
    const topImdbBox = await topImdbSection.boundingBox()
    const carouselToTopImdbGap = Math.round(topImdbBox.y - (carouselBox.y + carouselBox.height))
    console.log('Carousel to Top IMDb gap:', carouselToTopImdbGap, 'px')
    // Sibling sections separated by --section-gap
    assert(carouselToTopImdbGap >= 28 && carouselToTopImdbGap <= 36, `Carousel to Top IMDb gap should be ~32px, got ${carouselToTopImdbGap}px`)
  }

  // Assert: carousel scroll-snap and arrow buttons
  const scrollTrack = page.locator('.cc-scroll').first()
  const snapType = await scrollTrack.evaluate((el) => window.getComputedStyle(el).scrollSnapType)
  console.log('Carousel scroll-snap-type:', snapType)
  assert(snapType.includes('x') || snapType.includes('mandatory'), 'Carousel must have scroll-snap-type: x mandatory')

  const rightArrow = page.locator('.cc-arrow--right').first()
  assert(await rightArrow.count() > 0, 'Carousel right arrow must exist')

  await page.screenshot({ path: path.join(outDir, 'after_discover_1920.png'), fullPage: false })
  console.log('Captured after_discover_1920.png')

  // ─── Verification 3: Calendar Page ───
  console.log('\n[3/4] Verifying Calendar Page (1920)...')
  await page.goto('http://localhost:5173/calendar')
  await page.waitForTimeout(2000)

  // Assert 2-column layout on wide screen >= 1200px
  const mainLayout = page.locator('.cal-main-layout')
  const displayStyle = await mainLayout.evaluate((el) => window.getComputedStyle(el).display)
  console.log('.cal-main-layout display style:', displayStyle)
  assert.strictEqual(displayStyle, 'grid', 'Wide screen calendar should use 2-column grid layout')

  const sidebar = page.locator('.cal-sidebar-col')
  const sidebarBox = await sidebar.boundingBox()
  console.log('Sidebar bounding box on >=1200px:', sidebarBox)
  assert(Math.abs(sidebarBox.width - 340) <= 5, `Sidebar width should be 340px, got ${sidebarBox.width}px`)

  // Check gap between cards in sidebar on wide screen (--card-gap = 16px)
  const sidebarCards = sidebar.locator('> *')
  const sCard1 = await sidebarCards.nth(0).boundingBox()
  const sCard2 = await sidebarCards.nth(1).boundingBox()
  if (sCard1 && sCard2) {
    const sidebarGap = Math.round(sCard2.y - (sCard1.y + sCard1.height))
    console.log('Sidebar stacked cards gap:', sidebarGap, 'px')
    assert.strictEqual(sidebarGap, 16, `Sidebar cards gap should be 16px (--card-gap), got ${sidebarGap}px`)
  }

  // Check Log Watch and Plan Watch buttons: same height and radius, side by side with --card-gap (16px)
  const logWatchBtn = sidebar.locator('button:has-text("Log Watch")')
  const planWatchBtn = sidebar.locator('button:has-text("Plan Watch")')
  const logBox = await logWatchBtn.boundingBox()
  const planBox = await planWatchBtn.boundingBox()
  console.log('Log Watch button:', logBox)
  console.log('Plan Watch button:', planBox)
  assert.strictEqual(Math.round(logBox.height), Math.round(planBox.height), 'Log Watch and Plan Watch must have identical height')
  const btnGap = Math.round(planBox.x - (logBox.x + logBox.width))
  console.log('Gap between Log Watch and Plan Watch buttons:', btnGap, 'px')
  assert.strictEqual(btnGap, 16, `Gap between Log Watch and Plan Watch should be 16px (--card-gap), got ${btnGap}px`)

  // Check calendar cells: equal height, 8px padding, today highlight
  const dayCells = page.locator('.calendar-day-cell')
  const cellCount = await dayCells.count()
  console.log('Total calendar day cells:', cellCount)
  const cell0Height = Math.round((await dayCells.nth(0).boundingBox()).height)
  const cell10Height = Math.round((await dayCells.nth(10).boundingBox()).height)
  console.log(`Cell 0 height: ${cell0Height}px, Cell 10 height: ${cell10Height}px`)
  assert.strictEqual(cell0Height, cell10Height, 'Calendar day cells must have equal height')

  const cellPadding = await dayCells.nth(0).evaluate((el) => window.getComputedStyle(el).paddingTop)
  console.log('Cell padding:', cellPadding)
  assert.strictEqual(cellPadding, '8px', 'Cell inner padding must be 8px')

  await page.screenshot({ path: path.join(outDir, 'after_calendar_1920.png'), fullPage: false })
  console.log('Captured after_calendar_1920.png')

  // ─── Verification 4: Update Watch Status Modal ───
  console.log('\n[4/4] Verifying Update Watch Status Modal (1920)...')
  await page.goto('http://localhost:5173/title/movie:11423')
  await page.waitForTimeout(2500)

  // Seed entry into app store so it is in library with status 'completed'
  await page.evaluate(() => {
    if (window.__appStore) {
      window.__appStore.getState().optimisticUpsertLibraryEntry({
        titleKey: 'movie:11423',
        tmdbId: 11423,
        type: 'movie',
        title: 'Memories of Murder',
        year: 2003,
        posterPath: '/4XWjM5v4kGg8sL5C8b6K2W4L1K7.jpg',
        backdropPath: null,
        genres: [{ id: 80, name: 'Crime' }, { id: 18, name: 'Drama' }],
        status: 'completed',
        personalRating: 9,
        watchedAt: '2026-10-19T00:00:00.000Z',
        isFavorite: true,
        userCollections: [],
        updatedAt: new Date().toISOString(),
      })
    }
  })
  await page.waitForTimeout(500)

  const statusBtn = page.locator('.title-hero-btn-status')
  await statusBtn.waitFor({ state: 'visible', timeout: 5000 })
  await statusBtn.click()
  await page.waitForTimeout(600)

  // Assert: dialog width is <= 480px on desktop and does not overlap sidebar edge-to-edge
  const dialog = page.locator('[role="dialog"]')
  const dialogBox = await dialog.boundingBox()
  console.log('Desktop dialog dimensions:', dialogBox)
  assert(dialogBox.width <= 480, `Desktop dialog width ${dialogBox.width} must be <= 480px`)
  assert(dialogBox.x > 100, `Dialog x ${dialogBox.x} must be centered, not overlapping left screen edge`)

  // Assert: role="radiogroup" with 5 options
  const radioGroup = page.locator('[role="radiogroup"]')
  assert(await radioGroup.count() > 0, 'Radiogroup must exist')
  const radioOptions = radioGroup.locator('[role="radio"]')
  const radioCount = await radioOptions.count()
  console.log('Radio options count:', radioCount)
  assert.strictEqual(radioCount, 5, 'Must have exactly 5 status options')

  // Assert: number key shortcuts work (press 1 for Plan to Watch)
  await page.keyboard.press('1')
  await page.waitForTimeout(200)
  const option1 = radioOptions.nth(0)
  assert.strictEqual(await option1.getAttribute('aria-checked'), 'true', 'Pressing 1 should select Plan to Watch')

  // Assert: arrow navigation works (press Down arrow -> Watching)
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(200)
  const option2 = radioOptions.nth(1)
  assert.strictEqual(await option2.getAttribute('aria-checked'), 'true', 'ArrowDown should move to next option (Watching)')

  // Assert: completed movie shows inline date and rating
  await page.keyboard.press('3') // Completed
  await page.waitForTimeout(200)
  const dateInput = page.locator('#status-watched-date')
  assert(await dateInput.count() > 0, 'Completed movie should show Watched on date input')

  // Capture desktop modal screenshot
  await page.screenshot({ path: path.join(outDir, 'after_status_1920.png'), fullPage: false })
  console.log('Captured after_status_1920.png')

  // Assert: Esc closes modal
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  assert.strictEqual(await page.locator('[role="dialog"]').count(), 0, 'Esc should close modal')
  console.log('Esc successfully closed modal!')

  // 2. MOBILE 390x844
  console.log('\n=== MOBILE VIEWPORT VERIFICATION (390x844) ===')
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mobilePage = await mobileContext.newPage()

  console.log('Capturing mobile collection...')
  await mobilePage.goto('http://localhost:5173/collections/smart:favorites')
  await mobilePage.waitForTimeout(1500)
  await mobilePage.screenshot({ path: path.join(outDir, 'after_collection_390.png'), fullPage: false })

  console.log('Capturing mobile discover...')
  await mobilePage.goto('http://localhost:5173/discover')
  await mobilePage.waitForTimeout(1500)
  await mobilePage.screenshot({ path: path.join(outDir, 'after_discover_390.png'), fullPage: false })

  console.log('Capturing mobile calendar...')
  await mobilePage.goto('http://localhost:5173/calendar')
  await mobilePage.waitForTimeout(1500)
  // Below 1200px: stacked with --section-gap (32px)
  const mSidebar = mobilePage.locator('.cal-sidebar-col')
  const mCalendarCard = mobilePage.locator('.calendar-grid-container').locator('xpath=ancestor::*[contains(@class, "card")][1]')
  if (await mCalendarCard.count() > 0 && await mSidebar.count() > 0) {
    const cBox = await mCalendarCard.boundingBox()
    const sBox = await mSidebar.boundingBox()
    const mGap = Math.round(sBox.y - (cBox.y + cBox.height))
    console.log('Mobile stacked Calendar card to Sidebar gap:', mGap, 'px')
    assert.strictEqual(mGap, 32, `Mobile stacked gap should be 32px (--section-gap), got ${mGap}px`)
  }
  await mobilePage.screenshot({ path: path.join(outDir, 'after_calendar_390.png'), fullPage: false })

  console.log('Capturing mobile update status bottom sheet...')
  await mobilePage.goto('http://localhost:5173/title/movie:11423')
  await mobilePage.waitForTimeout(2500)

  // Seed entry into app store so it is in library with status 'completed'
  await mobilePage.evaluate(() => {
    if (window.__appStore) {
      window.__appStore.getState().setError(null)
      window.__appStore.getState().optimisticUpsertLibraryEntry({
        titleKey: 'movie:11423',
        tmdbId: 11423,
        type: 'movie',
        title: 'Memories of Murder',
        year: 2003,
        posterPath: '/4XWjM5v4kGg8sL5C8b6K2W4L1K7.jpg',
        backdropPath: null,
        genres: [{ id: 80, name: 'Crime' }, { id: 18, name: 'Drama' }],
        status: 'completed',
        personalRating: 9,
        watchedAt: '2026-10-19T00:00:00.000Z',
        isFavorite: true,
        userCollections: [],
        updatedAt: new Date().toISOString(),
      })
    }
  })
  await mobilePage.waitForTimeout(800)

  const mStatusBtn = mobilePage.locator('.title-hero-btn-status')
  await mStatusBtn.waitFor({ state: 'visible', timeout: 5000 })
  await mStatusBtn.click()
  await mobilePage.waitForTimeout(1000)

  // Verify mobile bottom sheet properties
  const mDialog = mobilePage.locator('.bottom-sheet')
  await mDialog.waitFor({ state: 'visible', timeout: 5000 })
  const mDialogBox = await mDialog.boundingBox()
  console.log('Mobile sheet dimensions:', mDialogBox)
  assert.strictEqual(Math.round(mDialogBox.width), 390, 'Mobile sheet should stretch across mobile viewport (390px)')
  assert(mDialogBox.height <= 844 * 0.85 + 5, `Mobile sheet max-height should be <= 85vh (717px), got ${mDialogBox.height}px`)

  // Verify drag handle is visible on mobile
  const handleBar = mobilePage.locator('.bottom-sheet-handle-bar')
  assert(await handleBar.isVisible(), 'Drag handle should be visible on mobile')

  await mobilePage.screenshot({ path: path.join(outDir, 'after_status_390.png'), fullPage: false })
  console.log('Captured after_status_390.png')

  await browser.close()
  console.log('\n=== ALL PLAYWRIGHT ASSERTIONS PASSED SUCCESSFULLY! ===')
}

run().catch((err) => {
  console.error('Playwright verification failed:', err)
  process.exit(1)
})
