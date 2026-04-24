import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f1f7f2",
          100: "#dfeade",
          200: "#c0d5bf",
          300: "#9bbb9a",
          400: "#6f9a73",
          500: "#4e7c54",
          600: "#3b6441",
          700: "#305036",
          800: "#28402d",
          900: "#1f3323",
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
