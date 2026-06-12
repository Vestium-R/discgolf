import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "rgb(var(--forest-50) / <alpha-value>)",
          100: "rgb(var(--forest-100) / <alpha-value>)",
          200: "rgb(var(--forest-200) / <alpha-value>)",
          300: "rgb(var(--forest-300) / <alpha-value>)",
          400: "rgb(var(--forest-400) / <alpha-value>)",
          500: "rgb(var(--forest-500) / <alpha-value>)",
          600: "rgb(var(--forest-600) / <alpha-value>)",
          700: "rgb(var(--forest-700) / <alpha-value>)",
          800: "rgb(var(--forest-800) / <alpha-value>)",
          900: "rgb(var(--forest-900) / <alpha-value>)",
        },
        badge: "#e9b949",
      },
      fontFamily: {
        display: ["ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
