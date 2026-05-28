import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        hc: {
          brand: "#26767f",
          "brand-hover": "#1f636b",
          muted: "#475569",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
