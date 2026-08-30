# M.N.S. Portfolio — ระบบแฟ้มสะสมผลงานและติดตามความก้าวหน้านักศึกษา

หลักสูตรพยาบาลศาสตรมหาบัณฑิต สาขาการพยาบาลผู้ใหญ่และผู้สูงอายุ คณะพยาบาลศาสตร์ มหาวิทยาลัยธรรมศาสตร์

## โครงสร้างโปรเจกต์

```
/webapp        Next.js 14 + TypeScript + Tailwind CSS (frontend, deploy บน Vercel)
/gas-backend   Google Apps Script backend (.gs files, ต้อง copy เข้า Apps Script editor)
/docs          เอกสารเพิ่มเติม (ว่าง — ใช้เก็บไฟล์อ้างอิงถ้าต้องการ)
```

ไฟล์ requirement ต้นฉบับ (.docx / .pdf) และ mockup (.png) อยู่ที่ root ของ repo นี้

## สถาปัตยกรรม

```
Browser --Google Sign-In--> Next.js (Vercel) --server-side proxy--> Google Apps Script Web App
                                                                          |
                                                                     Google Sheets (DB)
                                                                     Google Drive (ไฟล์แนบ)
```

- **Auth**: NextAuth.js + Google Provider รับทุกบัญชี Gmail แต่ Admin ต้อง whitelist ใน Google Sheet ก่อนถึงเข้าใช้งานได้จริง
- **API**: ทุก action เรียกผ่าน `/api/gas` (Next.js server route) ซึ่งแนบ shared secret และอีเมลผู้ login (ตรวจสอบแล้วจาก session) ไปยัง Apps Script Web App — secret ไม่เคยหลุดไปที่ browser
- **DB**: Google Sheets ID `1kFSFjl7uZ2J2LFhZ8pJp2FfM0gHhD2185gwvtpc984U` (16 ชีต ดู `gas-backend/Setup.gs`)
- **ไฟล์แนบ**: Google Drive folder `1IcAcoYBS4sK9FDzQk7a1mQTM3I7Ejf-Z` (สร้าง subfolder อัตโนมัติต่อนักศึกษา 1 คน)

## ขั้นตอน Deploy (ทำตามลำดับ)

### 1. ตั้งค่า Google Apps Script backend

ทำตามคู่มือใน [`gas-backend/README.md`](gas-backend/README.md) — สรุปคร่าวๆ:
1. Copy ไฟล์ `.gs` ทั้งหมดเข้า Apps Script project
2. ตั้ง Script Property `SHARED_SECRET`
3. รัน `setupSpreadsheet()` เพื่อสร้างชีตทั้งหมด
4. รัน `seedFirstAdmin(email, nameTH, nameEN)` เพื่อสร้าง Admin คนแรก
5. รัน `createDailyAlertTrigger()` เพื่อติดตั้งการแจ้งเตือนรายวัน
6. Deploy เป็น Web App (Execute as Me, Access: Anyone) → คัดลอก URL

### 2. ตั้งค่า Google OAuth Client

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/) → สร้างโปรเจกต์ (หรือใช้โปรเจกต์เดิม)
2. APIs & Services → OAuth consent screen → ตั้งค่า (External หรือ Internal ตามความเหมาะสมของบัญชี Google Workspace ของคณะ)
3. APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application
4. Authorized redirect URIs ใส่:
   - `http://localhost:3000/api/auth/callback/google` (สำหรับทดสอบ local)
   - `https://<your-vercel-domain>/api/auth/callback/google` (production — เพิ่มทีหลังหลัง deploy Vercel ได้โดเมนแล้ว)
5. คัดลอก Client ID และ Client Secret

### 3. รันทดสอบ local

```bash
cd webapp
npm install
cp .env.local.example .env.local
# แก้ .env.local ใส่ค่า Google OAuth, GAS_WEB_APP_URL, GAS_SHARED_SECRET
# NEXTAUTH_SECRET สร้างด้วย: openssl rand -base64 32
npm run dev
```

