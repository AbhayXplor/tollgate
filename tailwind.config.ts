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
        cyber: {
          bg: "#070b14",
          surface: "#0b1220",
          card: "#0f172a",
          cardHover: "#162038",
          border: "#1e2c4f",
          borderGlow: "#294073",
          accent: "#10b981", // Emerald
          accentGlow: "rgba(16, 185, 129, 0.2)",
          danger: "#ef4444", // Ruby
          dangerGlow: "rgba(239, 68, 68, 0.2)",
          warning: "#f59e0b", // Amber
          warningGlow: "rgba(245, 158, 11, 0.2)",
          cyan: "#06b6d4",
          cyanGlow: "rgba(6, 182, 212, 0.2)",
          text: "#f8fafc",
          dim: "#94a3b8",
          muted: "#64748b",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "Consolas", "Monaco", "monospace"],
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
