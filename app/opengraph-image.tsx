import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";

export const alt = `${brand.name} — ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OG() {
  const c = brand.colors.light;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: c.ink, color: c.cream }}>
        <div style={{ fontSize: 34, color: c.brand, fontWeight: 700 }}>{`${brand.name} · ${brand.area}`}</div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, marginTop: 20, letterSpacing: -3 }}>{brand.tagline}</div>
        <div style={{ fontSize: 34, marginTop: 30, opacity: 0.75 }}>Every order races a live 30-minute clock.</div>
      </div>
    ),
    size,
  );
}
