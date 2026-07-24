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

test.describe('Late Joiner History Relay Verification', () => {

  test('User joining room AFTER file upload should receive history and download the file', async ({ browser }) => {
    const roomName = `latejoin-room-${Math.floor(Math.random() * 100000)}`;

    // 1. Desktop joins room FIRST
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0'
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.addInitScript(() => { delete window.showSaveFilePicker; });

    await desktopPage.goto('http://localhost:5173');
    await joinOrCreateRoom(desktopPage, roomName);

    // 2. Desktop uploads a file BEFORE mobile joins
    console.log('[Test]: Desktop uploading file before Mobile joins...');
    const dummyBuffer = Buffer.from('Late Joiner Test File Payload Data! '.repeat(2000));
    await desktopPage.locator('.file-dropzone input[type="file"]').setInputFiles({
      name: 'pre_uploaded_doc.pdf',
      mimeType: 'application/pdf',
      buffer: dummyBuffer
    });

    await desktopPage.waitForTimeout(2000);

    // 3. Mobile joins the room LATER (after the file was already uploaded)
    console.log('[Test]: Mobile joining room LATER...');
    const mobileContext = await browser.newContext({ ...devices['iPhone 14'] });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.addInitScript(() => { delete window.showSaveFilePicker; });

    await mobilePage.goto('http://localhost:5173');
    await joinOrCreateRoom(mobilePage, roomName);

    // Switch to files tab on mobile
    const filesTabBtn = mobilePage.locator('button:has-text("แชร์ไฟล์")');
    if (await filesTabBtn.isVisible()) {
      await filesTabBtn.click();
    }

    // Mobile should see the pre-uploaded file card via History Relay!
    console.log('[Test]: Mobile checking for pre-uploaded file card...');
    const fileCard = mobilePage.locator('.file-card', { hasText: 'pre_uploaded_doc.pdf' });
    await expect(fileCard).toBeVisible({ timeout: 10000 });
    console.log('[Test]: Mobile successfully received pre-uploaded file card from room history!');

    // 4. Mobile clicks download
    console.log('[Test]: Mobile clicking download on pre-uploaded file...');
    await fileCard.locator('button:has-text("เริ่มดาวน์โหลด")').click();
    await expect(fileCard.locator('text=ดาวน์โหลดสำเร็จ')).toBeVisible({ timeout: 20000 });
    console.log('✅ SUCCESS: Late joining user successfully received and downloaded pre-uploaded file!');

    await desktopContext.close();
    await mobileContext.close();
  });

});
