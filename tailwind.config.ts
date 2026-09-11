import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: "#fbfbfd",
          surface: "#ffffff",
          subtle: "#f5f5f7",
          border: "rgba(0, 0, 0, 0.08)",
          borderHover: "rgba(0, 0, 0, 0.16)",
          text: "#1d1d1f",
          secondary: "#515154",
          // #86868b fails AA for small text on white; #6e6e73 is Apple's own AA-safe step.
          muted: "#6e6e73",
          faint: "#86868b",
          blue: "#0071e3",
          blueHover: "#0077ed",
          blueSubtle: "rgba(0, 113, 227, 0.08)",
          green: "#34c759",
          greenDark: "#248a3d",
          greenSubtle: "rgba(52, 199, 89, 0.12)",
          red: "#ff3b30",
          redDark: "#d70015",
          redSubtle: "rgba(255, 59, 48, 0.08)",
          amber: "#ff9500",
          amberDark: "#b25e00",
          amberSubtle: "rgba(255, 149, 0, 0.1)",
          indigo: "#5856d6",
          teal: "#0e9bb0",
          purple: "#af52de",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Inter"',
          "system-ui",
          "sans-serif",
        ],
        mono: ['"SF Mono"', "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        stage: "28px",
        panel: "18px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.035), 0 1px 2px rgba(0, 0, 0, 0.02)",
        lift: "0 10px 30px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
        thumb: "0 1px 1px rgba(0, 0, 0, 0.06), 0 3px 8px rgba(0, 0, 0, 0.15)",
        pill: "0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.06)",
      },
      keyframes: {
        typing: {
          "0%, 60%, 100%": { opacity: "0.25", transform: "translateY(0)" },
          "30%": { opacity: "1", transform: "translateY(-2px)" },
        },
      },
      animation: {
        typing: "typing 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
