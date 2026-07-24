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

test.describe('Re-uploading Downloaded File Verification', () => {

  test('Downloader should be able to re-upload and seed the exact same downloaded file', async ({ browser }) => {
    const roomName = `reupload-room-${Math.floor(Math.random() * 100000)}`;

    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0'
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.addInitScript(() => { delete window.showSaveFilePicker; });

    const mobileContext = await browser.newContext({ ...devices['iPhone 14'] });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.addInitScript(() => { delete window.showSaveFilePicker; });

    await desktopPage.goto('http://localhost:5173');
    await joinOrCreateRoom(desktopPage, roomName);

    await mobilePage.goto('http://localhost:5173');
    await joinOrCreateRoom(mobilePage, roomName);

    await desktopPage.waitForTimeout(1500);

    // 1. Desktop uploads test file
    console.log('[Test]: Desktop uploading initial test file...');
    const dummyBuffer = Buffer.from('Testing Re-upload Feature for WebTorrent Swarm! '.repeat(5000));
    await desktopPage.locator('.file-dropzone input[type="file"]').setInputFiles({
      name: 'IMG_8169.jpeg',
      mimeType: 'image/jpeg',
      buffer: dummyBuffer
    });

    // Switch to files tab on mobile
    const filesTabBtn = mobilePage.locator('button:has-text("แชร์ไฟล์")');
    if (await filesTabBtn.isVisible()) {
      await filesTabBtn.click();
    }

    await expect(mobilePage.locator('.file-card').first()).toBeVisible({ timeout: 10000 });

    // 2. Mobile downloads the file
    console.log('[Test]: Mobile downloading file...');
    await mobilePage.locator('button:has-text("เริ่มดาวน์โหลด")').click();
    await expect(mobilePage.locator('text=ดาวน์โหลดสำเร็จ').first()).toBeVisible({ timeout: 20000 });
    console.log('[Test]: Mobile completed download successfully!');

    // 3. Mobile attempts to re-upload the EXACT same downloaded file
    console.log('[Test]: Mobile attempting to re-upload the exact same file (IMG_8169.jpeg)...');
    const mobileFileInput = mobilePage.locator('.file-dropzone input[type="file"]');
    await mobileFileInput.setInputFiles({
      name: 'IMG_8169.jpeg',
      mimeType: 'image/jpeg',
      buffer: dummyBuffer
    });

    // Mobile should see its status updated to seeder without getting stuck
    await expect(mobilePage.locator('text=ปล่อย').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ SUCCESS: Re-uploaded downloaded file successfully converted to active Seeder!');

    await desktopContext.close();
    await mobileContext.close();
  });

});
