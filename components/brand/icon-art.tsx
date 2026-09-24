import { brand } from "@/config/brand";

/** App icon artwork for next/og (favicon, apple-touch, PWA icons). */
export function IconArt({ size, maskable = false }: { size: number; maskable?: boolean }) {
  const pad = maskable ? size * 0.18 : size * 0.1;
  const ring = size - pad * 2;
  const stroke = ring * 0.14;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: brand.colors.light.ink,
        borderRadius: maskable ? 0 : size * 0.22,
      }}
    >
      <div
        style={{
          width: ring * 0.78,
          height: ring * 0.78,
          borderRadius: 9999,
          border: `${stroke}px solid ${brand.colors.light.brand}`,
          borderTopColor: "rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(-45deg)",
        }}
      >
        <div style={{ width: stroke * 1.2, height: stroke * 1.2, borderRadius: 9999, background: brand.colors.light.cream }} />
      </div>
    </div>
  );
}
