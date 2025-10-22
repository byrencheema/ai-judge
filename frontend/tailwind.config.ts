import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0B0C0E",
        panel: "#16181C",
        slate: "#2E3238",
        accent: "#00AEEF"
      }
    }
  },
  plugins: []
} satisfies Config;
