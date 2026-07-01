import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
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
