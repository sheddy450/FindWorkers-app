import { ImageResponse } from "next/og";

/** The card shown when a FindWorkers link is shared on WhatsApp, Facebook, X, LinkedIn, etc. */
export const alt = "FindWorkers: trusted artisans near you in Nigeria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const chips = ["Plumbers", "Electricians", "Mechanics", "Tailors", "Carpenters"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "64px 72px", background: "linear-gradient(135deg, #007A49 0%, #006B40 100%)", color: "#FFFFFF", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 20, background: "#FFFFFF", color: "#007A49", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 56, fontWeight: 800 }}>F</div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>FindWorkers</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, maxWidth: 980 }}>Trusted artisans, close to home.</div>
          <div style={{ fontSize: 32, opacity: 0.92 }}>Verified badges · Real reviews · Prices in naira</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {chips.map((c) => (
              <div key={c} style={{ display: "flex", padding: "10px 22px", borderRadius: 999, background: "rgba(255,255,255,0.14)", fontSize: 26, fontWeight: 600 }}>{c}</div>
            ))}
          </div>
          <div style={{ display: "flex", padding: "14px 28px", borderRadius: 999, background: "#FFFFFF", color: "#007A49", fontSize: 28, fontWeight: 700 }}>findworkersapp.com</div>
        </div>
      </div>
    ),
    size,
  );
}
