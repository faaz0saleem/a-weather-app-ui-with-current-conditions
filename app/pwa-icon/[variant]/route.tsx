import { ImageResponse } from "next/og";
import { IconArt } from "@/components/brand/icon-art";

/** PWA icons: /pwa-icon/192, /pwa-icon/512, /pwa-icon/maskable (512, full-bleed safe zone). */
export async function GET(_req: Request, ctx: RouteContext<"/pwa-icon/[variant]">) {
  const { variant } = await ctx.params;
  const maskable = variant === "maskable";
  const size = variant === "192" ? 192 : 512;
  return new ImageResponse(<IconArt size={size} maskable={maskable} />, {
    width: size,
    height: size,
    headers: { "cache-control": "public, max-age=604800, immutable" },
  });
}
