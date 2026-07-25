import { test, expect, devices } from '@playwright/test';

test('test download then upload same file', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  
  const consoleLogsB = [];
  pageB.on('console', msg => consoleLogsB.push('B: ' + msg.text()));
  pageB.on('pageerror', err => consoleLogsB.push('B PAGE_ERROR: ' + err.message));

  await pageA.goto('http://localhost:5173');
  await pageA.locator('input.custom-input').fill('dupe-room');
  await pageA.locator('button:has-text("เข้าร่วมห้อง")').click();
  
  const createPublicBtn = pageA.locator('button:has-text("สร้างห้องแบบสาธารณะ")');
  try {
    await createPublicBtn.waitFor({ state: 'visible', timeout: 3000 });
    await createPublicBtn.click();
  } catch (e) {}

  await expect(pageA.locator('.glass-card.chat-card')).toBeVisible({ timeout: 15000 });

  await pageB.goto('http://localhost:5173');
  await pageB.locator('input.custom-input').fill('dupe-room');
  await pageB.locator('button:has-text("เข้าร่วมห้อง")').click();
  await expect(pageB.locator('.glass-card.chat-card')).toBeVisible({ timeout: 15000 });

  const buf = Buffer.from('hello world 123');

  // A uploads
  await pageA.locator('.file-dropzone input[type="file"]').setInputFiles({
    name: 'test1.txt',
    mimeType: 'text/plain',
    buffer: buf
  });
  
  // B downloads
  await pageB.locator('button:has-text("แชร์ไฟล์")').click();
  await expect(pageB.locator('.file-card').first()).toBeVisible({ timeout: 10000 });
  await pageB.locator('button:has-text("เริ่มดาวน์โหลด")').first().click();
  await expect(pageB.locator('text=ดาวน์โหลดสำเร็จ').first()).toBeVisible({ timeout: 15000 });
  
  // B uploads same file
  await pageB.locator('button:has-text("แชร์ไฟล์")').click();
  await pageB.locator('.file-dropzone input[type="file"]').setInputFiles({
    name: 'test1.txt',
    mimeType: 'text/plain',
    buffer: buf
  });
  
  await pageB.waitForTimeout(3000);
  
  console.log("Console Logs B:\n", consoleLogsB.join('\n'));
});
