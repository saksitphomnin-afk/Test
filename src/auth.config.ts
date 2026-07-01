import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (ไม่มีการเรียก Prisma) ใช้ร่วมกับ middleware
 * ตัว provider ที่ต้องใช้ Prisma อยู่ใน src/auth.ts
 */
export const authConfig = {
  // เชื่อถือ host ของแพลตฟอร์ม (Netlify/อื่น ๆ ที่ไม่ใช่ Vercel) — กัน UntrustedHost
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