เปิด http://localhost:3000 ทดสอบ Sign in with Google ด้วยอีเมลที่ seed เป็น Admin ไว้แล้วในขั้นตอนที่ 1

### 4. Push ขึ้น GitHub

Repo ปลายทาง: `https://github.com/arpasree104/MS-Portfolio-Claude.git` (ผูก remote ไว้แล้ว)

```bash
git add .
git commit -m "Initial commit: MNS Portfolio system"
git push -u origin main
```

### 5. Deploy บน Vercel

1. เข้า [vercel.com](https://vercel.com/) → New Project → Import จาก GitHub repo นี้
2. **สำคัญ**: ตั้งค่า Root Directory เป็น `webapp` (ไม่ใช่ root ของ repo เพราะ Next.js อยู่ใน subfolder)
3. ใส่ Environment Variables (เหมือนกับ `.env.local` แต่ `NEXTAUTH_URL` ใส่โดเมน production เช่น `https://your-app.vercel.app`):
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GAS_WEB_APP_URL`
   - `GAS_SHARED_SECRET`
4. Deploy
5. กลับไปที่ Google Cloud Console เพิ่ม redirect URI ของโดเมน Vercel จริง (ขั้นตอนที่ 2.4)

## บทบาทผู้ใช้งาน (4 ระดับ)

| บทบาท | สิทธิ์หลัก |
|---|---|
| นักศึกษา (student) | กรอก/แก้ไขข้อมูลตนเอง, เลือกอาจารย์ที่ปรึกษา, ส่งข้อความ, นัดหมาย, ดู dashboard ของตนเอง |
| อาจารย์ (advisor) | ดูข้อมูลนักศึกษาที่ตนดูแล (academic/major/co-advisor), บันทึกการปรึกษา, รับรองขั้นตอนวิทยานิพนธ์, ประเมินความก้าวหน้า |
| ผู้บริหารหลักสูตร (executive) | ดูภาพรวมทุกคน, รายงาน, ส่งข้อความ/นัดหมายได้ทุกคน (ไม่เห็นข้อมูลอ่อนไหวส่วนบุคคลในหน้าสรุป) |
| Admin (admin) | จัดการสิทธิ์ผู้ใช้ทั้งหมด (whitelist), แก้ไขข้อมูลทุกอย่าง |

## หมายเหตุด้านเวอร์ชัน/ความปลอดภัย

- Frontend ใช้ **Next.js 14.2.35** (เวอร์ชันเสถียร ไม่ใช่ 15/16) เพื่อความมั่นใจด้าน API ที่คุ้นเคยและ compatibility กับ Vercel — `npm audit` จะแจ้งเตือนช่องโหว่บางรายการที่แก้ได้เฉพาะเมื่ออัปเกรดเป็น Next.js 16 (breaking change) ระบบนี้ไม่ได้ใช้ฟีเจอร์ที่เกี่ยวข้องกับช่องโหว่เหล่านั้นโดยตรง (เช่น custom server WebSocket, image optimizer remotePatterns) แต่ควรพิจารณาอัปเกรดในอนาคตเมื่อ Next.js 16 เสถียรขึ้น
- Apps Script Web App shared secret ต้องไม่ถูก commit ลง git และไม่ควร log ออกมาที่ใดๆ
- ข้อมูลอ่อนไหว (เลขบัตรประชาชน, ที่อยู่, เบอร์โทร, ผู้ติดต่อฉุกเฉิน, บันทึกปรึกษาลับ) ถูกกรองออกจาก endpoint ที่ role=executive เรียก และบันทึกลับ (`IsConfidential=TRUE`) ไม่แสดงต่อนักศึกษา — ตรวจสอบใน `gas-backend/Auth.gs` และ `AdvisingService.gs`
