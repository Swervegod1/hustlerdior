import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#090909",
        concrete: "#191919",
        paper: "#eeeae3",
        chrome: "#c2c4c5",
        safety: "#ff6254",
        ash: "#93948f",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-body)", "Arial", "sans-serif"],
        mono: ["monospace"],
      },
      backgroundImage: {
        chrome:
          "linear-gradient(110deg,#4d5054,#f7f7f5 35%,#777b80 48%,#e9e9e8 60%,#55595d)",
      },
    },
  },
  plugins: [],
} satisfies Config;
