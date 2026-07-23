# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: p2p-transfer.spec.js >> TungShare P2P Multi-Device Integration Tests >> Desktop shares file ➔ Mobile downloads on 1st click (0% to 100%)
- Location: tests/p2p-transfer.spec.js:21:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=ดาวน์โหลดสำเร็จ').first()
Expected: visible
Timeout: 35000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 35000ms
  - waiting for locator('text=ดาวน์โหลดสำเร็จ').first()

```

```yaml
- banner:
  - heading "🚀 TungShare P2P Network" [level=1]
  - paragraph: ส่งข้อความและแชร์ไฟล์ขนาดไม่จำกัด ผ่านระบบ WebRTC & BitTorrent Peer-to-Peer
- button "💬 ข้อความแชต"
- button "📦 Universal แชร์ไฟล์ (1)"
- text: 📦 Universal BitTorrent Share ทุกประเภทไฟล์
- button "Choose File"
- text: "📁 ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกหลายไฟล์ รองรับเลือกหลายไฟล์พร้อมกัน: วิดีโอ, เสียง, รูปภาพ, เอกสาร, Zip ฯลฯ กำลังเชื่อมต่อโหนด P2P เพื่อสตรีมไฟล์ [test-document.txt]... test-document.txt 419.92 KB ผู้ส่ง:"
- strong: 🦘 จิงโจ้ผู้มีสัจจะวาจา
- text: "22:53 ดาวน์โหลด: 0% สปีด: 0 MB/s"
- button "🚪 ออกจากห้อง"
- text: 🐪 อูฐผู้มีวิริยะ
```

# Test source

```ts
  1   | import { test, expect, devices } from '@playwright/test';
  2   | 
  3   | const joinOrCreateRoom = async (page, roomName) => {
  4   |   await page.locator('input.custom-input').fill(roomName);
  5   |   await page.locator('button:has-text("เข้าร่วมห้อง")').click();
  6   | 
  7   |   // If room is new, handle "สร้างห้องแบบสาธารณะ (ไม่ใช้รหัสผ่าน)" modal
  8   |   const createPublicBtn = page.locator('button:has-text("สร้างห้องแบบสาธารณะ")');
  9   |   try {
  10  |     await createPublicBtn.waitFor({ state: 'visible', timeout: 3000 });
  11  |     await createPublicBtn.click();
  12  |   } catch (e) {
  13  |     // Room already existed or modal did not pop up
  14  |   }
  15  | 
  16  |   await expect(page.locator('.glass-card.chat-card')).toBeVisible({ timeout: 15000 });
  17  | };
  18  | 
  19  | test.describe('TungShare P2P Multi-Device Integration Tests', () => {
  20  | 
  21  |   test('Desktop shares file ➔ Mobile downloads on 1st click (0% to 100%)', async ({ browser }) => {
  22  |     const roomName = `p2ptest-${Math.floor(Math.random() * 100000)}`;
  23  | 
  24  |     // 1. Create Desktop Browser Context (1280x800)
  25  |     const desktopContext = await browser.newContext({
  26  |       viewport: { width: 1280, height: 800 },
  27  |       userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  28  |     });
  29  |     const desktopPage = await desktopContext.newPage();
  30  | 
  31  |     // 2. Create Mobile Browser Context (iPhone 14 viewport + Mobile User-Agent)
  32  |     const mobileContext = await browser.newContext({
  33  |       ...devices['iPhone 14'],
  34  |     });
  35  |     const mobilePage = await mobileContext.newPage();
  36  |     await mobilePage.addInitScript(() => {
  37  |       delete window.showSaveFilePicker;
  38  |     });
  39  | 
  40  |     console.log(`[Test]: Navigating Desktop to localhost:5173 for room [${roomName}]`);
  41  |     await desktopPage.goto('http://localhost:5173');
  42  |     await joinOrCreateRoom(desktopPage, roomName);
  43  |     console.log('[Test]: Desktop joined/created room successfully');
  44  | 
  45  |     // 3. Mobile joins the exact same room
  46  |     console.log(`[Test]: Navigating Mobile to localhost:5173 for room [${roomName}]`);
  47  |     await mobilePage.goto('http://localhost:5173');
  48  |     await joinOrCreateRoom(mobilePage, roomName);
  49  |     console.log('[Test]: Mobile joined room successfully');
  50  | 
  51  |     // Wait for peers to discover each other
  52  |     await desktopPage.waitForTimeout(2000);
  53  |     await mobilePage.waitForTimeout(2000);
  54  | 
  55  |     // 4. Desktop uploads/shares a test file
  56  |     console.log('[Test]: Desktop uploading dummy test file...');
  57  |     const fileInput = desktopPage.locator('.file-dropzone input[type="file"]');
  58  |     await fileInput.setInputFiles({
  59  |       name: 'test-document.txt',
  60  |       mimeType: 'text/plain',
  61  |       buffer: Buffer.from('Hello P2P WebTorrent from Playwright Test! '.repeat(10000)) // ~450 KB
  62  |     });
  63  | 
  64  |     // Verify file card appears on Desktop
  65  |     await expect(desktopPage.locator('.file-card').first()).toBeVisible({ timeout: 15000 });
  66  |     console.log('[Test]: Desktop uploaded file successfully');
  67  | 
  68  |     // Mobile switches to "Universal แชร์ไฟล์" tab if mobile layout is active
  69  |     const filesTabBtn = mobilePage.locator('button:has-text("แชร์ไฟล์")');
  70  |     if (await filesTabBtn.isVisible()) {
  71  |       await filesTabBtn.click();
  72  |     }
  73  | 
  74  |     // Verify file card appears on Mobile via room history / relay
  75  |     await expect(mobilePage.locator('.file-card').first()).toBeVisible({ timeout: 15000 });
  76  |     console.log('[Test]: Mobile received file metadata card');
  77  | 
  78  |     // 5. Mobile clicks "📥 เริ่มดาวน์โหลด" on 1st attempt
  79  |     console.log('[Test]: Mobile clicking download on 1st attempt...');
  80  |     const downloadBtn = mobilePage.locator('button:has-text("เริ่มดาวน์โหลด")');
  81  |     await downloadBtn.click();
  82  | 
  83  |     // Assert download progress reaches 100% or "ดาวน์โหลดสำเร็จ" appears
  84  |     const successLabel = mobilePage.locator('text=ดาวน์โหลดสำเร็จ').first();
> 85  |     await expect(successLabel).toBeVisible({ timeout: 35000 });
      |                                ^ Error: expect(locator).toBeVisible() failed
  86  | 
  87  |     console.log('✅ SUCCESS: Mobile completed 100% download on 1st attempt!');
  88  | 
  89  |     await desktopContext.close();
  90  |     await mobileContext.close();
  91  |   });
  92  | 
  93  |   test('Instant Room Departure (0ms Leave Signal)', async ({ browser }) => {
  94  |     const roomName = `leavetest-${Math.floor(Math.random() * 100000)}`;
  95  | 
  96  |     const user1Context = await browser.newContext();
  97  |     const user1Page = await user1Context.newPage();
  98  | 
  99  |     const user2Context = await browser.newContext();
  100 |     const user2Page = await user2Context.newPage();
  101 | 
  102 |     await user1Page.goto('http://localhost:5173');
  103 |     await joinOrCreateRoom(user1Page, roomName);
  104 | 
  105 |     await user2Page.goto('http://localhost:5173');
  106 |     await joinOrCreateRoom(user2Page, roomName);
  107 | 
  108 |     await user1Page.waitForTimeout(1000);
  109 | 
  110 |     // User 2 clicks Exit Room
  111 |     const exitBtn = user2Page.locator('button.desktop-leave-btn');
  112 |     await exitBtn.click();
  113 | 
  114 |     // Confirm exit modal if shown
  115 |     const confirmExit = user2Page.locator('button:has-text("ยืนยันออกจากห้อง")');
  116 |     if (await confirmExit.isVisible()) {
  117 |       await confirmExit.click();
  118 |     }
  119 | 
  120 |     // User 1 should receive instant departure system message within 5 seconds
  121 |     await expect(user1Page.locator('text=ออกจากห้องแล้ว').first()).toBeVisible({ timeout: 5000 });
  122 |     console.log('✅ SUCCESS: Instant departure message registered within 5 seconds!');
  123 | 
  124 |     await user1Context.close();
  125 |     await user2Context.close();
  126 |   });
  127 | 
  128 | });
  129 | 
```