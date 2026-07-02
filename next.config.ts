import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "@prisma/client"],
  // เพิ่มลิมิตขนาดไฟล์ของ Server Action (ค่าเริ่มต้น 1MB เล็กไปสำหรับรูปถ่าย)
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
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
