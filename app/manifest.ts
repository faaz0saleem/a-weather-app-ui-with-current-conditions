import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} — ${brand.tagline}`,
    short_name: brand.name,
    description: `Food delivery in ${brand.area}. ${brand.tagline}`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: brand.colors.light.cream,
    theme_color: brand.colors.light.ink,
    categories: ["food", "lifestyle", "shopping"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My orders", url: "/orders" },
      { name: "Rider app", url: "/rider" },
      { name: "Kitchen", url: "/restaurant" },
    ],
  };
}
