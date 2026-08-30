# MNS Portfolio — Google Apps Script Backend

โค้ดชุดนี้เป็น backend ของระบบ (REST-like API) รันบน Google Apps Script ผูกกับ Google Sheet ID
`1kFSFjl7uZ2J2LFhZ8pJp2FfM0gHhD2185gwvtpc984U` และ Google Drive folder
`1IcAcoYBS4sK9FDzQk7a1mQTM3I7Ejf-Z`

## วิธี deploy (ทำใน Apps Script editor โดยตรง — ยังไม่ได้ตั้งค่า `clasp` push อัตโนมัติ)

1. เปิด Apps Script project ที่:
   https://script.google.com/u/0/home/projects/1_r_WBYGQ4l830pNyp0PI4oyaSp1k2OJGh7GNnn4pgMIvcNjGT6Qs1xm9/edit
2. สร้างไฟล์ `.gs` ใหม่ในโปรเจกต์ให้ตรงชื่อกับไฟล์ในโฟลเดอร์นี้ทุกไฟล์ แล้ว copy เนื้อหาไปวาง:
   - `Setup.gs`
   - `SheetService.gs`
   - `Auth.gs`
   - `DriveService.gs`
   - `StudentService.gs`
   - `AcademicService.gs`
   - `PLOService.gs`
   - `PortfolioService.gs`
   - `ThesisService.gs`
   - `AdvisingService.gs`
   - `ReflectionService.gs`
   - `NotificationService.gs`
   - `MessageService.gs`
   - `ReportService.gs`
   - `DashboardService.gs`
   - `AdminService.gs`
   - `Code.gs`
3. ตั้งค่า **Script Property** สำหรับ shared secret:
   - เมนู Project Settings (รูปเฟือง) → Script Properties → Add script property
   - Key: `SHARED_SECRET`, Value: สุ่มสตริงยาวๆ (เช่น `openssl rand -hex 32` หรือ password generator) — ค่านี้ต้องตรงกับ env var `GAS_SHARED_SECRET` ที่จะตั้งใน Next.js ภายหลัง
4. รันฟังก์ชัน `setupSpreadsheet` หนึ่งครั้ง (เลือกฟังก์ชันจาก dropdown ด้านบน แล้วกด Run) เพื่อสร้างชีตทั้ง 16 ตารางพร้อม header และ dropdown validation
   - ครั้งแรกจะมี popup ขอ authorize สิทธิ์เข้าถึง Spreadsheet/Drive/Mail — กด Allow
5. รันฟังก์ชัน `seedFirstAdmin('อีเมล Gmail ของคุณ', 'ชื่อภาษาไทย', 'Name EN')` เพื่อสร้างบัญชี Admin คนแรก (แก้พารามิเตอร์ในโค้ดชั่วคราว หรือรันผ่าน Execution log แล้วใส่ค่าตรงๆ)
6. รันฟังก์ชัน `createDailyAlertTrigger` หนึ่งครั้ง เพื่อติดตั้งตัวจับเวลาแจ้งเตือนรายวัน (06:00)
7. Deploy เป็น Web App:
   - Deploy → New deployment → เลือกประเภท "Web app"
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy แล้วคัดลอก Web App URL (ลงท้ายด้วย `/exec`) — นำไปใส่ใน Next.js เป็น `GAS_WEB_APP_URL`
8. ทุกครั้งที่แก้โค้ดฝั่งนี้ ต้องทำ **New deployment** ใหม่ (หรือ Manage deployments → Edit → เพิ่มเวอร์ชัน) ไม่งั้น Web App URL จะยังใช้โค้ดเวอร์ชันเก่า

## ทดสอบเบื้องต้นก่อนต่อ frontend

ใน Apps Script editor เลือกฟังก์ชัน แล้ว "Run" ทดสอบตรงๆ ได้ เช่น:

```js
function testDashboard() {
  var caller = resolveCaller_('your-admin-email@gmail.com');
  Logger.log(JSON.stringify(getDashboard_(caller, {})));
}
```

หรือทดสอบผ่าน HTTP หลัง deploy ด้วย curl:

```bash
curl -X POST "<WEB_APP_URL>" \
  -H "Content-Type: application/json" \
  -d '{"secret":"<SHARED_SECRET>","action":"registerLoginAttempt","payload":{"email":"test@gmail.com","displayName":"Test User"}}'
```

## หมายเหตุด้านความปลอดภัย

- อย่า deploy access เป็น "Anyone" แล้วฝัง `SHARED_SECRET` ไว้ใน frontend (client bundle) เด็ดขาด — เรียก endpoint นี้จาก **Next.js server (API route)** เท่านั้น
- `callerEmail` ที่ส่งมาต้องเป็นอีเมลที่ผ่านการยืนยันจาก Google OAuth ฝั่ง NextAuth แล้ว (เซิร์ฟเวอร์เป็นคนแนบให้ ไม่ใช่ client ส่งเอง) เพื่อป้องกันการปลอมตัวเป็นคนอื่น
