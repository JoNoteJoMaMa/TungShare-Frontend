import { chromium } from 'playwright';

const TARGET_URL = 'https://tungshare-osl2m7mi4-jonotejomamas-projects.vercel.app/';
const ROOM_NAME = 'room_' + Math.floor(Math.random() * 10000);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all browser console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Collect all network failures
  const networkErrors = [];
  page.on('requestfailed', req => {
    networkErrors.push(`FAILED: ${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });

  const wsConnections = [];
  page.on('websocket', ws => {
    wsConnections.push(`WS OPENED: ${ws.url()}`);
    ws.on('socketerror', err => wsConnections.push(`WS ERROR: ${ws.url()} — ${err}`));
    ws.on('close', () => wsConnections.push(`WS CLOSED: ${ws.url()}`));
  });

  console.log(`[Test]: Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL);
  await page.fill('.custom-input', ROOM_NAME);
  await page.click('button:has-text("เข้าร่วมห้อง")');

  // Wait 5 seconds to capture all events
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/Users/polly/.gemini/antigravity-ide/brain/016334bd-7ba5-4d51-be53-96cab563b96f/diag_after_5s.png' });

  console.log('\n--- CONSOLE LOGS ---');
  consoleLogs.forEach(l => console.log(l));

  console.log('\n--- NETWORK ERRORS ---');
  networkErrors.forEach(l => console.log(l));

  console.log('\n--- WEBSOCKET CONNECTIONS ---');
  wsConnections.forEach(l => console.log(l));

  await browser.close();
})();
