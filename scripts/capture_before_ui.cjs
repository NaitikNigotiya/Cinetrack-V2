const { chromium } = require('playwright')
const path = require('path')

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const outDir = path.resolve('C:/Users/naiti/.gemini/antigravity-ide/brain/0e40a974-8de2-4c59-8d61-3dfdf6aa8bf9')

  // 1. Desktop context (1920x1080)
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()

  console.log('1. Capturing Collection Detail (1920)...')
  await page.goto('http://localhost:5173/collections/smart:favorites')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(outDir, 'before_collection_1920.png'), fullPage: false })

  console.log('2. Capturing Discover (1920)...')
  await page.goto('http://localhost:5173/discover')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(outDir, 'before_discover_1920.png'), fullPage: false })

  console.log('3. Capturing Calendar (1920)...')
  await page.goto('http://localhost:5173/calendar')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(outDir, 'before_calendar_1920.png'), fullPage: false })

  console.log('4. Capturing Update Status Modal (1920)...')
  await page.goto('http://localhost:5173/title/movie:936075')
  await page.waitForTimeout(2000)
  // Try to find the status button or trigger
  const statusTrigger = page.locator('button:has-text("Completed"), button:has-text("Plan to Watch"), button:has-text("Watching"), button:has-text("Update status"), [data-testid="status-btn"]').first()
  if (await statusTrigger.count() > 0) {
    await statusTrigger.click()
    await page.waitForTimeout(1000)
  }
  await page.screenshot({ path: path.join(outDir, 'before_status_1920.png'), fullPage: false })

  // 2. Mobile context (390x844)
  console.log('5. Capturing Mobile (390)...')
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mobilePage = await mobileContext.newPage()

  await mobilePage.goto('http://localhost:5173/collections/smart:favorites')
  await mobilePage.waitForTimeout(1500)
  await mobilePage.screenshot({ path: path.join(outDir, 'before_collection_390.png'), fullPage: false })

  await mobilePage.goto('http://localhost:5173/discover')
  await mobilePage.waitForTimeout(1500)
  await mobilePage.screenshot({ path: path.join(outDir, 'before_discover_390.png'), fullPage: false })

  await mobilePage.goto('http://localhost:5173/calendar')
  await mobilePage.waitForTimeout(1500)
  await mobilePage.screenshot({ path: path.join(outDir, 'before_calendar_390.png'), fullPage: false })

  await mobilePage.goto('http://localhost:5173/title/movie:936075')
  await mobilePage.waitForTimeout(1500)
  const mobileStatusTrigger = mobilePage.locator('button:has-text("Completed"), button:has-text("Plan to Watch"), button:has-text("Watching"), button:has-text("Update status"), [data-testid="status-btn"]').first()
  if (await mobileStatusTrigger.count() > 0) {
    await mobileStatusTrigger.click()
    await mobilePage.waitForTimeout(1000)
  }
  await mobilePage.screenshot({ path: path.join(outDir, 'before_status_390.png'), fullPage: false })

  await browser.close()
  console.log('All before screenshots captured successfully!')
}

run().catch(console.error)
