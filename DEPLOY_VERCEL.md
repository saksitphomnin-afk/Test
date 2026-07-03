# คู่มือย้ายโฮสต์ไป Vercel (ฟรี — Hobby plan)

ใช้เมื่ออยาก deploy ทันทีโดยไม่ต้องรอ Netlify build minutes รีเซ็ต
Vercel เป็นบ้านของ Next.js เอง โค้ดชุดนี้รองรับอยู่แล้ว **ไม่ต้องแก้โค้ด**

> **ข้อมูลไม่หาย:** ฐานข้อมูล Postgres อยู่นอก Netlify (Neon/Supabase) → Vercel ต่อ DB ตัวเดิม
> ห้อง / ลูกค้า / บัญชีผู้ใช้ทั้งหมดอยู่ครบ ไม่ต้องย้ายข้อมูล

---

## ✅ ฝั่งโค้ด (ทำเรียบร้อยแล้ว)

- `vercel.json` — สั่ง build ให้รัน migration ก่อน build:
  `prisma generate && prisma migrate deploy && next build`
  (migration ทั้งหมด apply กับ DB แล้ว → บน Vercel จะเป็น no-op ปลอดภัย)
- `src/lib/storage.ts` — เลือกที่เก็บรูปอัตโนมัติ: ถ้ามี `BLOB_READ_WRITE_TOKEN` ใช้ **Vercel Blob**
- ไม่แตะ `netlify.toml` → ถ้าอยากกลับไปใช้ Netlify ตอนโควตารีเซ็ต ก็ยังใช้ได้เหมือนเดิม

---

## 📋 ขั้นตอนบน Vercel (ทำครั้งเดียว ~10 นาที)

### 1. สมัคร + import repo
1. เข้า https://vercel.com → **Sign up** ด้วย GitHub (ฟรี)
2. **Add New… → Project** → เลือก repo `saksitphomnin-afk/test`
3. **Import** → ที่ช่อง **Branch** เลือก `claude/condo-stock-web-app-51ipc6`
4. Framework จะถูกตรวจเป็น **Next.js** อัตโนมัติ — ไม่ต้องแก้ Build/Output settings
   (`vercel.json` จัดการ build command ให้แล้ว)

### 2. สร้าง Vercel Blob store (ที่เก็บรูป)
1. ในหน้า project → แท็บ **Storage** → **Create Database** → เลือก **Blob** → Create
2. เชื่อมกับ project → Vercel จะเพิ่ม env `BLOB_READ_WRITE_TOKEN` ให้อัตโนมัติ
   (ถ้าไม่ขึ้นเอง ให้ copy token จากหน้า Blob แล้วไปใส่ในข้อ 3)

### 3. ตั้ง Environment Variables
ไปที่ **Settings → Environment Variables** ใส่ให้ครบ (เลือก scope ทั้ง Production + Preview):

| Key | Value | หมายเหตุ |
|-----|-------|----------|
| `DATABASE_URL` | *(ค่าเดิมจาก Netlify / Neon / Supabase)* | ต้องเป๊ะตัวเดิม ไม่งั้น login ไม่ได้ |
| `AUTH_SECRET` | *(ค่าเดิมจาก Netlify)* | ถ้าไม่มีเก็บไว้ สร้างใหม่ได้: `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` | จำเป็นสำหรับ NextAuth บนโฮสต์ใหม่ |
| `BLOB_READ_WRITE_TOKEN` | *(จากข้อ 2)* | ถ้า Vercel ใส่ให้ตอนสร้าง Blob แล้ว ข้ามได้ |

> **ไม่ต้องใส่** `SEED_ADMIN_*` — DB มีบัญชีแอดมิน + ข้อมูลอยู่แล้ว
> ดู `DATABASE_URL` / `AUTH_SECRET` เดิมได้ที่ Netlify → Site settings → Environment variables

### 4. Deploy
กด **Deploy** → รอ build เสร็จ → เปิด URL ที่ Vercel ให้มา (เช่น `xxx.vercel.app`)

---

## 🧪 ทดสอบหลัง deploy

- [ ] เปิดเว็บเจอหน้า **Login** (ไม่ใช่ error) → login ด้วยแอดมินเดิมได้
- [ ] หน้า **Condo listing** แสดงห้องเดิมครบ (ข้อมูลครบ)
- [ ] **เพิ่มห้องใหม่ + อัปรูป** → รูปขึ้น (เก็บลง Vercel Blob)
- [ ] เปิดห้อง → **ดาวน์โหลดสัญญา PDF** ได้ ภาษาไทยไม่เพี้ยน
- [ ] เมนู **Enquiry** เพิ่ม/ดูลูกค้าได้

---

## ⚠️ เรื่องเดียวที่ต้องรู้: รูปห้องเดิมต้องอัปใหม่

รูปห้อง**เดิม**เก็บใน **Netlify Blobs** → บน Vercel อ่านไม่ได้ (รูปเดิมจะไม่ขึ้น
แต่แอปไม่พัง — แค่ช่องรูปว่าง) ข้อมูลตัวหนังสือทุกอย่าง (ราคา เจ้าของ สถานะ ฯลฯ) อยู่ครบ

**วิธีแก้:** เข้าไปที่ห้องเดิม → แก้ไข → อัปรูปใหม่ (รูปใหม่จะลง Vercel Blob ทำงานปกติ)
ถ้ามีห้องจริงไม่กี่ห้อง ก็อัปใหม่เร็ว

---

## ทางเลือก: ไม่อยากอัปรูปใหม่

รอ Netlify build minutes รีเซ็ตต้นรอบบิลถัดไป แล้ว push ตามปกติ (ฟรี ไม่ต้องย้าย ไม่ต้องอัปรูป)
