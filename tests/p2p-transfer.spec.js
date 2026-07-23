import { test, expect, devices } from '@playwright/test';

const joinOrCreateRoom = async (page, roomName) => {
  await page.locator('input.custom-input').fill(roomName);
  await page.locator('button:has-text("เข้าร่วมห้อง")').click();

  // If room is new, handle "สร้างห้องแบบสาธารณะ (ไม่ใช้รหัสผ่าน)" modal
  const createPublicBtn = page.locator('button:has-text("สร้างห้องแบบสาธารณะ")');
  try {
    await createPublicBtn.waitFor({ state: 'visible', timeout: 3000 });
    await createPublicBtn.click();
  } catch (e) {
    // Room already existed or modal did not pop up
  }

  await expect(page.locator('.glass-card.chat-card')).toBeVisible({ timeout: 15000 });
};

test.describe('TungShare P2P Multi-Device Integration Tests', () => {

  test('Desktop shares file ➔ Mobile downloads on 1st click (0% to 100%)', async ({ browser }) => {
    const roomName = `p2ptest-${Math.floor(Math.random() * 100000)}`;

    // 1. Create Desktop Browser Context (1280x800)
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const desktopPage = await desktopContext.newPage();

    // 2. Create Mobile Browser Context (iPhone 14 viewport + Mobile User-Agent)
    const mobileContext = await browser.newContext({
      ...devices['iPhone 14'],
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.addInitScript(() => {
      delete window.showSaveFilePicker;
    });

    console.log(`[Test]: Navigating Desktop to localhost:5173 for room [${roomName}]`);
    await desktopPage.goto('http://localhost:5173');
    await joinOrCreateRoom(desktopPage, roomName);
    console.log('[Test]: Desktop joined/created room successfully');

    // 3. Mobile joins the exact same room
    console.log(`[Test]: Navigating Mobile to localhost:5173 for room [${roomName}]`);
    await mobilePage.goto('http://localhost:5173');
    await joinOrCreateRoom(mobilePage, roomName);
    console.log('[Test]: Mobile joined room successfully');

    // Wait for peers to discover each other
    await desktopPage.waitForTimeout(2000);
    await mobilePage.waitForTimeout(2000);

    // 4. Desktop uploads/shares a test file
    console.log('[Test]: Desktop uploading dummy test file...');
    const fileInput = desktopPage.locator('.file-dropzone input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hello P2P WebTorrent from Playwright Test! '.repeat(10000)) // ~450 KB
    });

    // Verify file card appears on Desktop
    await expect(desktopPage.locator('.file-card').first()).toBeVisible({ timeout: 15000 });
    console.log('[Test]: Desktop uploaded file successfully');

    // Mobile switches to "Universal แชร์ไฟล์" tab if mobile layout is active
    const filesTabBtn = mobilePage.locator('button:has-text("แชร์ไฟล์")');
    if (await filesTabBtn.isVisible()) {
      await filesTabBtn.click();
    }

    // Verify file card appears on Mobile via room history / relay
    await expect(mobilePage.locator('.file-card').first()).toBeVisible({ timeout: 15000 });
    console.log('[Test]: Mobile received file metadata card');

    // 5. Mobile clicks "📥 เริ่มดาวน์โหลด" on 1st attempt
    console.log('[Test]: Mobile clicking download on 1st attempt...');
    const downloadBtn = mobilePage.locator('button:has-text("เริ่มดาวน์โหลด")');
    await downloadBtn.click();

    // Assert download progress reaches 100% or "ดาวน์โหลดสำเร็จ" appears
    const successLabel = mobilePage.locator('text=ดาวน์โหลดสำเร็จ').first();
    await expect(successLabel).toBeVisible({ timeout: 35000 });

    console.log('✅ SUCCESS: Mobile completed 100% download on 1st attempt!');

    await desktopContext.close();
    await mobileContext.close();
  });

  test('Instant Room Departure (0ms Leave Signal)', async ({ browser }) => {
    const roomName = `leavetest-${Math.floor(Math.random() * 100000)}`;

    const user1Context = await browser.newContext();
    const user1Page = await user1Context.newPage();

    const user2Context = await browser.newContext();
    const user2Page = await user2Context.newPage();

    await user1Page.goto('http://localhost:5173');
    await joinOrCreateRoom(user1Page, roomName);

    await user2Page.goto('http://localhost:5173');
    await joinOrCreateRoom(user2Page, roomName);

    await user1Page.waitForTimeout(1000);

    // User 2 clicks Exit Room
    const exitBtn = user2Page.locator('button.desktop-leave-btn');
    await exitBtn.click();

    // Confirm exit modal if shown
    const confirmExit = user2Page.locator('button:has-text("ยืนยันออกจากห้อง")');
    if (await confirmExit.isVisible()) {
      await confirmExit.click();
    }

    // User 1 should receive instant departure system message within 5 seconds
    await expect(user1Page.locator('text=ออกจากห้องแล้ว').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ SUCCESS: Instant departure message registered within 5 seconds!');

    await user1Context.close();
    await user2Context.close();
  });

});
