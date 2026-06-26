import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070a0f",
        panel: "#111721",
        panelSoft: "#161d2a",
        textMain: "#f5f7fb",
        textMuted: "#93a1b8",
        comet: "#ff6b35",
        satellite: "#39a8ff",
        star: "#ffd166",
        accent: "#68f3bf"
      },
      boxShadow: {
        glow: "0 0 24px rgba(104, 243, 191, 0.22)"
      }
    }
  },
  plugins: []
} satisfies Config;
