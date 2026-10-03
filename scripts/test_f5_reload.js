const { chromium } = require('playwright');

(async () => {
  console.log('Testing F5 reload persistence on https://trendpulse-live.web.app...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Loading site initial visit...');
  await page.goto('https://trendpulse-live.web.app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('2. Simulating standard F5 reload (page.reload())...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const cricketVisible = await page.locator('#cricket-match-center').isVisible();
  const pollVisible = await page.locator('#interactive-poll-section').isVisible();
  const indWiCard = (await page.locator('#cricket-cards-container:has-text("West Indies")').count()) > 0;

  console.log('Cricket Center visible on F5:', cricketVisible);
  console.log('Poll section visible on F5:', pollVisible);
  console.log('IND vs WI card present on F5:', indWiCard);

  if (cricketVisible && pollVisible && indWiCard) {
    console.log('✅ TEST PASSED: F5 Reload preserves Cricket Match Center & Poll!');
  } else {
    console.error('❌ TEST FAILED: Elements missing on F5 reload');
    process.exitCode = 1;
  }
  await browser.close();
})();
