const { chromium } = require('playwright')
const path = require('path')

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const outDir = path.resolve('C:/Users/naiti/.gemini/antigravity-ide/brain/0e40a974-8de2-4c59-8d61-3dfdf6aa8bf9')

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()

  console.log('Navigating directly to title detail...')
  await page.goto('http://localhost:5173/title/movie:936075')

  await page.waitForSelector('.title-hero-heading, .title-detail-page-container', { timeout: 15000 })
  console.log('Title detail page loaded!')

  await page.waitForTimeout(1500)

  // 1. Capture Similar tab before fix
  const similarTab = page.locator('button[role="tab"]', { hasText: 'Similar' })
  await similarTab.click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(outDir, 'before_similar_1920.png'), fullPage: false })
  console.log('Captured before_similar_1920.png')

  // Measure card sizes
  const cards = page.locator('.poster-grid > *, .title-similar-tab-pane [class*="card"]')
  const count = await cards.count()
  console.log('Similar cards count:', count)
  if (count > 0) {
    const box = await cards.first().boundingBox()
    console.log('First Similar Card dimensions before fix:', box)
  }

  // 2. Capture Images tab before fix
  const imagesTab = page.locator('button[role="tab"]', { hasText: 'Images' })
  await imagesTab.click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(outDir, 'before_images_1920.png'), fullPage: false })
  console.log('Captured before_images_1920.png')

  // 3. Capture Reviews tab before fix
  const reviewsTab = page.locator('button[role="tab"]', { hasText: 'Reviews' })
  await reviewsTab.click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(outDir, 'before_reviews_1920.png'), fullPage: false })
  console.log('Captured before_reviews_1920.png')

  // 4. Capture mobile 390px
  await page.setViewportSize({ width: 390, height: 844 })
  await similarTab.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(outDir, 'before_similar_390.png'), fullPage: false })
  console.log('Captured before_similar_390.png')

  await browser.close()
  console.log('All before screenshots captured successfully!')
}

run().catch(console.error)
