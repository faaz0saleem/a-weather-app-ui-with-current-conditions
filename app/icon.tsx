import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 64, height: 64, background: brand.colors.light.ink, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 38, height: 38, borderRadius: 999, border: `7px solid ${brand.colors.light.brand}`, borderTopColor: "rgba(255,255,255,.2)", transform: "rotate(-45deg)" }} />
      </div>
    ),
    size,
  );
}
