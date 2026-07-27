// รัน `prisma migrate deploy` แบบมี retry — กันกรณี Neon (serverless Postgres)
// หลับอยู่ตอน build แล้วต่อไม่ติดใน connect timeout แรก (อาการ: build ล้มที่ ~18 วิ)
// ลองใหม่ไม่กี่ครั้ง = ปลุก DB ให้ตื่นแล้วค่อยผ่านไป next build
import { execSync } from "node:child_process";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    process.exit(0);
  } catch {
    if (attempt === MAX_ATTEMPTS) {
      console.error(
        `prisma migrate deploy ล้มเหลวหลังลอง ${MAX_ATTEMPTS} ครั้ง — หยุด build`,
      );
      process.exit(1);
    }
    console.warn(
      `prisma migrate deploy ครั้งที่ ${attempt} ไม่สำเร็จ — ` +
        `ลองใหม่ใน ${RETRY_DELAY_MS / 1000} วิ (ฐานข้อมูลอาจกำลังตื่น)...`,
    );
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }
}
