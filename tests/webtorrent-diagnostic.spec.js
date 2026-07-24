import { test, expect, devices } from '@playwright/test';

const joinOrCreateRoom = async (page, roomName) => {
  await page.locator('input.custom-input').fill(roomName);
  await page.locator('button:has-text("เข้าร่วมห้อง")').click();

  const createPublicBtn = page.locator('button:has-text("สร้างห้องแบบสาธารณะ")');
  try {
    await createPublicBtn.waitFor({ state: 'visible', timeout: 3000 });
    await createPublicBtn.click();
  } catch (e) {}

  await expect(page.locator('.glass-card.chat-card')).toBeVisible({ timeout: 15000 });
};

test.describe('WebTorrent Diagnostic Desktop vs Mobile Simulation', () => {

  test('Simulate Desktop Seeder and Mobile Downloader pure WebTorrent transfer', async ({ browser }) => {
    const roomName = `diag-webtorrent-${Math.floor(Math.random() * 100000)}`;

    // 1. Desktop Browser Context
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0'
    });
    const desktopPage = await desktopContext.newPage();
    desktopPage.on('console', msg => console.log('[Desktop Console]:', msg.text()));
    await desktopPage.addInitScript(() => {
      delete window.showSaveFilePicker;
    });

    // 2. Mobile Browser Context (iPhone 14 emulation)
    const mobileContext = await browser.newContext({
      ...devices['iPhone 14']
    });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('console', msg => console.log('[Mobile Console]:', msg.text()));
    await mobilePage.addInitScript(() => {
      delete window.showSaveFilePicker;
    });

    console.log(`[Diagnostic Test]: Joining room [${roomName}] on Desktop...`);
    await desktopPage.goto('http://localhost:5173');
    await joinOrCreateRoom(desktopPage, roomName);

    console.log(`[Diagnostic Test]: Joining room [${roomName}] on Mobile...`);
    await mobilePage.goto('http://localhost:5173');
    await joinOrCreateRoom(mobilePage, roomName);

    // Wait for room signaling & peer status sync
    await desktopPage.waitForTimeout(2000);
    await mobilePage.waitForTimeout(2000);

    // 3. Desktop uploads test file
    console.log('[Diagnostic Test]: Desktop uploading 450 KB payload...');
    const fileInput = desktopPage.locator('.file-dropzone input[type="file"]');
    const dummyBuffer = Buffer.from('Hello P2P WebTorrent from Playwright Test! '.repeat(10000)); // ~450 KB
    await fileInput.setInputFiles({
      name: 'diagnostic-payload.txt',
      mimeType: 'text/plain',
      buffer: dummyBuffer
    });

    await expect(desktopPage.locator('.file-card').first()).toBeVisible({ timeout: 15000 });
    console.log('[Diagnostic Test]: Desktop file card rendered.');

    // Switch to files tab on mobile if mobile tab navigation is present
    const filesTabBtn = mobilePage.locator('button:has-text("แชร์ไฟล์")');
    if (await filesTabBtn.isVisible()) {
      await filesTabBtn.click();
    }

    await expect(mobilePage.locator('.file-card').first()).toBeVisible({ timeout: 15000 });
    console.log('[Diagnostic Test]: File metadata visible on Mobile.');

    // 4. Mobile initiates download
    console.log('[Diagnostic Test]: Mobile clicking download button...');
    const downloadBtn = mobilePage.locator('button:has-text("เริ่มดาวน์โหลด")');
    await downloadBtn.click();

    const startTime = Date.now();
    const successText = mobilePage.locator('text=ดาวน์โหลดสำเร็จ').first();
    await expect(successText).toBeVisible({ timeout: 35000 });
    const duration = (Date.now() - startTime) / 1000;

    console.log(`⚡ [SUCCESS]: Pure WebTorrent transfer completed in ${duration.toFixed(2)}s!`);

    await desktopContext.close();
    await mobileContext.close();
  });

});
