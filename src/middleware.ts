import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // ป้องกันทุกเส้นทาง ยกเว้น API, static, ไฟล์รูป
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
