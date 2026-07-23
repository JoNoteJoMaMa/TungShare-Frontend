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
- strong: 🦅 นกกาผู้มีบุญบารมี
- text: "23:10 ดาวน์โหลด: 0% สปีด: 0 MB/s"
- button "🚪 ออกจากห้อง"
- text: 🦞 กุ้งกุลาดำผู้ใจดี
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
  30  |     desktopPage.on('console', msg => console.log('[Desktop Console]:', msg.text()));
  31  | 
  32  |     // 2. Create Mobile Browser Context (iPhone 14 viewport + Mobile User-Agent)
  33  |     const mobileContext = await browser.newContext({
  34  |       ...devices['iPhone 14'],
  35  |     });
  36  |     const mobilePage = await mobileContext.newPage();
  37  |     mobilePage.on('console', msg => console.log('[Mobile Console]:', msg.text()));
  38  |     await mobilePage.addInitScript(() => {
  39  |       delete window.showSaveFilePicker;
  40  |     });
  41  | 
  42  |     console.log(`[Test]: Navigating Desktop to localhost:5173 for room [${roomName}]`);
  43  |     await desktopPage.goto('http://localhost:5173');
  44  |     await joinOrCreateRoom(desktopPage, roomName);
  45  |     console.log('[Test]: Desktop joined/created room successfully');
  46  | 
  47  |     // 3. Mobile joins the exact same room
  48  |     console.log(`[Test]: Navigating Mobile to localhost:5173 for room [${roomName}]`);
  49  |     await mobilePage.goto('http://localhost:5173');
  50  |     await joinOrCreateRoom(mobilePage, roomName);
  51  |     console.log('[Test]: Mobile joined room successfully');
  52  | 
  53  |     // Wait for peers to discover each other
  54  |     await desktopPage.waitForTimeout(2000);
  55  |     await mobilePage.waitForTimeout(2000);
  56  | 
  57  |     // 4. Desktop uploads/shares a test file
  58  |     console.log('[Test]: Desktop uploading dummy test file...');
  59  |     const fileInput = desktopPage.locator('.file-dropzone input[type="file"]');
  60  |     await fileInput.setInputFiles({
  61  |       name: 'test-document.txt',
  62  |       mimeType: 'text/plain',
  63  |       buffer: Buffer.from('Hello P2P WebTorrent from Playwright Test! '.repeat(10000)) // ~450 KB
  64  |     });
  65  | 
  66  |     // Verify file card appears on Desktop
  67  |     await expect(desktopPage.locator('.file-card').first()).toBeVisible({ timeout: 15000 });
  68  |     console.log('[Test]: Desktop uploaded file successfully');
  69  | 
  70  |     // Mobile switches to "Universal แชร์ไฟล์" tab if mobile layout is active
  71  |     const filesTabBtn = mobilePage.locator('button:has-text("แชร์ไฟล์")');
  72  |     if (await filesTabBtn.isVisible()) {
  73  |       await filesTabBtn.click();
  74  |     }
  75  | 
  76  |     // Verify file card appears on Mobile via room history / relay
  77  |     await expect(mobilePage.locator('.file-card').first()).toBeVisible({ timeout: 15000 });
  78  |     console.log('[Test]: Mobile received file metadata card');
  79  | 
  80  |     // 5. Mobile clicks "📥 เริ่มดาวน์โหลด" on 1st attempt
  81  |     console.log('[Test]: Mobile clicking download on 1st attempt...');
  82  |     const downloadBtn = mobilePage.locator('button:has-text("เริ่มดาวน์โหลด")');
  83  |     await downloadBtn.click();
  84  | 
  85  |     // Assert download progress reaches 100% or "ดาวน์โหลดสำเร็จ" appears
  86  |     const successLabel = mobilePage.locator('text=ดาวน์โหลดสำเร็จ').first();
> 87  |     await expect(successLabel).toBeVisible({ timeout: 35000 });
      |                                ^ Error: expect(locator).toBeVisible() failed
  88  | 
  89  |     console.log('✅ SUCCESS: Mobile completed 100% download on 1st attempt!');
  90  | 
  91  |     await desktopContext.close();
  92  |     await mobileContext.close();
  93  |   });
  94  | 
  95  |   test('Instant Room Departure (0ms Leave Signal)', async ({ browser }) => {
  96  |     const roomName = `leavetest-${Math.floor(Math.random() * 100000)}`;
  97  | 
  98  |     const user1Context = await browser.newContext();
  99  |     const user1Page = await user1Context.newPage();
  100 | 
  101 |     const user2Context = await browser.newContext();
  102 |     const user2Page = await user2Context.newPage();
  103 | 
  104 |     await user1Page.goto('http://localhost:5173');
  105 |     await joinOrCreateRoom(user1Page, roomName);
  106 | 
  107 |     await user2Page.goto('http://localhost:5173');
  108 |     await joinOrCreateRoom(user2Page, roomName);
  109 | 
  110 |     await user1Page.waitForTimeout(1000);
  111 | 
  112 |     // User 2 clicks Exit Room
  113 |     const exitBtn = user2Page.locator('button.desktop-leave-btn');
  114 |     await exitBtn.click();
  115 | 
  116 |     // Confirm exit modal if shown
  117 |     const confirmExit = user2Page.locator('button:has-text("ยืนยันออกจากห้อง")');
  118 |     if (await confirmExit.isVisible()) {
  119 |       await confirmExit.click();
  120 |     }
  121 | 
  122 |     // User 1 should receive instant departure system message within 5 seconds
  123 |     await expect(user1Page.locator('text=ออกจากห้องแล้ว').first()).toBeVisible({ timeout: 5000 });
  124 |     console.log('✅ SUCCESS: Instant departure message registered within 5 seconds!');
  125 | 
  126 |     await user1Context.close();
  127 |     await user2Context.close();
  128 |   });
  129 | 
  130 | });
  131 | 
```