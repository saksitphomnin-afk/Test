# Condo Stock — ระบบจัดการสต็อกห้องคอนโด

Web App สำหรับทีมอสังหาริมทรัพย์ ใช้ดูและจัดการสต็อกห้องคอนโด (เจ้าของ, เบอร์โทร, สถานะ, รูปภาพ),
บันทึก Remark อัปเดตความคืบหน้าถึงกันในทีม และออกสัญญาเช่า/ซื้อขายเป็นไฟล์ PDF
ออกแบบให้เรียบ ใช้งานง่าย รองรับทั้งมือถือและ PC

## ฟีเจอร์
- 🔐 **Login** — บัญชีสร้างโดยแอดมิน (มีสิทธิ์ ADMIN / MEMBER)
- 🏢 **สต็อกห้อง** — รายการห้องพร้อมรูป, สถานะแบบสี (ว่าง/จอง/เช่าแล้ว/ขายแล้ว)
- 🔎 **ค้นหา/กรอง** — ตามชื่อโครงการ / เลขห้อง / เจ้าของ / เบอร์โทร และกรองตามสถานะ
- ➕ **เพิ่ม/แก้ไขห้อง** — อัปโหลดได้หลายรูป + แกลเลอรี
- 💬 **Remark + ประวัติ** — ทุกการอัปเดตบันทึกชื่อผู้บันทึกและเวลา
- 📄 **สัญญาเช่า/ซื้อขาย** — กรอกฟอร์ม (เติมข้อมูลจากห้องอัตโนมัติ) แล้วดาวน์โหลดเป็น PDF (ฟอนต์ไทย Sarabun)
- 👥 **จัดการผู้ใช้** — แอดมินสร้าง/ลบบัญชี และรีเซ็ตรหัสผ่าน

## เทคโนโลยี
Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma + PostgreSQL ·
Auth.js (NextAuth v5) · Vercel Blob · @react-pdf/renderer

## เริ่มต้นใช้งาน (Local)

1. ติดตั้ง dependencies
   ```bash
   npm install
   ```
2. ตั้งค่า environment — คัดลอก `.env.example` เป็น `.env` แล้วกรอกค่า
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL` — PostgreSQL (แนะนำ Neon / Vercel Postgres / Supabase)
   - `AUTH_SECRET` — สร้างด้วย `npx auth secret` หรือ `openssl rand -base64 32`
   - `BLOB_READ_WRITE_TOKEN` — จาก Vercel Blob (ถ้าเว้นว่างตอน dev รูปจะถูกเก็บใน `public/uploads`)
3. สร้างตารางฐานข้อมูล + บัญชีแอดมินเริ่มต้น
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
   บัญชีเริ่มต้น: `admin@condostock.local` / `admin1234` (แก้ได้ผ่าน env `SEED_ADMIN_*`)
4. รันเซิร์ฟเวอร์
   ```bash
   npm run dev
   ```
   เปิด http://localhost:3000

## Deploy บน Vercel
1. Push โค้ดขึ้น GitHub แล้ว Import โปรเจกต์ใน Vercel
2. เพิ่ม Environment Variables: `DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`
3. สร้าง Vercel Postgres + Vercel Blob (Storage tab)
4. รัน migration กับฐานข้อมูล production: `npx prisma migrate deploy` แล้ว `npx prisma db seed`

## หมายเหตุเรื่องแบบฟอร์มสัญญา
ฟอร์มสัญญาปัจจุบันเป็นโครงมาตรฐาน (ผู้ให้เช่า/ผู้เช่า, ผู้ขาย/ผู้ซื้อ, ทรัพย์สิน, เงื่อนไข, ลายเซ็น)
สามารถปรับฟิลด์และเลย์เอาต์ให้ตรงกับไฟล์ตัวอย่างสัญญาได้ที่:
- ฟิลด์/ส่วนต่าง ๆ: `src/lib/contract.ts`
- เลย์เอาต์ PDF: `src/lib/contract-pdf.tsx`
