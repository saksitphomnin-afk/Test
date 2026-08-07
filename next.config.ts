import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "@prisma/client"],
  // เพิ่มลิมิตขนาดไฟล์ของ Server Action (ค่าเริ่มต้น 1MB เล็กไปสำหรับรูปถ่าย) — ปรับเป็น 100MB
  // เผื่ออัปโหลดรูปเฟอร์นิเจอร์ทีละ 15-20 รูปพร้อมกัน (รูปจากมือถือรูปละ ~3-6MB รวมกันหลักร้อย MB ได้)
  // middlewareClientMaxBodySize ต้องปรับด้วย เพราะ auth middleware (src/middleware.ts) ครอบทุก
  // route รวมถึง server action นี้ และมีลิมิตแยกต่างหากของตัวเอง (ค่าเริ่มต้นแค่ 10MB) — ถ้าไม่ปรับ
  // ตัวนี้ด้วย จะโดนตัด request ที่ตัว middleware ก่อนถึง bodySizeLimit ข้างบนเลย
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    middlewareClientMaxBodySize: "100mb",
  },
  // รวม Prisma query engine + ฟอนต์ PDF เข้า serverless function bundle (จำเป็นบน Netlify/Lambda)
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client/**/*", "./public/fonts/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
