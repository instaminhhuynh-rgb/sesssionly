import type { Config } from "tailwindcss";

// Calm Professional design tokens.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F6F4",
        surface: "#FFFFFF",
        line: "#E7E7E3",
        ink: "#1C1C1E",
        muted: "#6E6E73",
        faint: "#9A9A9F",
        accent: "#3E5C76",
        accentSoft: "#EEF2F6",
        good: "#15803D",
        goodSoft: "#ECFDF3",
        warn: "#B45309",
        warnSoft: "#FFFBEB",
        bad: "#BE123C",
        badSoft: "#FFF1F2",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "14px",
      },
      maxWidth: {
        app: "1320px",
      },
    },
  },
  plugins: [],
};

export default config;
