import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6f6",
          100: "#d3e8e9",
          500: "#15707a",
          600: "#0f5a63",
          700: "#0c464d",
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
