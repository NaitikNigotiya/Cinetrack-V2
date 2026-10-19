const { chromium } = require('playwright')
const path = require('path')

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const outDir = path.resolve('C:/Users/naiti/.gemini/antigravity-ide/brain/0e40a974-8de2-4c59-8d61-3dfdf6aa8bf9')

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()

  console.log('Navigating to title detail page (movie:936075)...')
  await page.goto('http://localhost:5173/title/movie:936075')

  await page.waitForSelector('.title-hero-heading, .title-detail-page-container', { timeout: 15000 })
  console.log('Title detail page loaded!')

  await page.waitForTimeout(2000)

  // 1. Capture Similar tab after fix at 1920px
  const similarTab = page.locator('button[role="tab"]', { hasText: 'Similar' })
  await similarTab.click()
  await page.waitForTimeout(1000)

  // Measure card sizes and check horizontal scroll
  const cards = page.locator('.poster-grid > *')
  const count = await cards.count()
  console.log('Similar cards count:', count)
  let firstCardBox = null
  if (count > 0) {
    firstCardBox = await cards.first().boundingBox()
    console.log('First Similar Card dimensions after fix (1920px):', firstCardBox)
  }

  const scrollInfo1920 = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }))
  console.log('1920px viewport scroll check:', scrollInfo1920)

  await page.screenshot({ path: path.join(outDir, 'after_similar_1920.png'), fullPage: false })
  console.log('Captured after_similar_1920.png')

  // 2. Capture Images tab after fix at 1920px
  const imagesTab = page.locator('button[role="tab"]', { hasText: 'Images' })
  await imagesTab.click()
  await page.waitForTimeout(1000)

  const backdropItems = await page.locator('.title-backdrop-gallery-item').count()
  const posterItems = await page.locator('.title-posters-gallery-grid > *').count()
  const logoItems = await page.locator('.title-logos-gallery-grid > *').count()
  console.log(`Images tab counts - Backdrops: ${backdropItems}, Posters: ${posterItems}, Logos: ${logoItems}`)

  await page.screenshot({ path: path.join(outDir, 'after_images_1920.png'), fullPage: false })
  console.log('Captured after_images_1920.png')

  // 3. Capture Reviews tab after fix at 1920px
  const reviewsTab = page.locator('button[role="tab"]', { hasText: 'Reviews' })
  await reviewsTab.click()
  await page.waitForTimeout(1000)

  const reviewCards = await page.locator('.title-tmdb-review-card').count()
  console.log('Reviews tab count:', reviewCards)

  await page.screenshot({ path: path.join(outDir, 'after_reviews_1920.png'), fullPage: false })
  console.log('Captured after_reviews_1920.png')

  // 4. Capture 390px mobile viewport
  await page.setViewportSize({ width: 390, height: 844 })
  await similarTab.click()
  await page.waitForTimeout(800)
  await page.evaluate(() => {
    const pane = document.querySelector('.title-similar-tab-pane, .poster-grid')
    if (pane) pane.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await page.waitForTimeout(500)

  const scrollInfo390 = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }))
  console.log('390px viewport scroll check (Similar):', scrollInfo390)

  let firstCardBox390 = null
  if (count > 0) {
    firstCardBox390 = await cards.first().boundingBox()
    console.log('First Similar Card dimensions after fix (390px):', firstCardBox390)
  }

  await page.screenshot({ path: path.join(outDir, 'after_similar_390.png'), fullPage: false })
  console.log('Captured after_similar_390.png')

  // Check images tab at 390px
  await imagesTab.click()
  await page.waitForTimeout(800)
  await page.evaluate(() => {
    const pane = document.querySelector('.title-images-tab-pane')
    if (pane) pane.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await page.waitForTimeout(500)

  const scrollInfoImages390 = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }))
  console.log('390px viewport scroll check (Images):', scrollInfoImages390)

  await page.screenshot({ path: path.join(outDir, 'after_images_390.png'), fullPage: false })
  console.log('Captured after_images_390.png')

  await browser.close()
  console.log('All after screenshots and measurements completed successfully!')
}

run().catch((err) => {
  console.error('Error running capture_after:', err)
  process.exit(1)
})
