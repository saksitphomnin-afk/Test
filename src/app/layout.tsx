import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Place co. — ระบบจัดการสต็อกห้องคอนโด",
  description: "ระบบดูและจัดการสต็อกห้องคอนโดสำหรับทีมอสังหาริมทรัพย์ Place co.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
