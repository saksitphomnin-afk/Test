import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // ป้องกันทุกเส้นทาง ยกเว้น API, static, และไฟล์ asset ใน public/ (เช่น โลโก้/ไอคอน/ฟอนต์) —
  // ก่อนหน้านี้ไม่ได้กันไฟล์ asset ทั่วไปไว้ (กันแค่ favicon.ico) ทำให้โลโก้บนหน้า login (ที่ยังไม่ได้
  // ล็อกอิน) โดน middleware เด้งไปหน้า login ซ้อนตัวเอง โหลดรูปไม่ขึ้น
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)",
  ],
};
