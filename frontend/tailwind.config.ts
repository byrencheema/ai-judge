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
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'SF Mono',
          'Consolas',
          'Monaco',
          'Courier New',
          'monospace'
        ]
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.625rem',
        '2xl': '0.75rem',
        'full': '9999px'
      }
    }
  },
  plugins: []
} satisfies Config;
