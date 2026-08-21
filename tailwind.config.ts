import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // โทนฟ้า-เขียว (teal) สดใส — 600 เลือกเฉดที่ "สว่างที่สุดเท่าที่ยังอ่านออก" บนพื้นขาว
        // (4.76:1 ผ่าน WCAG AA) เพราะ 600 ใช้ทั้งเป็นพื้นปุ่มคู่ตัวหนังสือขาว และสีลิงก์บนพื้นขาว
        brand: {
          50: "#eefbf7",
          100: "#d0f5ec",
          200: "#a3e9dc",
          300: "#6dd7c5",
          400: "#35bda9",
          500: "#12a292", // ฟ้าเขียวสด — จุดเน้น/เส้นขอบตอน focus
          600: "#0a8175", // พื้นปุ่ม + สีลิงก์ (คู่กับตัวหนังสือขาว)
          700: "#0a6961", // hover ของปุ่ม / ตัวหนังสือเน้น
          800: "#0c544e",
          900: "#0b4640",
        },
      },
      fontFamily: {
        sans: ["var(--font-sarabun)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
