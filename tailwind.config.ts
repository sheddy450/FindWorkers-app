import type { Config } from "tailwindcss";

// iOS system font: San Francisco on iPhone/iPad/Mac, the platform's own UI font elsewhere
// (Roboto on Android, Segoe UI on Windows). SF can't be self-hosted (Apple's licence), and the
// system stack downloads nothing, which also helps on slow mobile data.
const system = ["-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif"];

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      brand: { DEFAULT: "#007A49", soft: "#E6F4EC", 700: "#006B40" },  // green: brand, primary actions, links
      highlight: { DEFAULT: "#34C759", soft: "#E9F8EE" },              // bright green: featured, call-to-action fills (never text on white)
      star: "#F2A900",                                                // ratings only
      verified: { DEFAULT: "#12805C", soft: "#E3F4EC" },              // only for approved checks
      danger: { DEFAULT: "#B42318", soft: "#FDECEA" },
      paper: "#F4F7F5", ink: "#13201A", muted: "#56665D", line: "#DCE5DF",
    },
    fontFamily: {
      display: ["-apple-system", "BlinkMacSystemFont", '"SF Pro Display"', ...system.slice(2)],
      sans: ["-apple-system", "BlinkMacSystemFont", '"SF Pro Text"', ...system.slice(2)],
    },
    borderRadius: { card: "16px", ctl: "12px" },
    boxShadow: { soft: "0 1px 2px rgba(19,32,26,0.04), 0 4px 16px -6px rgba(19,32,26,0.08)" },
  } },
} satisfies Config;
