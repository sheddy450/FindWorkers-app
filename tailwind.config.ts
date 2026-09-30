import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      indigo: { DEFAULT: "#1B2559", soft: "#E8EAF4", 700: "#141B45" },   // brand, trust
      marigold: { DEFAULT: "#F5A623", soft: "#FEF3DC" },                  // primary action highlight
      verified: { DEFAULT: "#12805C", soft: "#E3F4EC" },                  // only for approved checks
      danger: { DEFAULT: "#B42318", soft: "#FDECEA" },
      paper: "#F6F7FA", ink: "#171A21", muted: "#5B6472", line: "#DDE1E9",
    },
    fontFamily: { display: ["Bricolage Grotesque", "system-ui", "sans-serif"], sans: ["Public Sans", "system-ui", "sans-serif"] },
    borderRadius: { card: "14px", ctl: "10px" },
  } },
} satisfies Config;
