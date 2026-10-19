import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";
import { formatDuration, formatPKR } from "@/lib/format";
import { getServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

const fontCache: { data?: Promise<{ display: Buffer; bold: Buffer; medium: Buffer }> } = {};
function fonts() {
  fontCache.data ??= (async () => {
    const dir = path.join(process.cwd(), "assets", "fonts");
    const [display, bold, medium] = await Promise.all([
      readFile(path.join(dir, "BricolageGrotesque-ExtraBold.ttf")),
      readFile(path.join(dir, "PlusJakartaSans-Bold.ttf")),
      readFile(path.join(dir, "PlusJakartaSans-Medium.ttf")),
    ]);
    return { display, bold, medium };
  })();
  return fontCache.data;
}

const C = brand.colors.light;
const STRIP = [C.brand, C.mint, C.chili, C.gold, "#2f5bd3"];

function Strip() {
  return (
    <div style={{ display: "flex", width: "100%", height: 34, overflow: "hidden", background: C.ink }}>
      {Array.from({ length: 40 }, (_, i) => (
        <div
          key={i}
          style={{ width: 34, height: 34, background: STRIP[i % STRIP.length], transform: "rotate(45deg) scale(0.72)", flexShrink: 0 }}
        />
      ))}
    </div>
  );
}

/**
 * Shareable "It's on us" card (1080×1350, Instagram/WhatsApp friendly).
 * No customer PII — just the restaurant, how late, and how much was free.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/share/[id]">) {
  const { id } = await ctx.params;
  const { data: o } = await getServiceSupabase()
    .from("orders")
    .select("code, guarantee_state, free_amount_pkr, late_by_sec, total_pkr, free_cap_pkr, restaurants(name)")
    .eq("id", id)
    .maybeSingle();
  const isFree = o?.guarantee_state === "free";
  const amount = o ? o.free_amount_pkr || Math.min(o.total_pkr, o.free_cap_pkr) : 0;
  const f = await fonts();

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: `linear-gradient(160deg, #F7D774 0%, ${C.gold} 55%, #B98A0E 100%)`, color: C.ink, fontFamily: "Jakarta" }}>
        <Strip />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "70px 80px 60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 76, height: 76, borderRadius: 22, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 999, border: `8px solid ${C.brand}`, borderTopColor: "rgba(255,255,255,.2)" }} />
            </div>
            <div style={{ fontFamily: "Display", fontSize: 50 }}>{brand.name}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 90 }}>
            <div style={{ fontFamily: "Display", fontSize: 170, lineHeight: 0.9, letterSpacing: -6 }}>{isFree ? "It's on us." : brand.tagline.split(",")[0]}</div>
            <div style={{ fontSize: 46, marginTop: 40, maxWidth: 880, lineHeight: 1.25 }}>
              {isFree
                ? `${o?.restaurants?.name ?? "My order"} was ${o?.late_by_sec ? `${formatDuration(o.late_by_sec)} ` : ""}late — so the whole thing was free.`
                : brand.tagline}
            </div>
          </div>

          {isFree && (
            <div style={{ display: "flex", marginTop: 60 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, background: C.ink, color: "#F7D774", borderRadius: 40, padding: "26px 44px", fontFamily: "Display", fontSize: 84 }}>
                {`${formatPKR(amount)} off`}
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 34 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "Display", fontSize: 44 }}>{brand.tagline}</div>
              <div style={{ opacity: 0.75, marginTop: 8 }}>{`${brand.area} · ${brand.websiteUrl.replace(/^https?:\/\//, "")}`}</div>
            </div>
            {o && <div style={{ opacity: 0.6, fontSize: 28 }}>{o.code}</div>}
          </div>
        </div>
        <Strip />
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: "Display", data: f.display, weight: 800, style: "normal" },
        { name: "Jakarta", data: f.bold, weight: 700, style: "normal" },
        { name: "Jakarta", data: f.medium, weight: 500, style: "normal" },
      ],
      headers: { "cache-control": "public, max-age=300" },
    },
  );
}
