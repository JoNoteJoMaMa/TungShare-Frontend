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

// Build a reproducible binary payload with a known pattern for byte-level verification
function buildVerifiablePayload(sizeBytes) {
  const buf = Buffer.alloc(sizeBytes);
  for (let i = 0; i < sizeBytes; i++) {
    buf[i] = i % 256; // 0x00 → 0xFF repeating — full byte range including high bytes
  }
  return buf;
}

async function runIntegrityTest(browser, fileSizeKB) {
  const roomName = `integrity-room-${Math.floor(Math.random() * 100000)}`;
  const FILE_SIZE = fileSizeKB * 1024;
  const verifiablePayload = buildVerifiablePayload(FILE_SIZE);

  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0'
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.addInitScript(() => { delete window.showSaveFilePicker; });

  const mobileContext = await browser.newContext({ ...devices['iPhone 14'] });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.addInitScript(() => { delete window.showSaveFilePicker; });

  let capturedBlobBytes = null;
  await mobilePage.exposeFunction('reportBlobBytes', (chunks) => {
    // chunks is an array of base64 strings, one per 32 KB slice
    // Each is independently decodable — reconstruct full file by concatenating decoded buffers
    const buffers = chunks.map(c => Buffer.from(c, 'base64'));
    capturedBlobBytes = Buffer.concat(buffers);
  });
  await mobilePage.addInitScript(() => {
    const origCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function(blob) {
      const url = origCreateObjectURL(blob);
      blob.arrayBuffer().then(buf => {
        const bytes = new Uint8Array(buf);
        const CHUNK = 32 * 1024;
        const totalChunks = Math.ceil(bytes.length / CHUNK);
        const parts = [];
        for (let c = 0; c < totalChunks; c++) {
          const slice = bytes.subarray(c * CHUNK, Math.min((c + 1) * CHUNK, bytes.length));
          let s = '';
          for (let i = 0; i < slice.length; i++) s += String.fromCharCode(slice[i]);
          parts.push(btoa(s));
        }
        // Pass as array — NOT joined string (joining breaks base64 padding at chunk boundaries)
        window.reportBlobBytes(parts);
      });
      return url;
    };
  });

  await desktopPage.goto('http://localhost:5173');
  await joinOrCreateRoom(desktopPage, roomName);

  await mobilePage.goto('http://localhost:5173');
  await joinOrCreateRoom(mobilePage, roomName);
  await desktopPage.waitForTimeout(1500);

  console.log(`[Integrity ${fileSizeKB} KB]: Uploading binary test file with 0x00-0xFF pattern...`);
  await desktopPage.locator('.file-dropzone input[type="file"]').setInputFiles({
    name: `integrity_test_${fileSizeKB}kb.bin`,
    mimeType: 'application/octet-stream',
    buffer: verifiablePayload
  });

  const filesTabBtn = mobilePage.locator('button:has-text("แชร์ไฟล์")');
  if (await filesTabBtn.isVisible()) await filesTabBtn.click();
  await expect(mobilePage.locator('.file-card').first()).toBeVisible({ timeout: 10000 });

  console.log(`[Integrity ${fileSizeKB} KB]: Mobile downloading...`);
  await mobilePage.locator('button:has-text("เริ่มดาวน์โหลด")').click();
  await expect(mobilePage.locator('text=ดาวน์โหลดสำเร็จ').first()).toBeVisible({ timeout: 40000 });
  await mobilePage.waitForTimeout(500);

  if (capturedBlobBytes === null) {
    await desktopContext.close();
    await mobileContext.close();
    throw new Error('❌ No blob bytes captured');
  }

  // Reassemble from properly decoded chunks
  const allBytes = capturedBlobBytes;
  console.log(`[Integrity ${fileSizeKB} KB]: Expected ${FILE_SIZE} bytes | Got ${allBytes.length} bytes`);
  expect(allBytes.length).toBe(FILE_SIZE);

  let firstMismatch = -1;
  for (let i = 0; i < FILE_SIZE; i++) {
    if (allBytes[i] !== i % 256) { firstMismatch = i; break; }
  }

  await desktopContext.close();
  await mobileContext.close();

  if (firstMismatch !== -1) {
    throw new Error(`❌ CORRUPTION at byte offset ${firstMismatch} (${fileSizeKB} KB file)`);
  }
  console.log(`✅ INTEGRITY PASS [${fileSizeKB} KB]: All ${FILE_SIZE} bytes match perfectly!`);
}

test.describe('File Integrity Verification (Corruption Detection)', () => {

  test('150 KB binary file — full 0x00-0xFF byte range (crosses 4+ chunk boundaries)', async ({ browser }) => {
    await runIntegrityTest(browser, 150);
  });

  test('500 KB binary file — larger multi-chunk transfer', async ({ browser }) => {
    await runIntegrityTest(browser, 500);
  });

  test('2048 KB (2 MB) binary file — stress test for large file integrity', async ({ browser }) => {
    await runIntegrityTest(browser, 2048);
  });

});
