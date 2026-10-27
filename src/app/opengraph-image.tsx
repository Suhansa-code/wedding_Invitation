import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Dulmi & Isuru. Wedding Invitation. 23 November 2026.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#f8f6f0", padding: 36 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", border: "1px solid #c9b57e", color: "#342f26" }}>
        <div style={{ display: "flex", fontSize: 21, letterSpacing: 7, color: "#897342", marginBottom: 38 }}>WEDDING INVITATION</div>
        <div style={{ display: "flex", fontSize: 90, fontFamily: "serif" }}>Dulmi & Isuru</div>
        <div style={{ display: "flex", width: 100, height: 1, background: "#b59a60", marginTop: 40, marginBottom: 32 }} />
        <div style={{ display: "flex", fontSize: 25, letterSpacing: 3 }}>23 NOVEMBER 2026</div>
      </div>
    </div>, size,
  );
}
