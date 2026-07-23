import { chromium } from 'playwright';

const TARGET_URL = 'https://tungshare-osl2m7mi4-jonotejomamas-projects.vercel.app/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const wsConnections = [];
  page.on('websocket', ws => {
    wsConnections.push(`WS OPENED: ${ws.url()}`);
    ws.on('socketerror', err => wsConnections.push(`WS ERROR: ${err}`));
    ws.on('close', () => wsConnections.push(`WS CLOSED: ${ws.url()}`));
  });

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  await page.goto(TARGET_URL);
  await page.fill('.custom-input', 'diag_room');
  await page.click('button:has-text("เข้าร่วมห้อง")');

  // Wait longer to catch any connection events
  await page.waitForTimeout(8000);
  await page.screenshot({ path: '/Users/polly/.gemini/antigravity-ide/brain/016334bd-7ba5-4d51-be53-96cab563b96f/diag_8s.png' });

  console.log('\n--- WebSocket Log ---');
  wsConnections.forEach(l => console.log(l));
  console.log('\n--- Console Logs ---');
  consoleLogs.forEach(l => console.log(l));

  await browser.close();
})();
